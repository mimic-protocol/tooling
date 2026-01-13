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

export interface CodegenResult {
  /** List of generated files */
  generatedFiles: string[]
  /** Whether any files were generated */
  success: boolean
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

export interface CompileResult {
  /** Path to the generated WASM file */
  wasmPath: string
  /** Path to the generated manifest.json */
  manifestJsonPath: string
  /** Whether compilation succeeded */
  success: boolean
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

export interface BuildResult {
  /** Result from codegen step */
  codegen: CodegenResult
  /** Result from compile step */
  compile: CompileResult
  /** Whether the entire build succeeded */
  success: boolean
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
  /** Path to the generated CID.json file */
  cidJsonPath: string
  /** Whether deployment succeeded */
  success: boolean
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

export interface RunTestsResult {
  /** Exit code from test runner */
  exitCode: number
  /** Whether tests passed */
  success: boolean
}

// ============================================================================
// Task Configuration
// ============================================================================

export interface TaskConfig {
  name: string
  manifestPath: string
  taskPath: string
  outputDir: string
  typesDir: string
}

// ============================================================================
// Logging Interface
// ============================================================================

export interface Logger {
  startAction(message: string): void
  stopAction(): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
  success(message: string): void
}
