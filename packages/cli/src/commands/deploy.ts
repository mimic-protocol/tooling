import { Command, Flags } from '@oclif/core'
import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import * as fs from 'fs'
import { join, resolve } from 'path'

import { GENERIC_SUGGESTION } from '../errors'
import { execBinCommand } from '../lib/packageManager'
import log from '../log'

const MIMIC_REGISTRY_DEFAULT = 'https://api-protocol.mimic.fi'

export default class Deploy extends Command {
  static override description = 'Uploads your compiled task artifacts to IPFS and registers it into the Mimic Registry'

  static override examples = ['<%= config.bin %> <%= command.id %> --input ./dist --key MY_KEY --output ./dist']

  static override flags = {
    key: Flags.string({ char: 'k', description: 'Your account deployment key', required: true }),
    input: Flags.string({ char: 'i', description: 'Directory containing the compiled artifacts', default: './build' }),
    output: Flags.string({ char: 'o', description: 'Output directory for deployment CID', default: './build' }),
    url: Flags.string({ char: 'u', description: `Mimic Registry base URL`, default: MIMIC_REGISTRY_DEFAULT }),
    'skip-compile': Flags.boolean({ description: 'Skip codegen and compile steps before uploading', default: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy)
    const { key, input: inputDir, output: outputDir, 'skip-compile': skipCompile, url: registryUrl } = flags
    const fullInputDir = resolve(inputDir)
    const fullOutputDir = resolve(outputDir)

    if (!skipCompile) {
      const codegen = execBinCommand('mimic', ['codegen'], process.cwd())
      if (codegen.status !== 0)
        this.error('Code generation failed', { code: 'CodegenError', suggestions: ['Fix manifest and ABI files'] })

      const compile = execBinCommand('mimic', ['compile', '--output', fullInputDir], process.cwd())
      if (compile.status !== 0)
        this.error('Compilation failed', { code: 'BuildError', suggestions: ['Check the task source code'] })
    }

    log.startAction('Validating')

    if (!fs.existsSync(fullInputDir))
      this.error(`Directory ${log.highlightText(fullInputDir)} does not exist`, {
        code: 'Directory Not Found',
        suggestions: ['Use the --input flag to specify the correct path'],
      })

    const neededFiles = ['manifest.json', 'task.wasm'].map((file) => join(fullInputDir, file))
    for (const file of neededFiles) {
      if (!fs.existsSync(file))
        this.error(`Could not find ${file}`, {
          code: 'File Not Found',
          suggestions: [`Use ${log.highlightText('mimic compile')} to generate the needed files`],
        })
    }

    log.startAction('Uploading to Mimic Registry')
    const CID = await this.uploadToRegistry(neededFiles, key, registryUrl)
    console.log(`IPFS CID: ${log.highlightText(CID)}`)
    log.stopAction()

    if (!fs.existsSync(fullOutputDir)) fs.mkdirSync(fullOutputDir, { recursive: true })
    fs.writeFileSync(join(fullOutputDir, 'CID.json'), JSON.stringify({ CID }, null, 2))
    console.log(`CID saved at ${log.highlightText(fullOutputDir)}`)
    console.log(`Task deployed!`)
  }

  private async uploadToRegistry(files: string[], key: string, registryUrl: string): Promise<string> {
    try {
      const form = filesToForm(files)
      const { data } = await axios.post(`${registryUrl}/tasks`, form, {
        headers: {
          'x-api-key': key,
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
