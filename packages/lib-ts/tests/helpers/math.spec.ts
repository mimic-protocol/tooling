import { Math, STANDARD_DECIMALS } from '../../src/helpers'
import { BigInt } from '../../src/types'
import { zeroPadded } from '../helpers'

describe('median', () => {
  describe('when array has valid elements', () => {
    describe('when array has odd number of elements', () => {
      it('should return the middle element', () => {
        const values = [
          BigInt.fromString(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(7), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(9), STANDARD_DECIMALS)),
        ]
        const result = Math.median(values)

        expect(result.toString()).toBe(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS))
      })
    })

    describe('when array has even number of elements', () => {
      it('should return the average of the two middle elements', () => {
        const values = [
          BigInt.fromString(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(7), STANDARD_DECIMALS)),
        ]
        const result = Math.median(values)

        // Median of [1, 3, 5, 7] = (3 + 5) / 2 = 4
        expect(result.toString()).toBe(zeroPadded(BigInt.fromI32(4), STANDARD_DECIMALS))
      })

      it('should handle decimal median correctly', () => {
        const values = [
          BigInt.fromString(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)), // 1 USD
          BigInt.fromString(zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS)), // 3 USD
        ]
        const result = Math.median(values)

        // Median of [1, 3] = (1 + 3) / 2 = 2
        expect(result.toString()).toBe(zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS))
      })
    })

    describe('when array has single element', () => {
      it('should return that element', () => {
        const values = [BigInt.fromString(zeroPadded(BigInt.fromI32(42), STANDARD_DECIMALS))]
        const result = Math.median(values)

        expect(result.toString()).toBe(zeroPadded(BigInt.fromI32(42), STANDARD_DECIMALS))
      })
    })

    describe('when array has duplicate values', () => {
      it('should return correct median', () => {
        const values = [
          BigInt.fromString(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS)),
          BigInt.fromString(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS)),
        ]
        const result = Math.median(values)

        // Median of [5, 5, 5, 5] = (5 + 5) / 2 = 5
        expect(result.toString()).toBe(zeroPadded(BigInt.fromI32(5), STANDARD_DECIMALS))
      })
    })
  })

  describe('when array is empty', () => {
    it('should throw an error', () => {
      expect(() => {
        const values: BigInt[] = []
        Math.median(values)
      }).toThrow('Cannot compute median of empty array')
    })
  })
})
