import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import * as fs from 'fs'
import { join } from 'path'

import { defaultLogger } from '../log'

import { DeployError, DirectoryNotFoundError, FileNotFoundError } from './errors'
import { DeployOptions, DeployResult, Logger } from './types'

export const MIMIC_REGISTRY_DEFAULT = 'https://api-protocol.mimic.fi'
const REQUIRED_FILES = ['manifest.json', 'task.wasm']

function validateInputDirectory(inputDir: string): string[] {
  if (!fs.existsSync(inputDir)) {
    throw new DirectoryNotFoundError(inputDir, ['Use the --input flag to specify the correct path'])
  }

  const neededFiles = REQUIRED_FILES.map((file) => join(inputDir, file))

  for (const file of neededFiles) {
    if (!fs.existsSync(file)) throw new FileNotFoundError(file, ['Use `mimic compile` to generate the needed files'])
  }

  return neededFiles
}

function filesToForm(files: string[]): FormData {
  return files.reduce((form, file) => {
    const fileStream = fs.createReadStream(file)
    const filename = file.split('/').pop()
    form.append('file', fileStream, { filename })
    return form
  }, new FormData())
}

async function uploadToRegistry(files: string[], apiKey: string, registryUrl: string): Promise<string> {
  try {
    const form = filesToForm(files)
    const { data } = await axios.post(`${registryUrl}/tasks`, form, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${form.getBoundary()}`,
      },
    })
    return data.CID
  } catch (err) {
    handleUploadError(err)
  }
}

function handleUploadError(err: unknown): never {
  if (!(err instanceof AxiosError)) {
    const message = err instanceof Error ? err.message : String(err)
    throw new DeployError(message)
  }

  const statusCode = err.response?.status

  switch (statusCode) {
    case 400: {
      const errMessage = err.response?.data?.content?.message || 'Bad request'
      throw new DeployError(errMessage, {
        statusCode,
        suggestions: ['Review the uploaded files'],
      })
    }
    case 401:
      throw new DeployError('Unauthorized', {
        statusCode,
        suggestions: ['Review your API key'],
      })
    case 403:
      throw new DeployError('Invalid API key', {
        statusCode,
        suggestions: ['Review your API key'],
      })
    default: {
      const message = err.message ? `Upload failed: ${err.message}` : 'Upload failed'
      throw new DeployError(message, {
        statusCode,
      })
    }
  }
}

export async function deploy(options: DeployOptions, logger: Logger = defaultLogger): Promise<DeployResult> {
  const { inputDir, outputDir, apiKey, registryUrl = MIMIC_REGISTRY_DEFAULT } = options

  logger.startAction('Validating')
  const files = validateInputDirectory(inputDir)

  logger.startAction('Uploading to Mimic Registry')
  const cid = await uploadToRegistry(files, apiKey, registryUrl)

  logger.stopAction()

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const cidJsonPath = join(outputDir, 'CID.json')
  fs.writeFileSync(cidJsonPath, JSON.stringify({ CID: cid }, null, 2))

  return { cid }
}
