export type CommandResult = {
  /** Whether the operation succeeded */
  success: boolean
}

// ============================================================================
// Codegen Types
// ============================================================================

export type CodegenOptions = {
  /** Path to the manifest.yaml file */
  manifestPath: string
  /** Output directory for generated types */
  outputDir: string
  /** Whether to delete existing files before generating */
  clean: boolean
  /** Callback for confirming clean operation (returns true to proceed) */
  confirmClean?: () => Promise<boolean>
}

// ============================================================================
// Compile Types
// ============================================================================

export type CompileOptions = {
  /** Path to the manifest.yaml file */
  manifestPath: string
  /** Path to the task TypeScript file */
  taskPath: string
  /** Output directory for compiled artifacts */
  outputDir: string
  /** Working directory for compilation */
  cwd?: string
}

// ============================================================================
// Build Types
// ============================================================================

export type BuildOptions = Omit<CodegenOptions, 'outputDir'> &
  CompileOptions & {
    /** Output directory for generated types (from codegen) */
    typesDir: string
  }

// ============================================================================
// Deploy Types
// ============================================================================

export type DeployOptions = {
  /** Directory containing compiled artifacts (task.wasm, manifest.json) */
  inputDir: string
  /** Output directory for CID.json */
  outputDir: string
  /** API key for authentication */
  apiKey: string
  /** Registry URL */
  registryUrl: string
}

export type DeployResult = {
  /** IPFS CID of the deployed task */
  cid: string
}

// ============================================================================
// Test Types
// ============================================================================

export type RunTestsOptions = {
  /** Glob patterns for test files */
  testPaths: string[]
  /** Base directory for running tests */
  baseDir: string
}

// ============================================================================
// Logging Interface
// ============================================================================

export type Logger = {
  startAction(message: string): void
  stopAction(): void
  info(message: string): void
}
