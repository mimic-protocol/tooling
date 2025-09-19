import { bytesToHexString } from '../../src/helpers'
import { BorshDeserializer } from '../../src/helpers/BorshDecoder'
import { Address, Bytes } from '../../src/types'
import { randomHex } from '../helpers'

describe('BorshDecoder', () => {
  describe('creation', () => {
    it('creates fromHex', () => {
      BorshDeserializer.fromHex('0x010203')
    })

    it('creates from bytes', () => {
      BorshDeserializer.fromBytes(Bytes.fromHexString('0x010203'))
    })

    it('cant create with odd hex string', () => {
      expect(() => {
        BorshDeserializer.fromHex('0x01020')
      }).toThrow()
    })
  })

  describe('tryBool', () => {
    it('deserializes bool (true)', () => {
      const deserializer = BorshDeserializer.fromHex('0x01')
      const value = deserializer.tryBool()
      expect(value).toBe(true)
    })

    it('deserializes bool (false)', () => {
      const deserializer = BorshDeserializer.fromHex('0x00')
      const value = deserializer.tryBool()
      expect(value).toBe(false)
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        BorshDeserializer.fromHex('0x').tryBool()
      }).toThrow()
    })
  })

  describe('tryU8', () => {
    it('deserializes u8', () => {
      const deserializer = BorshDeserializer.fromHex('0xab')
      const number = deserializer.tryU8()
      expect(number).toBe(0xab)
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        BorshDeserializer.fromHex('0x').tryU8()
      }).toThrow()
    })
  })

  describe('tryU16', () => {
    it('deserializes u16', () => {
      const deserializer = BorshDeserializer.fromHex('0xabcd')
      const number = deserializer.tryU16()
      expect(number).toBe(0xcdab)
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        BorshDeserializer.fromHex('0xab').tryU16()
      }).toThrow()
    })
  })

  describe('tryU32', () => {
    it('deserializes u32', () => {
      const deserializer = BorshDeserializer.fromHex('0xabcd0102')
      const number = deserializer.tryU32()
      expect(number).toBe(0x0201cdab)
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        BorshDeserializer.fromHex('0xabcdab').tryU32()
      }).toThrow()
    })
  })

  describe('tryU64', () => {
    it('deserializes u64', () => {
      const deserializer = BorshDeserializer.fromHex('0x0102030405060708')
      const number = deserializer.tryU64()
      expect(number.toString()).toBe('578437695752307201')
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        BorshDeserializer.fromHex('0x01020304050607').tryU64()
      }).toThrow()
    })
  })

  describe('tryPubkey', () => {
    it('deserializes pubkey', () => {
      const hex = randomHex(64)
      const deserializer = BorshDeserializer.fromHex(hex)

      const pubkey = Address.fromHexString(hex)
      const deserializedPubkey = deserializer.tryPubkey()

      expect(deserializedPubkey).toBe(pubkey)
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        const hex = randomHex(62)
        const deserializer = BorshDeserializer.fromHex(hex)
        deserializer.tryPubkey()
      }).toThrow()
    })
  })

  describe('tryString', () => {
    it('deserializes string', () => {
      const str = 'solana'
      const encodedStr = bytesToHexString(Uint8Array.wrap(String.UTF8.encode(str)))
      const deserializer = BorshDeserializer.fromHex('0x06000000' + encodedStr.slice(2))
      const deserializedStr = deserializer.tryString()

      expect(deserializedStr).toBe(str)
    })

    it('throws if insufficient bytes', () => {
      expect(() => {
        const str = 'solana'
        const encodedStr = bytesToHexString(Uint8Array.wrap(String.UTF8.encode(str)))
        const deserializer = BorshDeserializer.fromHex('0x06000000' + encodedStr.slice(4))
        deserializer.tryString()
      }).toThrow()
    })

    it('throws if insufficient bytes 2', () => {
      expect(() => {
        const deserializer = BorshDeserializer.fromHex('0x060000')
        deserializer.tryString()
      }).toThrow()
    })
  })

  describe('tryOption', () => {
    describe('bool', () => {
      it('deserializes correctly (value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x0100000001')
        const value = deserializer.tryOptionBool()
        expect(value.isSome).toBeTruthy()
        expect(value.unwrap()).toBe(true)
      })

      it('deserializes correctly (no value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x00000000')
        const value = deserializer.tryOptionBool()
        expect(value.isSome).toBeFalsy()
      })

      it('throws if insufficient bytes', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x01000000').tryOptionBool()
        }).toThrow()
      })

      it('throws if insufficient bytes 2', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x000000').tryOptionBool()
        }).toThrow()
      })
    })

    describe('u8', () => {
      it('deserializes correctly (value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x01000000ab')
        const value = deserializer.tryOptionU8()
        expect(value.isSome).toBeTruthy()
        expect(value.unwrap()).toBe(0xab)
      })

      it('deserializes correctly (no value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x00000000')
        const value = deserializer.tryOptionU8()
        expect(value.isSome).toBeFalsy()
      })

      it('throws if insufficient bytes', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x01000000').tryOptionU8()
        }).toThrow()
      })

      it('throws if insufficient bytes 2', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x000000').tryOptionU8()
        }).toThrow()
      })
    })

    describe('u16', () => {
      it('deserializes correctly (value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x01000000abcd')
        const value = deserializer.tryOptionU16()
        expect(value.isSome).toBeTruthy()
        expect(value.unwrap()).toBe(0xcdab)
      })

      it('deserializes correctly (no value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x00000000')
        const value = deserializer.tryOptionU16()
        expect(value.isSome).toBeFalsy()
      })

      it('throws if insufficient bytes', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x01000000ab').tryOptionU16()
        }).toThrow()
      })

      it('throws if insufficient bytes 2', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x000000').tryOptionU16()
        }).toThrow()
      })
    })

    describe('u32', () => {
      it('deserializes correctly (value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x01000000abcd0102')
        const value = deserializer.tryOptionU32()
        expect(value.isSome).toBeTruthy()
        expect(value.unwrap()).toBe(0x0201cdab)
      })

      it('deserializes correctly (no value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x00000000')
        const value = deserializer.tryOptionU32()
        expect(value.isSome).toBeFalsy()
      })

      it('throws if insufficient bytes', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x01000000abcd01').tryOptionU32()
        }).toThrow()
      })

      it('throws if insufficient bytes 2', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x000000').tryOptionU32()
        }).toThrow()
      })
    })

    describe('u64', () => {
      it('deserializes correctly (value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x010000000102030405060708')
        const value = deserializer.tryOptionU64()
        expect(value.isSome).toBeTruthy()
        expect(value.unwrap().toString()).toBe('578437695752307201')
      })

      it('deserializes correctly (no value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x00000000')
        const value = deserializer.tryOptionU64()
        expect(value.isSome).toBeFalsy()
      })

      it('throws if insufficient bytes', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x0100000001020304050607').tryOptionU64()
        }).toThrow()
      })

      it('throws if insufficient bytes 2', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x000000').tryOptionU64()
        }).toThrow()
      })
    })

    describe('pubkey', () => {
      it('deserializes correctly (value)', () => {
        const hex = randomHex(64)
        const deserializer = BorshDeserializer.fromHex('0x01000000' + hex.slice(2, 66))
        const value = deserializer.tryOptionPubkey()
        const pubkey = Address.fromHexString(hex)
        expect(value.isSome).toBeTruthy()
        expect(value.unwrap()).toBe(pubkey)
      })

      it('deserializes correctly (no value)', () => {
        const deserializer = BorshDeserializer.fromHex('0x00000000')
        const value = deserializer.tryOptionPubkey()
        expect(value.isSome).toBeFalsy()
      })

      it('throws if insufficient bytes', () => {
        expect(() => {
          const hex = randomHex(64)
          const deserializer = BorshDeserializer.fromHex('0x01000000' + hex.slice(2, 64))
          deserializer.tryOptionPubkey()
        }).toThrow()
      })

      it('throws if insufficient bytes 2', () => {
        expect(() => {
          BorshDeserializer.fromHex('0x000000').tryOptionPubkey()
        }).toThrow()
      })
    })
  })

  describe('setOffset / getOffset', () => {
    it('can move offset forward', () => {
      const deserializer = BorshDeserializer.fromHex('0xabcdef')
      expect(deserializer.getOffset()).toBe(0)
      deserializer.setOffset(1)
      expect(deserializer.getOffset()).toBe(1)
      const value = deserializer.tryU8()
      expect(value).toBe(0xcd)
    })

    it('can move offset backward', () => {
      const deserializer = BorshDeserializer.fromHex('0xabcdef')
      expect(deserializer.getOffset()).toBe(0)
      const value = deserializer.tryU8()
      expect(value).toBe(0xab)
      expect(deserializer.getOffset()).toBe(1)
      deserializer.setOffset(deserializer.getOffset() - 1)
      expect(deserializer.getOffset()).toBe(0)
      const value2 = deserializer.tryU8()
      expect(value2).toBe(0xab)
    })

    it('can set offset to end of buffer', () => {
      const deserializer = BorshDeserializer.fromHex('0xabcdef')
      deserializer.setOffset(3)
      expect(deserializer.getOffset()).toBe(3)
      expect(deserializer.isEmpty()).toBeTruthy()
    })

    it('cant set offset beyond buffer limits', () => {
      expect(() => {
        const deserializer = BorshDeserializer.fromHex('0xabcdef')
        deserializer.setOffset(4)
      }).toThrow()
    })
  })

  describe('isEmpty', () => {
    it('is true when empty', () => {
      const deserializer = BorshDeserializer.fromHex('0x')
      expect(deserializer.isEmpty()).toBeTruthy()
    })

    it('is false when not empty', () => {
      const deserializer = BorshDeserializer.fromHex('0xab')
      expect(deserializer.isEmpty()).toBeFalsy()
    })

    it('changes from false to true when it becomes empty', () => {
      const deserializer = BorshDeserializer.fromHex('0xabcdef')
      expect(deserializer.isEmpty()).toBeFalsy()

      const value = deserializer.tryU8()
      expect(value).toBe(0xab)
      expect(deserializer.isEmpty()).toBeFalsy()

      const value2 = deserializer.tryU16()
      expect(value2).toBe(0xefcd)
      expect(deserializer.isEmpty()).toBeTruthy()
    })
  })

  describe('complex', () => {
    it('deserializes a complex structure', () => {
      const pubkeyHex = randomHex(64).slice(2, 66)
      const pubkey = Address.fromHexString(pubkeyHex)
      const deserializer = BorshDeserializer.fromHex(
        `0x01abffee010203040102030405060708${pubkeyHex}010000000101000000ab0000000001000000010203040000000001000000${pubkeyHex}`
      )

      const value1 = deserializer.tryBool()
      const value2 = deserializer.tryU8()
      const value3 = deserializer.tryU16()
      const value4 = deserializer.tryU32()
      const value5 = deserializer.tryU64()
      const value6 = deserializer.tryPubkey()
      const value7 = deserializer.tryOptionBool()
      const value8 = deserializer.tryOptionU8()
      const value9 = deserializer.tryOptionU16()
      const value10 = deserializer.tryOptionU32()
      const value11 = deserializer.tryOptionU64()
      const value12 = deserializer.tryOptionPubkey()

      expect(value1).toBe(true)
      expect(value2).toBe(0xab)
      expect(value3).toBe(0xeeff)
      expect(value4).toBe(0x04030201)
      expect(value5.toString()).toBe('578437695752307201')
      expect(value6).toBe(pubkey)
      expect(value7.unwrap()).toBe(true)
      expect(value8.unwrap()).toBe(0xab)
      expect(value9.isSome).toBeFalsy()
      expect(value10.unwrap()).toBe(0x04030201)
      expect(value11.isSome).toBeFalsy()
      expect(value12.unwrap()).toBe(pubkey)
    })
  })
})
