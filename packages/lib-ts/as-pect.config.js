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

    const store = new Map()

    const myImports = {
      env: {
        memory,
        'console.log': (ptr) => {
          const string = exports.__getString(ptr)
          console.log(string)
        },
      },
      evm: {
        _decode: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = paramsStr.split('(')[1].split(')')[0].split(',')
          const abiType = params[0]
          const hex = params[1]
          const key = `_evmDecode:${abiType}:${hex}`
          const decoded = store.has(key) ? store.get(key) : ''
          return exports.__newString(decoded)
        },
      },
      environment: {
        _getPrice: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = paramsStr.split(',')
          const address = params[0]
          const chainId = params[1]
          const key = `_getPrice:${address}:${chainId}`

          // Check if the price is set, if not, return default price
          const price = store.has(key) ? store.get(key) : (1 * 10 ** 18).toString()

          return exports.__newString(price)
        },
        _contractCall: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = paramsStr.split(',')
          const target = params[0]
          const chainId = params[1]
          const data = params[3]
          const key = `_contractCall:${target}:${chainId}:${data}`
          const result = store.has(key) ? store.get(key) : '0x00'

          return exports.__newString(result)
        },
      },
      helpers: {
        _setTokenPrice: (addressPtr, chainId, pricePtr) => {
          const address = exports.__getString(addressPtr)
          const price = exports.__getString(pricePtr)
          const key = `_getPrice:${address}:${chainId}`
          store.set(key, price)
        },
        setContractCall: (targetPtr, chainId, dataPtr, resultPtr) => {
          const target = exports.__getString(targetPtr)
          const data = exports.__getString(dataPtr)
          const result = exports.__getString(resultPtr)
          const key = `_contractCall:${target}:${chainId}:${data}`
          store.set(key, result)
        },
        setEvmDecode: (abiTypePtr, hexPtr, decodedPtr) => {
          const abiType = exports.__getString(abiTypePtr)
          const hex = exports.__getString(hexPtr)
          const key = `_evmDecode:${abiType}:${hex}`
          const decoded = exports.__getString(decodedPtr)
          store.set(key, decoded)
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
