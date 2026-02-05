import { Command, Flags } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import * as fs from 'fs'
import { join, resolve } from 'path'

import { GENERIC_SUGGESTION } from '../errors'
import { ProfileCredentials } from '../lib/CredentialsManager'
import log from '../log'
import { FlagsType } from '../types'

import Authenticate from './authenticate'
import Build from './build'
import Functions from './functions'

const MIMIC_REGISTRY_DEFAULT = 'https://api-protocol.mimic.fi'

export type DeployFlags = FlagsType<typeof Deploy>

export default class Deploy extends Command {
  static override description =
    'Uploads your compiled function artifacts to IPFS and registers it into the Mimic Registry'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --build-directory ./build',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --api-key MY_KEY --build-directory ./build',
  ]

  static override flags = {
    ...Functions.flags,
    ...Authenticate.flags,
    ...Build.flags,
    'build-directory': Flags.string({
      char: 'b',
      description: 'Output directory for compilation, or input directory for deployment when --skip-build is used',
      default: './build',
    }),
    url: Flags.string({ char: 'u', description: `Mimic Registry base URL`, default: MIMIC_REGISTRY_DEFAULT }),
    'skip-build': Flags.boolean({ description: 'Skip codegen and compile steps before uploading', default: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy)
    await Functions.runFunctions(this, flags, Deploy.deploy, 'deployment')
  }

  public static async deploy(cmd: Command, flags: DeployFlags): Promise<void> {
    const { 'build-directory': buildDir, 'skip-build': skipBuild, url: registryUrl } = flags
    const absBuildDir = resolve(buildDir)

    let credentials = Authenticate.authenticate(cmd, flags)

    if (!skipBuild) await Build.build(cmd, flags)

    log.startAction('Validating')

    if (!fs.existsSync(absBuildDir) && skipBuild)
      cmd.error(`Directory ${log.highlightText(absBuildDir)} does not exist`, {
        code: 'Directory Not Found',
        suggestions: ['Use the --build-directory flag to specify the correct path'],
      })

    const neededFiles = ['manifest.json', 'function.wasm'].map((file) => join(absBuildDir, file))
    for (const file of neededFiles) {
      if (!fs.existsSync(file))
        cmd.error(`Could not find ${file}`, {
          code: 'File Not Found',
          suggestions: [`Use ${log.highlightText('mimic compile')} to generate the needed files`],
        })
    }

    log.startAction('Uploading to Mimic Registry')
    const CID = await this.uploadToRegistry(cmd, neededFiles, credentials, registryUrl)
    console.log(`IPFS CID: ${log.highlightText(CID)}`)
    log.stopAction()

    fs.writeFileSync(join(absBuildDir, 'CID.json'), JSON.stringify({ CID }, null, 2))
    console.log(`CID saved at ${log.highlightText(absBuildDir)}`)
    console.log(`Function deployed!`)
  }

  private static async uploadToRegistry(
    cmd: Command,
    files: string[],
    credentials: ProfileCredentials,
    registryUrl: string
  ): Promise<string> {
    try {
      const form = this.filesToForm(files)
      const { data } = await axios.post(`${registryUrl}/functions`, form, {
        headers: {
          'x-api-key': credentials.apiKey,
          'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`,
        },
      })
      return data.CID
    } catch (err) {
      this.handleError(cmd, err, 'Failed to upload to registry')
    }
  }

  private static handleError(cmd: Command, err: unknown, message: string): never {
    if (!(err instanceof AxiosError)) cmd.error(err as Error)
    const statusCode = err.response?.status
    if (statusCode === 400) {
      const errMessage = err.response?.data?.content?.message || message
      cmd.error(errMessage, { code: 'Bad Request', suggestions: ['Review the uploaded files'] })
    }
    if (statusCode === 401) cmd.error(message, { code: 'Unauthorized', suggestions: ['Review your key'] })
    if (statusCode === 403) cmd.error(message, { code: 'Invalid api key', suggestions: ['Review your key'] })
    cmd.error(`${message} - ${err.message}`, { code: `${statusCode} Error`, suggestions: GENERIC_SUGGESTION })
  }

  private static filesToForm(files: string[]): FormData {
    return files.reduce((form, file) => {
      const fileStream = fs.createReadStream(file)
      const filename = file.split('/').pop()
      form.append('file', fileStream, { filename })
      return form
    }, new FormData())
  }
}
