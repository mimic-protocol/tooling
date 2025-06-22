import { JSON } from 'json-as'

import { OperationType, Transfer, TransferBuilder, TransferData } from '../../src/intents'
import { Token, TokenAmount } from '../../src/tokens'
import { Address, BigInt } from '../../src/types'
import { setContext } from '../helpers'

describe('Transfer', () => {
  it('creates a Transfer with valid parameters and stringifies it', () => {
    const tokenAddress = Address.fromString('0x0000000000000000000000000000000000000011')
    const recipientAddress = Address.fromString('0x0000000000000000000000000000000000000012')
    const settlerAddress = Address.fromString('0x0000000000000000000000000000000000000013')
    const feeTokenAddress = Address.fromString('0x0000000000000000000000000000000000000014')
    const userAddress = Address.fromString('0x0000000000000000000000000000000000000015')

    const chainId = 1
    const feeAmount = BigInt.fromString('1000')
    const deadline = BigInt.fromString('99999999')

    const transfers: TransferData[] = [
      TransferData.fromStringDecimal(new Token(tokenAddress.toString(), chainId), '5000', recipientAddress),
    ]

    setContext(chainId, recipientAddress.toString(), 'config-transfer')

    const transfer = new Transfer(transfers, feeTokenAddress, feeAmount, chainId, userAddress, settlerAddress, deadline)

    expect(transfer.op).toBe(OperationType.Transfer)
    expect(transfer.transfers.length).toBe(1)
    expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
    expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
    expect(transfer.transfers[0].amount).toBe('5000')
    expect(transfer.feeToken).toBe(feeTokenAddress.toString())
    expect(transfer.feeAmount).toBe('1000')
    expect(transfer.chainId).toBe(chainId)
    expect(JSON.stringify(transfer)).toBe(
      '{"op":1,"settler":"0x0000000000000000000000000000000000000013","deadline":"99999999","user":"0x0000000000000000000000000000000000000015","nonce":"0x","transfers":[{"token":"0x0000000000000000000000000000000000000011","amount":"5000","recipient":"0x0000000000000000000000000000000000000012"}],"feeToken":"0x0000000000000000000000000000000000000014","feeAmount":"1000","chainId":1}'
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

describe('TransferBuilder', () => {
  const chainId = 1
  const tokenAddressStr = '0x0000000000000000000000000000000000000011'
  const recipientAddressStr = '0x0000000000000000000000000000000000000012'
  const feeTokenAddressStr = '0x00000000000000000000000000000000000000fe'

  it('builds a Transfer from token amounts', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const feeTokenAddress = Address.fromString(feeTokenAddressStr)

    const token = new Token(tokenAddress.toString(), chainId)
    const tokenAmount = new TokenAmount(token, BigInt.fromString('5000'))

    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

    const builder = TransferBuilder.fromTokenAmountAndChain(feeTokenAmount, chainId)
    builder.addTransferFromTokenAmount(tokenAmount, recipientAddress)

    const transfer = builder.build()
    expect(transfer.op).toBe(OperationType.Transfer)
    expect(transfer.chainId).toBe(chainId)
    expect(transfer.transfers.length).toBe(1)
    expect(transfer.transfers[0].amount).toBe('5000')
    expect(transfer.transfers[0].recipient).toBe(recipientAddressStr)
    expect(transfer.transfers[0].token).toBe(tokenAddressStr)
  })

  it('builds a Transfer from string decimals', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const feeTokenAddress = Address.fromString(feeTokenAddressStr)

    const token = new Token(tokenAddress.toString(), chainId)
    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

    const builder = new TransferBuilder(feeTokenAmount, chainId)
    builder.addTransferFromStringDecimal(token, '3000', recipientAddress)

    const transfer = builder.build()
    expect(transfer.transfers[0].amount).toBe('3000')
    expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
    expect(transfer.transfers[0].token).toBe(token.address.toString())
  })

  it('adds multiple TransferData via addTransfers', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const feeTokenAddress = Address.fromString(feeTokenAddressStr)

    const token = new Token(tokenAddress.toString(), chainId)
    const tokenAmount = new TokenAmount(token, BigInt.fromString('5000'))

    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

    const transfer1 = TransferData.fromTokenAmount(tokenAmount, recipientAddress)
    const transfer2 = TransferData.fromStringDecimal(token, '1000', recipientAddress)

    const builder = new TransferBuilder(feeTokenAmount, chainId)
    builder.addTransfers([transfer1, transfer2])

    const transfer = builder.build()
    expect(transfer.transfers.length).toBe(2)
    expect(transfer.transfers[0].amount).toBe('5000')
    expect(transfer.transfers[1].amount).toBe('1000')
  })

  it('adds multiple TokenAmounts via addTransfersFromTokenAmounts', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const feeTokenAddress = Address.fromString(feeTokenAddressStr)

    const token = new Token(tokenAddress.toString(), chainId)
    const feeToken = new Token(feeTokenAddress.toString(), chainId)
    const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

    const tokenAmounts = [TokenAmount.fromStringDecimal(token, '100'), TokenAmount.fromStringDecimal(token, '200')]

    const builder = new TransferBuilder(feeTokenAmount, chainId)
    builder.addTransfersFromTokenAmounts(tokenAmounts, recipientAddress)

    const transfer = builder.build()
    expect(transfer.transfers.length).toBe(2)
    expect(transfer.transfers[1].amount).toBe('200')
  })

  it('throws if fee token chainId mismatches the transfer chainId', () => {
    expect(() => {
      const feeTokenAddress = Address.fromString(feeTokenAddressStr)
      const invalidFeeToken = new TokenAmount(
        new Token(feeTokenAddress.toString(), 2), // mismatched chainId
        BigInt.fromString('10')
      )

      new TransferBuilder(invalidFeeToken, chainId)
    }).toThrow('Fee token must be on the same chain as the one requested for the transfer')
  })

  it('throws if addTransferFromStringDecimal has different chainId', () => {
    expect(() => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)
      const feeTokenAddress = Address.fromString(feeTokenAddressStr)

      const feeToken = new Token(feeTokenAddress.toString(), chainId)
      const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

      const wrongChainToken = new Token(tokenAddress.toString(), 1337)

      const builder = new TransferBuilder(feeTokenAmount, chainId)

      builder.addTransferFromStringDecimal(wrongChainToken, '100', recipientAddress)
    }).toThrow('All tokens must be on the same chain')
  })

  it('throws if addTransferFromTokenAmount has different chainId', () => {
    expect(() => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)
      const feeTokenAddress = Address.fromString(feeTokenAddressStr)

      const feeToken = new Token(feeTokenAddress.toString(), chainId)
      const feeTokenAmount = new TokenAmount(feeToken, BigInt.fromString('10'))

      const wrongChainTokenAmount = new TokenAmount(new Token(tokenAddress.toString(), 1337), BigInt.fromString('100'))

      const builder = new TransferBuilder(feeTokenAmount, chainId)

      builder.addTransferFromTokenAmount(wrongChainTokenAmount, recipientAddress)
    }).toThrow('All tokens must be on the same chain')
  })
})
