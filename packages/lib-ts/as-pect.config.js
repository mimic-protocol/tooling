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
    let exports // Imports can reference this

    const tokenPrices = new Map()

    const myImports = {
      env: {
        memory,
        'console.log': (ptr) => {
          const string = exports.__getString(ptr)
          console.log(string)
        },
      },
      environment: {
        _getPrice: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = paramsStr.split(',')
          const address = params[0]
          const chainId = params[1]
          const key = `${address}:${chainId}`

          // Check if the price is set, if not, return default price
          const price = tokenPrices.has(key) ? tokenPrices.get(key) : (1 * 10 ** 18).toString()

          return exports.__newString(price)
        },
      },
      helpers: {
        _setTokenPrice: (addressPtr, chainId, pricePtr) => {
          const address = exports.__getString(addressPtr)
          const price = exports.__getString(pricePtr)
          const key = `${address}:${chainId}`
          tokenPrices.set(key, price)
        },
      },
    }

    let instance = instantiate(binary, createImports(myImports))
    instance.then((i) => {
      exports = i.exports
    })
    return instance
  },
  /**
   * Specify if the binary wasm file should be written to the file system.
   */
  outputBinary: false,
}
