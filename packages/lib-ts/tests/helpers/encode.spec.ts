import { evmEncode, evmEncodeArray } from '../../src/helpers/encode'
import { Address, BigInt, Bytes, CallParam } from '../../src/types'

function padTo32Bytes(hex: string, padEnd: boolean = false): string {
  const hexValue = hex.startsWith('0x') ? hex.substring(2) : hex
  if (padEnd) {
    return '0x' + hexValue.padEnd(64, '0')
  } else {
    return '0x' + hexValue.padStart(64, '0')
  }
}

const selector = '0xa9059cbb'

describe('evmEncode', () => {
  describe('Input Validation', () => {
    it('should throw if selector length is not 10 (0x + 8 chars)', () => {
      expect(() => {
        evmEncode('0x123456', [])
      }).toThrow()
      expect(() => {
        evmEncode('0x1234567890', [])
      }).toThrow()
    })

    it('should throw if selector is not a valid hex string', () => {
      expect(() => {
        evmEncode('0xinvalidg', [])
      }).toThrow()
    })

    it('should throw if a static parameter exceeds 32 bytes', () => {
      expect(() => {
        const params: CallParam[] = [new CallParam('bytes33', Bytes.fromHexString('0x' + '01'.repeat(33)))]
        evmEncode(selector, params)
      }).toThrow()
    })
  })

  describe('Encoding Logic', () => {
    it('should encode only the selector when params are empty', () => {
      const encoded = evmEncode(selector, [])
      expect(encoded.serialize()).toBe(selector)
    })

    it('should encode static parameters correctly', () => {
      const addr = Address.fromString('0x1111111111111111111111111111111111111111')
      const amount = BigInt.fromU64(1000) // 0x3e8
      const params: CallParam[] = [new CallParam('address', addr), new CallParam('uint256', amount.toBytesBigEndian())]

      const expectedAddr = padTo32Bytes(addr.toHexString())
      const expectedAmount = padTo32Bytes(amount.toBytesBigEndian().toHexString())
      const expected = selector + expectedAddr.substring(2) + expectedAmount.substring(2)

      const encoded = evmEncode(selector, params)
      expect(encoded.serialize()).toBe(expected)
    })

    it('should encode a single dynamic parameter (string) correctly', () => {
      const testString = 'hello'
      const stringBytes = Bytes.fromUTF8(testString) // 0x68656c6c6f
      const params: CallParam[] = [new CallParam('string', stringBytes)]

      const expectedOffset = padTo32Bytes('0x20') // Offset starts after the offset itself (1 * 32 bytes)
      const expectedLength = padTo32Bytes('0x5') // Length of "hello"
      const expectedData = padTo32Bytes(stringBytes.toHexString(), true).substring(2) // Padded data at the end

      const expected = selector + expectedOffset.substring(2) + expectedLength.substring(2) + expectedData

      const encoded = evmEncode(selector, params)
      expect(encoded.serialize()).toBe(expected)
    })

    it('should encode a single dynamic parameter (bytes) correctly', () => {
      const testBytes = Bytes.fromHexString('0x0102030405')
      const params: CallParam[] = [new CallParam('bytes', testBytes)]

      const expectedOffset = padTo32Bytes('0x20') // Offset starts after the offset itself (1 * 32 bytes)
      const expectedLength = padTo32Bytes('0x5') // Length of the bytes
      const expectedData = padTo32Bytes(testBytes.toHexString(), true).substring(2) // Padded data at the end

      const expected = selector + expectedOffset.substring(2) + expectedLength.substring(2) + expectedData

      const encoded = evmEncode(selector, params)
      expect(encoded.serialize()).toBe(expected)
    })

    it('should encode mixed static and dynamic parameters correctly', () => {
      const val1 = BigInt.fromU64(123) // 0x7b
      const val2 = 'dynamic data'
      const val3 = Address.fromString('0x2222222222222222222222222222222222222222')
      const val4 = Bytes.fromHexString('0xabcdef')

      const params: CallParam[] = [
        new CallParam('uint256', val1.toBytesBigEndian()),
        new CallParam('string', Bytes.fromUTF8(val2)),
        new CallParam('address', val3),
        new CallParam('bytes', val4),
      ]

      // Static part size: 4 params * 32 bytes = 128 bytes (0x80)
      const expectedVal1 = padTo32Bytes(val1.toHexString())
      const expectedOffsetVal2 = padTo32Bytes('0x80') // string data starts after static part
      const expectedVal3 = padTo32Bytes(val3.toHexString())
      const expectedOffsetVal4 = padTo32Bytes('0xc0') // bytes data starts after string data (0x80 + string length(32) + string data padded(32) = 0x80 + 0x20 + 0x20 = 0xc0)

      // Dynamic part
      // String
      const expectedLengthVal2 = padTo32Bytes('0xc')
      const expectedDataVal2 = padTo32Bytes(Bytes.fromUTF8(val2).toHexString(), true).substring(2) // 0x64796e616d696320646174610000000000000000000000000000000000000000 (padded to 32)
      // Bytes
      const expectedLengthVal4 = padTo32Bytes('0x3')
      const expectedDataVal4 = padTo32Bytes(val4.toHexString(), true).substring(2) // 0xabcdef0000000000000000000000000000000000000000000000000000000000 (padded to 32)

      const expected =
        selector +
        expectedVal1.substring(2) +
        expectedOffsetVal2.substring(2) +
        expectedVal3.substring(2) +
        expectedOffsetVal4.substring(2) +
        expectedLengthVal2.substring(2) +
        expectedDataVal2 +
        expectedLengthVal4.substring(2) +
        expectedDataVal4

      const encoded = evmEncode(selector, params)
      expect(encoded.serialize()).toBe(expected)
    })

    it('should encode multiple dynamic parameters correctly', () => {
      const val1 = 'first' // 0x6669727374, length 5
      const val2 = Bytes.fromHexString('0x0102') // length 2
      const val3 = 'third string' // 0x746869726420737472696e67, length 12

      // Convert strings to hex
      const val1Bytes = Bytes.fromUTF8(val1)
      const val2Bytes = val2
      const val3Bytes = Bytes.fromUTF8(val3)

      const params: CallParam[] = [
        new CallParam('string', val1Bytes),
        new CallParam('bytes', val2Bytes),
        new CallParam('string', val3Bytes),
      ]

      // Static part size: 3 params * 32 bytes = 96 bytes (0x60)
      const expectedOffsetVal1 = padTo32Bytes('0x60')
      const expectedOffsetVal2 = padTo32Bytes('0xa0') // 0x60 + len(32) + data1(32) = 0x60 + 0x20 + 0x20 = 0xa0
      const expectedOffsetVal3 = padTo32Bytes('0xe0') // 0xa0 + len(32) + data2(32) = 0xa0 + 0x20 + 0x20 = 0xe0

      // Dynamic part
      // Val1
      const expectedLengthVal1 = padTo32Bytes('0x5')
      const expectedDataVal1 = padTo32Bytes(val1Bytes.toHexString(), true).substring(2) // 0x666972737400...
      // Val2
      const expectedLengthVal2 = padTo32Bytes('0x2')
      const expectedDataVal2 = padTo32Bytes(val2Bytes.toHexString(), true).substring(2) // 0x010200...
      // Val3
      const expectedLengthVal3 = padTo32Bytes('0xc')
      const expectedDataVal3 = padTo32Bytes(val3Bytes.toHexString(), true).substring(2) // 0x746869726420737472696e6700...

      const expected =
        selector +
        expectedOffsetVal1.substring(2) +
        expectedOffsetVal2.substring(2) +
        expectedOffsetVal3.substring(2) +
        expectedLengthVal1.substring(2) +
        expectedDataVal1 +
        expectedLengthVal2.substring(2) +
        expectedDataVal2 +
        expectedLengthVal3.substring(2) +
        expectedDataVal3

      const encoded = evmEncode(selector, params)
      expect(encoded.serialize()).toBe(expected)
    })

    it('should handle empty dynamic parameters', () => {
      const val1 = ''
      const val1Bytes = Bytes.fromUTF8(val1)

      const params: CallParam[] = [new CallParam('string', val1Bytes)]

      // Static part size: 1 param * 32 bytes = 32 (0x20)
      const expectedOffsetVal1 = padTo32Bytes('0x20')

      // Dynamic part
      const expectedLengthVal1 = padTo32Bytes('0x0')
      const expected = selector + expectedOffsetVal1.substring(2) + expectedLengthVal1.substring(2)

      const encoded = evmEncode(selector, params)
      expect(encoded.serialize()).toBe(expected)
    })
  })
})

describe('evmEncodeArray', () => {
  describe('Dynamic Arrays', () => {
    it('should encode empty dynamic array correctly', () => {
      const result = evmEncodeArray('uint256[]', [])
      const expected = padTo32Bytes('0x0')
      expect(result.serialize()).toBe(expected)
    })

    it('should encode dynamic array of BigInt values', () => {
      const values = [BigInt.fromU64(10), BigInt.fromU64(20), BigInt.fromU64(30)]
      const result = evmEncodeArray('uint256[]', values)

      const expectedLength = padTo32Bytes('0x3')
      const expectedItem1 = padTo32Bytes('0xa') // 10
      const expectedItem2 = padTo32Bytes('0x14') // 20
      const expectedItem3 = padTo32Bytes('0x1e') // 30

      const expected =
        expectedLength.substring(2) +
        expectedItem1.substring(2) +
        expectedItem2.substring(2) +
        expectedItem3.substring(2)

      expect(result.serialize()).toBe('0x' + expected)
    })

    it('should encode dynamic array of Address values', () => {
      const addr1 = Address.fromString('0x1111111111111111111111111111111111111111')
      const addr2 = Address.fromString('0x2222222222222222222222222222222222222222')
      const values = [addr1, addr2]

      const result = evmEncodeArray('address[]', values)

      const expectedLength = padTo32Bytes('0x2')
      const expectedAddr1 = padTo32Bytes(addr1.toHexString())
      const expectedAddr2 = padTo32Bytes(addr2.toHexString())

      const expected = expectedLength.substring(2) + expectedAddr1.substring(2) + expectedAddr2.substring(2)

      expect(result.serialize()).toBe('0x' + expected)
    })

    it('should encode dynamic array of Bytes values', () => {
      const bytes1 = Bytes.fromUTF8('hello')
      const bytes2 = Bytes.fromUTF8('world')
      const values = [bytes1, bytes2]

      const result = evmEncodeArray('bytes32[]', values)

      const expectedLength = padTo32Bytes('0x2')
      const expectedBytes1 = padTo32Bytes(bytes1.toHexString(), true)
      const expectedBytes2 = padTo32Bytes(bytes2.toHexString(), true)

      const expected = expectedLength.substring(2) + expectedBytes1.substring(2) + expectedBytes2.substring(2)

      expect(result.serialize()).toBe('0x' + expected)
    })
  })

  describe('Fixed Arrays', () => {
    it('should encode fixed array of BigInt values', () => {
      const values = [BigInt.fromU64(100), BigInt.fromU64(200)]
      const result = evmEncodeArray('uint256[2]', values)

      const expectedItem1 = padTo32Bytes('0x64') // 100
      const expectedItem2 = padTo32Bytes('0xc8') // 200

      const expected = expectedItem1.substring(2) + expectedItem2.substring(2)

      expect(result.serialize()).toBe('0x' + expected)
    })

    it("should throw when fixed array size doesn't match input length", () => {
      expect(() => {
        const values = [BigInt.fromU64(100), BigInt.fromU64(200)]
        evmEncodeArray('uint256[3]', values)
      }).toThrow()

      expect(() => {
        const values = [BigInt.fromU64(100), BigInt.fromU64(200)]
        evmEncodeArray('uint256[1]', values)
      }).toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should throw for string array type', () => {
      expect(() => {
        evmEncodeArray('string[]', [Bytes.fromUTF8('test')])
      }).toThrow()
    })
  })
})
