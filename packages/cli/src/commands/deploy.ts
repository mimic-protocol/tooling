import { Flags } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import * as fs from 'fs'
import { join, resolve } from 'path'

import { DEFAULT_TASK } from '../constants'
import { GENERIC_SUGGESTION } from '../errors'
import { filterTasks, taskFilterFlags } from '../helpers'
import { ProfileCredentials } from '../lib/CredentialsManager'
import MimicConfigHandler from '../lib/MimicConfigHandler'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'
import { RequiredTaskConfig } from '../types'

import Authenticate from './authenticate'

const MIMIC_REGISTRY_DEFAULT = 'https://api-protocol.mimic.fi'

export default class Deploy extends Authenticate {
  static override description = 'Uploads your compiled task artifacts to IPFS and registers it into the Mimic Registry'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --input ./dist --output ./dist',
    '<%= config.bin %> <%= command.id %> --profile staging',
    '<%= config.bin %> <%= command.id %> --api-key MY_KEY --input ./dist --output ./dist',
  ]

  static override flags = {
    ...Authenticate.flags,
    input: Flags.string({ char: 'i', description: 'Directory containing the compiled artifacts', default: './build' }),
    output: Flags.string({ char: 'o', description: 'Output directory for deployment CID', default: './build' }),
    url: Flags.string({ char: 'u', description: `Mimic Registry base URL`, default: MIMIC_REGISTRY_DEFAULT }),
    'skip-compile': Flags.boolean({ description: 'Skip codegen and compile steps before uploading', default: false }),
    ...taskFilterFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy)
    const { profile, 'api-key': apiKey, input, output, 'skip-compile': skipCompile, url, include, exclude } = flags

    if (MimicConfigHandler.exists()) {
      const mimicConfig = MimicConfigHandler.load(this)
      const allTasks = MimicConfigHandler.getTasks(mimicConfig)
      const tasks = filterTasks(this, allTasks, include, exclude)
      for (const task of tasks) {
        console.log(`\n${log.highlightText(`[${task.name}]`)}`)
        await this.runForTask(task, url, skipCompile, task.output, profile, apiKey)
      }
    } else {
      await this.runForTask({ ...DEFAULT_TASK, output }, url, skipCompile, input, profile, apiKey)
    }
  }

  private async runForTask(
    task: Omit<RequiredTaskConfig, 'name'>,
    registryUrl: string,
    skipCompile: boolean,
    inputDir: string,
    profile?: string,
    apiKey?: string
  ): Promise<void> {
    const inputPath = resolve(inputDir)
    const outputPath = resolve(task.output)

    const credentials = this.authenticate({ profile, 'api-key': apiKey })

    if (!skipCompile) {
      const build = execBinCommand(
        'mimic',
        [
          'build',
          '--manifest',
          task.manifest,
          '--task',
          task.path,
          '--output',
          inputPath,
          '--types',
          task.types,
          '--skip-config',
        ],
        process.cwd()
      )
      if (build.status !== 0) {
        this.error('Build failed', { code: 'BuildError', suggestions: ['Check the task source code and manifest'] })
      }
    }

    log.startAction('Validating')

    if (!fs.existsSync(inputPath)) {
      this.error(`Directory ${log.highlightText(inputPath)} does not exist`, {
        code: 'Directory Not Found',
        suggestions: ['Use the --input flag to specify the correct path'],
      })
    }

    const neededFiles = ['manifest.json', 'task.wasm'].map((file) => join(inputPath, file))
    for (const file of neededFiles) {
      if (!fs.existsSync(file)) {
        this.error(`Could not find ${file}`, {
          code: 'File Not Found',
          suggestions: [`Use ${log.highlightText('mimic compile')} to generate the needed files`],
        })
      }
    }

    log.startAction('Uploading to Mimic Registry')
    const CID = await this.uploadToRegistry(neededFiles, credentials, registryUrl)
    console.log(`IPFS CID: ${log.highlightText(CID)}`)
    log.stopAction()

    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true })
    fs.writeFileSync(join(outputPath, 'CID.json'), JSON.stringify({ CID }, null, 2))
    console.log(`CID saved at ${log.highlightText(outputPath)}`)
    console.log(`Task deployed!`)
  }

  private async uploadToRegistry(
    files: string[],
    credentials: ProfileCredentials,
    registryUrl: string
  ): Promise<string> {
    try {
      const form = filesToForm(files)
      const { data } = await axios.post(`${registryUrl}/tasks`, form, {
        headers: {
          'x-api-key': credentials.apiKey,
          'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`,
        },
      })
      return data.CID
    } catch (err) {
      this.handleError(err, 'Failed to upload to registry')
    }
  }

  private handleError(err: unknown, message: string): never {
    if (!(err instanceof AxiosError)) this.error(err as Error)
    const statusCode = err.response?.status
    if (statusCode === 400) {
      const errMessage = err.response?.data?.content?.message || message
      this.error(errMessage, { code: 'Bad Request', suggestions: ['Review the uploaded files'] })
    }
    if (statusCode === 401) this.error(message, { code: 'Unauthorized', suggestions: ['Review your key'] })
    if (statusCode === 403) this.error(message, { code: 'Invalid api key', suggestions: ['Review your key'] })
    this.error(`${message} - ${err.message}`, { code: `${statusCode} Error`, suggestions: GENERIC_SUGGESTION })
  }
}

const filesToForm = (files: string[]): FormData => {
  return files.reduce((form, file) => {
    const fileStream = fs.createReadStream(file)
    const filename = file.split('/').pop()
    form.append('file', fileStream, { filename })
    return form
  }, new FormData())
}
