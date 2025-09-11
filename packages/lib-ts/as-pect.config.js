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
      },
      log: {
        _log: (level, msgPtr) => {
          const msg = exports.__getString(msgPtr)

          if (level === 0) throw new Error(`[CRITICAL] ${msg}`)

          // Store the log for testing purposes
          const logEntry = { level, message: msg }
          const logs = store.get('_logs') || []
          logs.push(logEntry)
          store.set('_logs', logs)
        },
      },
      evm: {
        _decode: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = JSON.parse(paramsStr)
          const abiType = params.abiType
          const value = params.value
          const key = `_evmDecode:${abiType}:${value}`

          if (store.has(key)) return exports.__newString(store.get(key))
          throw new Error(`Decoded value not found for key: ${key}`)
        },
        _keccak: () => {
          return exports.__newString('0x')
        },
      },
      environment: {
        _getPrice: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = JSON.parse(paramsStr)
          const address = params.address.toLowerCase()
          const chainId = params.chainId
          const timestamp = params.timestamp
          const key = `_getPrice:${address}:${chainId}${timestamp ? `:${timestamp}` : ''}`

          if (store.has(key)) return exports.__newString(`["${store.get(key)}"]`)
          throw new Error(`Price not found for key: ${key}`)
        },
        _contractCall: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = JSON.parse(paramsStr)
          const key = `_contractCall:${params.to.toLowerCase()}:${params.chainId}:${params.data.toLowerCase()}`

          if (store.has(key)) return exports.__newString(store.get(key))
          throw new Error(`Contract call result not found for key: ${key}`)
        },
        _getContext: () => {
          const key = `_getContext`
          if (store.has(key)) return exports.__newString(store.get(key))
          throw new Error(`Context not found for key: ${key}`)
        },
      },
      helpers: {
        _setTokenPrice: (addressPtr, chainId, pricePtr) => {
          const address = exports.__getString(addressPtr).toLowerCase()
          const price = exports.__getString(pricePtr)
          const baseKey = `_getPrice:${address}:${chainId}`
          store.set(baseKey, price)
        },
        setContractCall: (toPtr, chainId, dataPtr, resultPtr) => {
          const to = exports.__getString(toPtr).toLowerCase()
          const data = exports.__getString(dataPtr).toLowerCase()
          const result = exports.__getString(resultPtr)
          const key = `_contractCall:${to}:${chainId}:${data}`
          store.set(key, result)
        },
        setEvmDecode: (abiTypePtr, hexPtr, decodedPtr) => {
          const abiType = exports.__getString(abiTypePtr)
          const hex = exports.__getString(hexPtr)
          const key = `_evmDecode:${abiType}:${hex}`
          const decoded = exports.__getString(decodedPtr)
          store.set(key, decoded)
        },
        _setContext: (timestamp, consensusThreshold, userPtr, settlersPtr, configSigPtr) => {
          const user = exports.__getString(userPtr)
          const settlers = JSON.parse(exports.__getString(settlersPtr))
          const configSig = exports.__getString(configSigPtr)
          const key = `_getContext`
          const context = {
            timestamp: Number(timestamp.toString()),
            consensusThreshold,
            user,
            settlers,
            configSig,
          }
          store.set(key, JSON.stringify(context))
        },
        _getLogs: () => {
          const logs = store.get('_logs') || []
          return exports.__newString(JSON.stringify(logs))
        },
        clearLogs: () => {
          store.set('_logs', [])
        },
        _getLogsByLevel: (level) => {
          const logs = store.get('_logs') || []
          const filteredLogs = logs.filter((log) => log.level === level)
          return exports.__newString(JSON.stringify(filteredLogs))
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
