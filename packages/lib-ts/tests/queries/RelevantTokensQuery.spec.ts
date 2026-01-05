import { STANDARD_DECIMALS } from '../../src/helpers'
import {
  RelevantTokensQueryResponse,
  RelevantTokensQueryResult,
  TokenBalanceQuery,
  TokenQuery,
} from '../../src/queries'
import { BigInt } from '../../src/types'
import { randomChainId, randomERC20Token, zeroPadded } from '../helpers'

describe('RelevantTokensQueryResponse', () => {
  describe('toBalances', () => {
    describe('when response is successful', () => {
      describe('when data has multiple results', () => {
        it('should return balances array with correct values', () => {
          const chainId = randomChainId()
          const token1 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const token2 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const tokenQuery1 = TokenQuery.fromToken(token1)
          const tokenQuery2 = TokenQuery.fromToken(token2)
          const balance1 = new TokenBalanceQuery(tokenQuery1, zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS))
          const balance2 = new TokenBalanceQuery(tokenQuery2, zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS))

          const result1 = new RelevantTokensQueryResult(1234567890, [balance1, balance2])
          const result2 = new RelevantTokensQueryResult(1234567891, [balance1])

          const response = new RelevantTokensQueryResponse('true', [result1, result2], '')
          const responseResult = response.toBalances()

          expect(responseResult.isOk).toBe(true)
          const balances = responseResult.unwrap()
          expect(balances.length).toBe(2)
          expect(balances[0].length).toBe(2)
          expect(balances[1].length).toBe(1)
          expect(balances[0][0].token.address).toBe(token1.address.toString())
          expect(balances[0][1].token.address).toBe(token2.address.toString())
        })
      })

      describe('when data is empty', () => {
        it('should return empty balances array', () => {
          const response = new RelevantTokensQueryResponse('true', [], '')
          const result = response.toBalances()

          expect(result.isOk).toBe(true)
          const balances = result.unwrap()
          expect(balances.length).toBe(0)
        })
      })

      describe('when data has empty balances', () => {
        it('should return array with empty balance arrays', () => {
          const result1 = new RelevantTokensQueryResult(1234567890, [])
          const result2 = new RelevantTokensQueryResult(1234567891, [])

          const response = new RelevantTokensQueryResponse('true', [result1, result2], '')
          const result = response.toBalances()

          expect(result.isOk).toBe(true)
          const balances = result.unwrap()
          expect(balances.length).toBe(2)
          expect(balances[0].length).toBe(0)
          expect(balances[1].length).toBe(0)
        })
      })
    })

    describe('when response is not successful', () => {
      describe('when error message is provided', () => {
        it('should return error with provided message', () => {
          const errorMessage = 'Address not found'
          const response = new RelevantTokensQueryResponse('false', [], errorMessage)
          const result = response.toBalances()

          expect(result.isError).toBe(true)
          expect(result.error).toBe(errorMessage)
        })
      })

      describe('when error message is not provided', () => {
        it('should return default error message', () => {
          const response = new RelevantTokensQueryResponse('false', [], '')
          const result = response.toBalances()

          expect(result.isError).toBe(true)
          expect(result.error).toBe('Unknown error getting relevant tokens')
        })
      })
    })
  })
})

describe('TokenBalanceQuery', () => {
  describe('toUniqueTokenAmounts', () => {
    describe('when array has balances', () => {
      describe('when all tokens are unique', () => {
        it('should return all tokens', () => {
          const chainId = randomChainId()
          const token1 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const token2 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const token3 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const tokenQuery1 = TokenQuery.fromToken(token1)
          const tokenQuery2 = TokenQuery.fromToken(token2)
          const tokenQuery3 = TokenQuery.fromToken(token3)
          const balance1 = new TokenBalanceQuery(tokenQuery1, zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS))
          const balance2 = new TokenBalanceQuery(tokenQuery2, zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS))
          const balance3 = new TokenBalanceQuery(tokenQuery3, zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS))

          const balances: TokenBalanceQuery[][] = [[balance1, balance2], [balance3]]

          const tokenAmounts = TokenBalanceQuery.toUniqueTokenAmounts(balances)

          expect(tokenAmounts.length).toBe(3)
        })
      })

      describe('when there are duplicate tokens', () => {
        it('should return only unique tokens keeping first occurrence', () => {
          const chainId = randomChainId()
          const token1 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const token2 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const tokenQuery1 = TokenQuery.fromToken(token1)
          const tokenQuery2 = TokenQuery.fromToken(token2)
          const balance1 = new TokenBalanceQuery(tokenQuery1, zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS))
          const balance2 = new TokenBalanceQuery(tokenQuery2, zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS))
          const balance3 = new TokenBalanceQuery(tokenQuery1, zeroPadded(BigInt.fromI32(3), STANDARD_DECIMALS)) // Duplicate token

          const balances: TokenBalanceQuery[][] = [[balance1, balance2], [balance3]]

          const tokenAmounts = TokenBalanceQuery.toUniqueTokenAmounts(balances)

          expect(tokenAmounts.length).toBe(2)
          expect(tokenAmounts[0].token.address.toString()).toBe(token1.address.toString())
          expect(tokenAmounts[0].amount.toString()).toBe(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)) // First occurrence kept
          expect(tokenAmounts[1].token.address.toString()).toBe(token2.address.toString())
        })

        it('should keep first occurrence when same token appears in multiple inner arrays', () => {
          const chainId = randomChainId()
          const token1 = randomERC20Token(chainId, STANDARD_DECIMALS)
          const tokenQuery1 = TokenQuery.fromToken(token1)
          const balance1 = new TokenBalanceQuery(tokenQuery1, zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS))
          const balance2 = new TokenBalanceQuery(tokenQuery1, zeroPadded(BigInt.fromI32(2), STANDARD_DECIMALS))

          const balances: TokenBalanceQuery[][] = [[balance1], [balance2]]

          const tokenAmounts = TokenBalanceQuery.toUniqueTokenAmounts(balances)

          expect(tokenAmounts.length).toBe(1)
          expect(tokenAmounts[0].token.address.toString()).toBe(token1.address.toString())
          expect(tokenAmounts[0].amount.toString()).toBe(zeroPadded(BigInt.fromI32(1), STANDARD_DECIMALS)) // First occurrence
        })
      })
    })

    describe('when array is empty', () => {
      it('should return empty array', () => {
        const balances: TokenBalanceQuery[][] = []
        const tokenAmounts = TokenBalanceQuery.toUniqueTokenAmounts(balances)

        expect(tokenAmounts.length).toBe(0)
      })
    })

    describe('when inner arrays are empty', () => {
      it('should return empty array', () => {
        const balances: TokenBalanceQuery[][] = [[], []]
        const tokenAmounts = TokenBalanceQuery.toUniqueTokenAmounts(balances)

        expect(tokenAmounts.length).toBe(0)
      })
    })
  })
})
