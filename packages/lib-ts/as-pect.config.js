export default {
  /**
   * A set of globs passed to the glob package that qualify typescript files for testing.
   */
  entries: ['tests/**/*.spec.ts'],
  /**
   * A set of globs passed to the glob package that qualify files to be added to each test.
   */
  include: ['tests/**/*.include.ts'],
  /**
   * A set of regexp that will disclude source files from testing.
   */
  disclude: [/node_modules/],
  /**
   * Add your required AssemblyScript imports here.
   */
  async instantiate(memory, createImports, instantiate, binary) {
    let instance // Imports can reference this
    const myImports = {
      env: {
        memory,
        'console.log': (ptr) => {
          instance.then((i) => {
            const string = i.exports.__getString(ptr)
            console.log(string)
          })
        },
      },
    }

    instance = instantiate(binary, createImports(myImports))
    return instance
  },
  /**
   * Specify if the binary wasm file should be written to the file system.
   */
  outputBinary: false,
}
