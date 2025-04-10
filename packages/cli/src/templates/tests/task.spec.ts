import { Address, TokenAmount, USD } from '@mimicprotocol/lib-ts'

import main from '../src/task'
import { DAI, ETH, WBTC } from '../src/tokens'

import { enableLogging, setRelevantTokens, setTokenPrice } from './helpers'

describe('Task', () => {
  beforeAll(() => {
    enableLogging(false)
    setTokenPrice(ETH, USD.fromStringDecimal('1800'))
    setTokenPrice(WBTC, USD.fromStringDecimal('80000'))
    setRelevantTokens(Address.zero(), [
      TokenAmount.fromStringDecimal(WBTC, '0.05'),
      TokenAmount.fromStringDecimal(ETH, '1.5'),
      TokenAmount.fromStringDecimal(DAI, '25'),
    ])
  })

  it('should run', () => {
    main()
  })
})
