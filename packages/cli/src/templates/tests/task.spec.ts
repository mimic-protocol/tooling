import { Address, TokenAmount, USD } from '@mimicprotocol/lib-ts'

import main from '../src/task'
import { DAI, USDC } from '../src/tokens'

import { enableLogging, setRelevantTokens, setTokenPrice } from './helpers'

describe('Task', () => {
  beforeAll(() => {
    enableLogging(true)
    setTokenPrice(DAI, USD.fromStringDecimal('1'))
    setRelevantTokens(Address.zero(), [
      TokenAmount.fromStringDecimal(USDC, '5000'),
      TokenAmount.fromStringDecimal(DAI, '100'),
    ])
  })

  it('should run', () => {
    main()
  })
})
