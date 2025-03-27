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
    const relevantTokens = new Map()

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
        _getRelevantTokens: (paramsPtr) => {
          const paramsStr = exports.__getString(paramsPtr)
          const params = parseCSV(paramsStr)
          const address = params[0]
          const chainIds = parseCSV(params[1].split('Array(')[1].split(')')[0])

          let responseStr = ''
          for (const chainId of chainIds) {
            const response = relevantTokens.get(`${address}:${chainId}`) ?? []
            responseStr += response.join('\n')
          }

          return exports.__newString(responseStr)
        },
      },
      helpers: {
        _setTokenPrice: (addressPtr, chainId, pricePtr) => {
          const address = exports.__getString(addressPtr)
          const price = exports.__getString(pricePtr)
          const key = `${address}:${chainId}`
          tokenPrices.set(key, price)
        },
        _setRelevantToken: (addressPtr, chainId, tokenAmountPtr) => {
          const address = exports.__getString(addressPtr)
          const tokenAmount = exports.__getString(tokenAmountPtr)
          const key = `${address}:${chainId}`
          const userTokens = relevantTokens.get(key) ?? []
          userTokens.push(tokenAmount)
          relevantTokens.set(key, userTokens)
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

function parseCSV(csvString) {
  const SEPARATOR = ','
  const tokens = []
  const currentTokenChars = []
  let parenthesisDepth = 0
  let isEmpty = true

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString.charAt(i)

    switch (char) {
      case '(':
        parenthesisDepth++
        currentTokenChars.push(char)
        isEmpty = false
        break

      case ')':
        parenthesisDepth--
        if (parenthesisDepth < 0) throw new Error(`Unbalanced brackets at position ${i}`)
        currentTokenChars.push(char)
        isEmpty = false
        break

      case SEPARATOR:
        if (parenthesisDepth === 0) {
          isEmpty ? tokens.push(null) : tokens.push(currentTokenChars.join(''))
          currentTokenChars.length = 0
          isEmpty = true
        } else {
          currentTokenChars.push(char)
          isEmpty = false
        }
        break

      default:
        currentTokenChars.push(char)
        isEmpty = false
        break
    }
  }

  if (parenthesisDepth !== 0) {
    throw new Error('Unbalanced brackets at the end of the string')
  }

  if (csvString.length > 0) {
    isEmpty ? tokens.push(null) : tokens.push(currentTokenChars.join(''))
  }

  return tokens
}
