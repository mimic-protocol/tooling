import { JSON } from 'json-as'

import { OperationType, Transfer, TransferData } from '../../src/intents'
import { Token } from '../../src/tokens'
import { Address, BigInt } from '../../src/types'
import { setContext } from '../helpers'

describe('Transfer Intent', () => {
  it('creates a Transfer intent with valid parameters and stringifies it', () => {
    const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000011')
    const recipientAddress = Address.fromString('0x0000000000000000000000000000000000000012')
    const settlerAddress = Address.fromString('0x0000000000000000000000000000000000000013')
    const feeTokenAddress = Address.fromString('0x0000000000000000000000000000000000000014')

    const chainId = 1
    const feeAmount = BigInt.fromString('1000')
    const deadline = BigInt.fromString('99999999')

    const transfers: TransferData[] = [
      TransferData.fromStringDecimal(new Token(tokenAddress.toString(), chainId), '5000', recipientAddress),
    ]

    setContext(chainId, recipientAddress.toString(), 'config-transfer')

    const transferIntent = new Transfer(transfers, feeTokenAddress, feeAmount, chainId, settlerAddress, deadline)

    expect(transferIntent.op).toBe(OperationType.Transfer)
    expect(transferIntent.transfers.length).toBe(1)
    expect(transferIntent.transfers[0].token).toBe(tokenAddress.toString())
    expect(transferIntent.transfers[0].recipient).toBe(recipientAddress.toString())
    expect(transferIntent.transfers[0].amount).toBe('5000')
    expect(transferIntent.feeToken).toBe(feeTokenAddress.toString())
    expect(transferIntent.feeAmount).toBe('1000')
    expect(transferIntent.chainId).toBe(chainId)
    expect(JSON.stringify(transferIntent)).toBe(
      '{"op":1,"settler":"0x0000000000000000000000000000000000000013","deadline":"99999999","user":"0x0000000000000000000000000000000000000012","nonce":"0x","transfers":[{"token":"0x0000000000000000000000000000000000000011","amount":"5000","recipient":"0x0000000000000000000000000000000000000012"}],"feeToken":"0x0000000000000000000000000000000000000014","feeAmount":"1000","chainId":1}'
    )
  })

  it('throws an error when transfer list is empty', () => {
    expect(() => {
      const feeToken = Address.fromString('0x00000000000000000000000000000000000000fe')
      const feeAmount = BigInt.fromString('10')
      new Transfer([], feeToken, feeAmount, 1, null, null)
    }).toThrow('Transfer list cannot be empty')
  })
})
