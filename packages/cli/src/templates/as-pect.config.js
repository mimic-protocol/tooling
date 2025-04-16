import { IArray, IBigInt, IToken, ITokenAmount, LIST_TYPES, parseCSV, StateManager } from './as-pect.helpers.js'

const ONE_USD = 10n ** 18n // 1 USD in 18 decimals
const ERROR_PREFIX = 'ERROR:'

export default {
  entries: ['tests/**/*.spec.ts'],
  disclude: [/node_modules/],
  async instantiate(memory, createImports, instantiate, binary) {
    let exports = {
      __getString: () => {
        throw new Error(`${ERROR_PREFIX} WASM module not initialized`)
      },
      __newString: () => {
        throw new Error(`${ERROR_PREFIX} WASM module not initialized`)
      },
    }

    const stateManager = new StateManager()

    /**
     * Logs function name and arguments if logging is enabled
     * @param {string} fnName - Function name
     * @param {any} args - Function arguments
     */
    const log = (fnName, args) => {
      if (stateManager.loggingEnabled) {
        console.log(fnName, args)
      }
    }

    /**
     * Filters token amounts based on minimum USD value
     * @param {Array} tokenAmounts - Array of token amounts
     * @param {BigInt} minUsdValue - Minimum USD value
     * @returns {Array} - Filtered token amounts
     */
    const filterByMinUsdValue = (tokenAmounts, minUsdValue) => {
      return tokenAmounts.filter((tokenAmount) => {
        try {
          const tokenPriceKey = createTokenKey(tokenAmount.token.address, tokenAmount.token.chainId)
          const tokenPrice = stateManager.tokenPricesMap.get(tokenPriceKey) || ONE_USD

          return (
            minUsdValue.value <= (tokenAmount.amount.value * tokenPrice) / 10n ** BigInt(tokenAmount.token.decimals)
          )
        } catch (error) {
          log('filterByMinValueError', error)
          return false
        }
      })
    }

    const myImports = {
      env: {
        memory,
        'console.log': (ptr) => {
          try {
            const string = exports.__getString(ptr)
            console.log(string)
          } catch (error) {
            console.error('console.log error:', error)
          }
        },
      },
      environment: {
        _call: (paramsPtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            log('call', paramsStr)
          } catch (error) {
            log('callError', error)
          }
        },
        _swap: (paramsPtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            log('swap', paramsStr)
          } catch (error) {
            log('swapError', error)
          }
        },
        _transfer: (paramsPtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            log('transfer', paramsStr)
          } catch (error) {
            log('transferError', error)
          }
        },
        _getPrice: (paramsPtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            log('getPrice', paramsStr)

            if (!validateParamsString(paramsStr)) {
              console.error(`${ERROR_PREFIX} Invalid or empty parameters`)
              return
            }

            const params = parseCSV(paramsStr)
            const address = params[0]
            const chainId = params[1]

            const key = createTokenKey(address, chainId)
            const price = stateManager.tokenPricesMap.has(key)
              ? stateManager.tokenPricesMap.get(key).toString()
              : ONE_USD.toString()

            return exports.__newString(price)
          } catch (error) {
            console.error(`${ERROR_PREFIX} ${error}`)
          }
        },
        _getRelevantTokens: (paramsPtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            log('getRelevantTokens', paramsStr)

            if (!validateParamsString(paramsStr)) {
              console.error(`${ERROR_PREFIX} Invalid or empty parameters`)
              return
            }

            const params = parseCSV(paramsStr)
            if (params.length < 5) {
              console.error(`${ERROR_PREFIX} Insufficient parameters for getRelevantTokens`)
              return
            }

            const address = params[0]
            const { items: chainIds } = IArray.parse(params[1])
            const minUsdValue = IBigInt.parse(params[2])
            const tokenFilters = IArray.parse(params[3]).items.map((item) => IToken.parse(item))
            const listType = parseInt(params[4])

            if (!address || !chainIds || !chainIds.length) {
              console.error(`${ERROR_PREFIX} Missing required parameters: address or chainIds`)
              return
            }

            const relevantTokens = []

            for (const chainId of chainIds) {
              const key = createTokenKey(address, chainId)
              const tokenAmounts = stateManager.relevantTokensMap.has(key)
                ? stateManager.relevantTokensMap.get(key)
                : []

              let filteredTokenAmounts = filterByMinUsdValue(tokenAmounts, minUsdValue)
              filteredTokenAmounts = applyTokenFilters(filteredTokenAmounts, tokenFilters, listType)

              relevantTokens.push(...filteredTokenAmounts)
            }

            return exports.__newString(relevantTokens.map((tokenAmount) => tokenAmount.serialize()).join('\n'))
          } catch (error) {
            console.error(`${ERROR_PREFIX} ${error}`)
          }
        },
        _contractCall: (paramsPtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            log('contractCall', paramsStr)

            if (!validateParamsString(paramsStr)) {
              console.error(`${ERROR_PREFIX} Invalid or empty parameters`)
              return
            }

            const params = parseCSV(paramsStr)
            if (params.length < 5) {
              console.error(`${ERROR_PREFIX} Insufficient parameters for contractCall`)
              return
            }

            const address = params[0]
            const chainId = params[1]
            const fnName = params[3]

            if (!address || !chainId || !fnName) {
              console.error(`${ERROR_PREFIX} Missing required parameters: address or chainId or fnName`)
              return
            }

            const value = stateManager.contractCallMap.get(paramsStr)

            const response = exports.__newString(value ?? '')
            return response
          } catch (error) {
            log('contractCallError', error)
          }
        },
      },
      helpers: {
        /**
         * Enables or disables logging
         * @param {boolean} value - Enable/disable logging
         */
        _enableLogging: (value) => {
          stateManager.loggingEnabled = value
        },
        /**
         * Sets token price for testing
         * @param {number} addressPtr - Pointer to token address
         * @param {string|number} chainId - Chain ID
         * @param {number} pricePtr - Pointer to price string
         */
        _setTokenPrice: (addressPtr, chainId, pricePtr) => {
          try {
            const address = exports.__getString(addressPtr)
            const price = exports.__getString(pricePtr)

            if (!address || !chainId) {
              throw new Error(`${ERROR_PREFIX} Missing address or chainId for setTokenPrice`)
            }

            const key = createTokenKey(address, chainId)
            stateManager.tokenPricesMap.set(key, BigInt(price))
          } catch (error) {
            log('setTokenPriceError', error)
          }
        },
        /**
         * Sets relevant tokens for testing
         * @param {number} addressPtr - Pointer to wallet address
         * @param {number} tokensPtr - Pointer to tokens string
         */
        _setRelevantTokens: (addressPtr, tokensPtr) => {
          try {
            const address = exports.__getString(addressPtr)
            const tokenAmountsStr = exports.__getString(tokensPtr)

            if (!address) {
              throw new Error(`${ERROR_PREFIX} Missing address for setRelevantTokens`)
            }

            const tokenAmounts = tokenAmountsStr.split('\n')

            for (const tokenAmount of tokenAmounts) {
              if (tokenAmount === '') continue
              const parsedTokenAmount = ITokenAmount.parse(tokenAmount)
              const key = createTokenKey(address, parsedTokenAmount.token.chainId)
              const relevantTokens = stateManager.relevantTokensMap.has(key)
                ? stateManager.relevantTokensMap.get(key)
                : []
              relevantTokens.push(parsedTokenAmount)
              stateManager.relevantTokensMap.set(key, relevantTokens)
            }
          } catch (error) {
            log('setRelevantTokensError', error)
          }
        },
        /**
         * Sets contract call response for testing
         * @param {number} paramsPtr - Pointer to parameters string
         * @param {number} valuePtr - Pointer to return value string
         */
        _setContractCall: (paramsPtr, valuePtr) => {
          try {
            const paramsStr = exports.__getString(paramsPtr)
            const value = exports.__getString(valuePtr)
            stateManager.contractCallMap.set(paramsStr, value)
          } catch (error) {
            log('setContractCallError', error)
          }
        },
        /**
         * Resets all state to initial values
         */
        _resetState: () => {
          stateManager.reset()
        },
      },
    }

    let instance = instantiate(binary, createImports(myImports))
    instance
      .then((i) => {
        exports = i.exports
      })
      .catch((error) => {
        console.error('Failed to initialize WASM module:', error)
      })

    return instance
  },
  outputBinary: false,
}

/**
 * Validates that a parameter string exists and is not empty
 * @param {string} paramsStr - Parameter string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateParamsString = (paramsStr) => {
  return paramsStr && paramsStr.trim().length > 0
}

/**
 * Creates a token key from address and chainId
 * @param {string} address - Token address
 * @param {string|number} chainId - Chain ID
 * @returns {string} - Formatted key
 */
const createTokenKey = (address, chainId) => {
  if (!address || !chainId) {
    throw new Error(`${ERROR_PREFIX} Missing address or chainId for token key`)
  }
  return `${address}:${chainId}`
}

/**
 * Applies token filters based on list type
 * @param {Array} tokenAmounts - Array of token amounts
 * @param {Array} tokenFilters - Array of token filters
 * @param {number} listType - Filter list type (ALLOW/DENY)
 * @returns {Array} - Filtered token amounts
 */
const applyTokenFilters = (tokenAmounts, tokenFilters, listType) => {
  try {
    if (listType === LIST_TYPES.ALLOW) {
      return tokenAmounts.filter((tokenAmount) => tokenFilters.some((filter) => filter.equals(tokenAmount.token)))
    } else if (listType === LIST_TYPES.DENY) {
      return tokenAmounts.filter((tokenAmount) => !tokenFilters.some((filter) => filter.equals(tokenAmount.token)))
    } else {
      throw new Error(`${ERROR_PREFIX} Invalid list type: ${listType}`)
    }
  } catch (error) {
    log('applyTokenFiltersError', error)
    throw error
  }
}
