import { Consensus, STANDARD_DECIMALS } from '../../src/helpers'
import { TokenBalanceQuery, TokenQuery } from '../../src/queries'
import { USD } from '../../src/tokens'
import { BigInt } from '../../src/types'
import { createTestBalance, randomChainId, zeroPadded } from '../helpers'

describe('medianUSD', () => {
  it('should return correct median USD value', () => {
    const values = [USD.fromI32(1), USD.fromI32(3), USD.fromI32(5)]
    const result = Consensus.medianUSD(values)

    expect(result.value.toString()).toBe(USD.fromI32(3).value.toString())
  })
})

describe('uniqueTokenAmounts', () => {
  describe('when array has balances', () => {
    describe('when all tokens are unique', () => {
      it('should return all tokens', () => {
        const chainId = randomChainId()
        const testBalance1 = createTestBalance(1, chainId)
        const testBalance2 = createTestBalance(2, chainId)
        const testBalance3 = createTestBalance(3, chainId)

        const balances: TokenBalanceQuery[][] = [[testBalance1.balance, testBalance2.balance], [testBalance3.balance]]

        const tokenAmounts = Consensus.uniqueTokenAmounts(balances)

        expect(tokenAmounts.length).toBe(3)
      })
    })

    describe('when there are duplicate tokens', () => {
      it('should return only unique tokens keeping first occurrence', () => {
        const chainId = randomChainId()
        const testBalance1 = createTestBalance(1, chainId)
        const testBalance2 = createTestBalance(2, chainId)
        const duplicatedBalance = new TokenBalanceQuery(
          TokenQuery.fromToken(testBalance1.token),
          zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS)
        )

        const balances: TokenBalanceQuery[][] = [[testBalance1.balance, testBalance2.balance], [duplicatedBalance]]

        const tokenAmounts = Consensus.uniqueTokenAmounts(balances)

        expect(tokenAmounts.length).toBe(2)
        expect(tokenAmounts[0].token.address.toString()).toBe(testBalance1.token.address.toString())
        expect(tokenAmounts[0].amount.toString()).toBe(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)) // First occurrence kept
        expect(tokenAmounts[1].token.address.toString()).toBe(testBalance2.token.address.toString())
      })

      it('should keep first occurrence when same token appears in multiple inner arrays', () => {
        const chainId = randomChainId()
        const testBalance1 = createTestBalance(1, chainId)
        const balance2 = new TokenBalanceQuery(
          TokenQuery.fromToken(testBalance1.token),
          zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS)
        )

        const balances: TokenBalanceQuery[][] = [[testBalance1.balance], [balance2]]

        const tokenAmounts = Consensus.uniqueTokenAmounts(balances)

        expect(tokenAmounts.length).toBe(1)
        expect(tokenAmounts[0].token.address.toString()).toBe(testBalance1.token.address.toString())
        expect(tokenAmounts[0].amount.toString()).toBe(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)) // First occurrence
      })
    })
  })

  describe('when array is empty', () => {
    it('should return empty array', () => {
      const balances: TokenBalanceQuery[][] = []
      const tokenAmounts = Consensus.uniqueTokenAmounts(balances)

      expect(tokenAmounts.length).toBe(0)
    })
  })

  describe('when inner arrays are empty', () => {
    it('should return empty array', () => {
      const balances: TokenBalanceQuery[][] = [[], []]
      const tokenAmounts = Consensus.uniqueTokenAmounts(balances)

      expect(tokenAmounts.length).toBe(0)
    })
  })
})
