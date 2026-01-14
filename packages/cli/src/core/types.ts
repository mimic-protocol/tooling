export interface CommandResult {
  /** Whether the operation succeeded */
  success: boolean
}

// ============================================================================
// Codegen Types
// ============================================================================

export interface CodegenOptions {
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

export interface CompileOptions {
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

export interface BuildOptions {
  /** Path to the manifest.yaml file */
  manifestPath: string
  /** Path to the task TypeScript file */
  taskPath: string
  /** Output directory for build artifacts */
  outputDir: string
  /** Output directory for generated types */
  typesDir: string
  /** Whether to delete existing types before generating */
  clean: boolean
  /** Callback for confirming clean operation */
  confirmClean?: () => Promise<boolean>
  /** Working directory for build */
  cwd?: string
}

// ============================================================================
// Deploy Types
// ============================================================================

export interface DeployOptions {
  /** Directory containing compiled artifacts (task.wasm, manifest.json) */
  inputDir: string
  /** Output directory for CID.json */
  outputDir: string
  /** API key for authentication */
  apiKey: string
  /** Registry URL */
  registryUrl: string
}

export interface DeployResult {
  /** IPFS CID of the deployed task */
  cid: string
}

// ============================================================================
// Test Types
// ============================================================================

export interface RunTestsOptions {
  /** Glob patterns for test files */
  testPaths: string[]
  /** Base directory for running tests */
  baseDir: string
}

// ============================================================================
// Logging Interface
// ============================================================================

export interface Logger {
  startAction(message: string): void
  stopAction(): void
  info(message: string): void
}
