import { isBase58, isHex, NATIVE_ADDRESS, NULL_ADDRESS, USD_ADDRESS } from '../../src/helpers'
import { Address, Bytes } from '../../src/types'
import { randomBase58, randomBytes, randomEvmAddress, randomHex, randomSvmAddress } from '../helpers'

/* eslint-disable no-secrets/no-secrets */

describe('Address', () => {
  describe('USD', () => {
    it('creates the USD denomination address', () => {
      const usd = Address.USD()

      expect(usd.isUsd()).toBe(true)
      expect(usd.isNative()).toBe(false)
      expect(usd.toHexString()).toBe(USD_ADDRESS)
    })
  })

  describe('native', () => {
    it('creates the native address', () => {
      const native = Address.native()

      expect(native.isUsd()).toBe(false)
      expect(native.isNative()).toBe(true)
      expect(native.toHexString()).toBe(NATIVE_ADDRESS)
    })
  })

  describe('fromString', () => {
    describe('when the string is valid', () => {
      it('converts a valid hex string to an Address', () => {
        const validAddress = randomHex(40)
        const address = Address.fromString(validAddress)

        expect(address.length).toBe(20)
        expect(address.toHexString()).toBe(address.toString())
      })

      it('converts a valid base58 string to an Address', () => {
        const validAddress = randomBytes(64).toBase58String()
        const address = Address.fromString(validAddress)

        expect(validAddress.length).toBeGreaterThanOrEqual(32)
        expect(validAddress.length).toBeLessThanOrEqual(44)
        expect(address.length).toBe(32)
        expect(address.toBase58String()).toBe(address.toString())
      })

      it('converts a valid SVM address to an Address', () => {
        const validAddress = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
        const address = Address.fromString(validAddress)

        expect(address.length).toBe(32)
        expect(address.toBase58String()).toBe(address.toString())
      })
    })

    describe('when the string length is invalid', () => {
      describe('hex', () => {
        it('throws an error for short strings', () => {
          expect(() => {
            const shortAddress = randomHex(10)
            Address.fromString(shortAddress)
          }).toThrow('Invalid string for H160')
        })

        it('throws an error for long strings', () => {
          expect(() => {
            const longAddress = randomHex(50)
            Address.fromString(longAddress)
          }).toThrow('Invalid string for H160')
        })
      })

      describe('base58', () => {
        it('throws an error for short strings', () => {
          expect(() => {
            const shortAddress = randomBase58(10)
            Address.fromString(shortAddress)
          }).toThrow('Invalid string for SVM addresses')
        })

        it('throws an error for long strings', () => {
          expect(() => {
            const longAddress = randomBase58(50)
            Address.fromString(longAddress)
          }).toThrow('Invalid string for SVM addresses')
        })
      })
    })
  })

  describe('fromHexString', () => {
    describe('when the hex string is valid', () => {
      it('converts a valid hex string to an Address', () => {
        const validAddress = randomHex(40)
        const address = Address.fromHexString(validAddress)

        expect(address.length).toBe(20)
        expect(address.toHexString()).toBe(validAddress)
      })
    })

    describe('when the hex string length is invalid', () => {
      it('throws an error for short strings', () => {
        expect(() => {
          const shortAddress = randomHex(10)
          Address.fromHexString(shortAddress)
        }).toThrow('Invalid string for H160')
      })

      it('throws an error for long strings', () => {
        expect(() => {
          const longAddress = randomHex(50)
          Address.fromHexString(longAddress)
        }).toThrow('Invalid string for H160')
      })

      it('throws an error for base58 strings', () => {
        expect(() => {
          const base58Address = randomBase58(40)
          Address.fromHexString(base58Address)
        }).toThrow('Invalid string for H160')
      })
    })
  })

  describe('fromBase58String', () => {
    describe('when the base58 string is valid', () => {
      it('converts a valid base58 string to an Address', () => {
        const validAddress = randomBytes(64).toBase58String()
        const address = Address.fromBase58String(validAddress)

        expect(address.length).toBe(32)
        expect(address.toBase58String()).toBe(validAddress)
      })
    })

    describe('when the base58 string length is invalid', () => {
      it('throws an error for short strings', () => {
        expect(() => {
          const shortAddress = randomBase58(10)
          Address.fromBase58String(shortAddress)
        }).toThrow('Invalid string for SVM addresses')
      })

      it('throws an error for long strings', () => {
        expect(() => {
          const longAddress = randomBase58(50)
          Address.fromBase58String(longAddress)
        }).toThrow('Invalid string for SVM addresses')
      })

      it('throws an error for hex strings', () => {
        expect(() => {
          const hexAddress = randomHex(40)
          Address.fromBase58String(hexAddress)
        }).toThrow('Invalid string for SVM addresses')
      })
    })
  })

  describe('fromBytes', () => {
    describe('when the Bytes object has a valid length', () => {
      it('converts a valid Bytes object to an Address', () => {
        const validBytes = Bytes.fromHexString(randomHex(40))
        const address = Address.fromBytes(validBytes)

        expect(address.length).toBe(20)
        expect(address.toHexString()).toBe(validBytes.toHexString())
      })
    })

    describe('when the Bytes object has an invalid length', () => {
      it('throws an error for short Bytes objects', () => {
        expect(() => {
          const shortBytes = Bytes.fromHexString(randomHex(10))
          Address.fromBytes(shortBytes)
        }).toThrow('Bytes of length 5 can not be converted to 20 byte addresses')
      })

      it('throws an error for long Bytes objects', () => {
        expect(() => {
          const longBytes = Bytes.fromHexString(randomHex(50))
          Address.fromBytes(longBytes)
        }).toThrow('Bytes of length 25 can not be converted to 20 byte addresses')
      })
    })
  })

  describe('toString', () => {
    it('returns the hex representation if EVM', () => {
      const validAddress = randomHex(40)
      const address = Address.fromHexString(validAddress)
      const stringAddress = address.toString()

      expect(isHex(stringAddress)).toBeTruthy()
      expect(stringAddress).toBe(validAddress)
    })

    it('returns the base58 representation if SVM', () => {
      const validAddress = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      const address = Address.fromBase58String(validAddress)
      const stringAddress = address.toString()

      expect(isBase58(stringAddress)).toBeTruthy()
      expect(stringAddress).toBe(validAddress)
    })
  })

  describe('zero', () => {
    it('returns the zero address with length 20', () => {
      const zeroAddress = Address.zero()

      expect(zeroAddress.length).toBe(20)
      expect(zeroAddress.toHexString()).toBe(NULL_ADDRESS)
    })

    it('returns a zero address where all bytes are equal to 0', () => {
      const zeroAddress = Address.zero()

      for (let i = 0; i < zeroAddress.length; i++) {
        expect(zeroAddress[i]).toBe(0)
      }
    })
  })

  describe('clone', () => {
    describe('when cloning an address', () => {
      it('returns a new address with the same bytes', () => {
        const originalAddress = randomEvmAddress()
        const clonedAddress = originalAddress.clone()

        expect(clonedAddress.length).toBe(originalAddress.length)
        expect(clonedAddress.toHexString()).toBe(originalAddress.toHexString())
      })

      it('creates an independent copy', () => {
        const originalAddress = randomEvmAddress()
        const clonedAddress = originalAddress.clone()

        originalAddress[0] = 255

        expect(clonedAddress[0]).not.toBe(originalAddress[0])
        expect(clonedAddress.toHexString()).not.toBe(originalAddress.toHexString())
      })
    })
  })

  describe('isEVM / isSVM', () => {
    it('returns true / false when it is an EVM address', () => {
      const address = randomEvmAddress()

      expect(address.isEVM()).toBe(true)
      expect(address.isSVM()).toBe(false)
    })

    it('return false / true when it is an SVM address', () => {
      const address = randomSvmAddress()

      expect(address.isEVM()).toBe(false)
      expect(address.isSVM()).toBe(true)
    })

    it('returns true / false when it is a real EVM address', () => {
      const address = Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

      expect(address.isEVM()).toBe(true)
      expect(address.isSVM()).toBe(false)
    })

    it('return false / true when it is a real SVM address', () => {
      const address = Address.fromString('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

      expect(address.isEVM()).toBe(false)
      expect(address.isSVM()).toBe(true)
    })
  })
})
