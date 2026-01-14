const GENERIC_SUGGESTION = [
  'Contact the Mimic team for further assistance at our website https://www.mimic.fi or discord https://discord.mimic.fi',
]

export class CoreError extends Error {
  public code: string
  public suggestions: string[]

  constructor(message: string, options: { code: string; suggestions?: string[] }) {
    super(message)
    this.name = this.constructor.name
    this.code = options.code
    this.suggestions = options.suggestions ?? GENERIC_SUGGESTION
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class FileNotFoundError extends CoreError {
  public filePath: string

  constructor(filePath: string, suggestions?: string[]) {
    super(`File not found: ${filePath}`, {
      code: 'FileNotFound',
      suggestions: suggestions ?? [`Check that the file exists at: ${filePath}`],
    })
    this.filePath = filePath
  }
}

export class DirectoryNotFoundError extends CoreError {
  public dirPath: string

  constructor(dirPath: string, suggestions?: string[]) {
    super(`Directory not found: ${dirPath}`, {
      code: 'DirectoryNotFound',
      suggestions: suggestions ?? [`Check that the directory exists at: ${dirPath}`],
    })
    this.dirPath = dirPath
  }
}

export class ManifestValidationError extends CoreError {
  constructor(message: string, suggestions?: string[]) {
    super(message, {
      code: 'ManifestValidationError',
      suggestions: suggestions ?? ['Check the manifest.yaml file for errors'],
    })
  }
}

export class CodegenError extends CoreError {
  constructor(message: string, suggestions?: string[]) {
    super(message, {
      code: 'CodegenError',
      suggestions: suggestions ?? ['Check the manifest.yaml file and ABI files'],
    })
  }
}

export class CompilationError extends CoreError {
  constructor(message: string, suggestions?: string[]) {
    super(message, {
      code: 'CompilationError',
      suggestions: suggestions ?? ['Check the AssemblyScript file for syntax errors'],
    })
  }
}

export class DeployError extends CoreError {
  public statusCode?: number

  constructor(message: string, options?: { statusCode?: number; suggestions?: string[] }) {
    super(message, {
      code: options?.statusCode ? `Deploy${options.statusCode}Error` : 'DeployError',
      suggestions: options?.suggestions ?? ['Check your API key and network connection'],
    })
    this.statusCode = options?.statusCode
  }
}
