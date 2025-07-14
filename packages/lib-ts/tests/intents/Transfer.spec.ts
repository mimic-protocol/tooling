import { JSON } from 'json-as'

import { OperationType, Transfer, TransferBuilder, TransferData } from '../../src/intents'
import { Token, TokenAmount } from '../../src/tokens'
import { Address, BigInt } from '../../src/types'
import { randomAddress, randomSettler, randomToken, setContext } from '../helpers'

describe('Transfer', () => {
  it('creates a simple Transfer with default values and stringifies it', () => {
    const chainId = 1
    const user = randomAddress()
    const token = randomAddress()
    const amount = BigInt.fromI32(1000)
    const fee = BigInt.fromI32(10)
    const recipient = randomAddress()
    const settler = randomSettler(chainId)

    setContext(1, 1, user.toString(), [settler], 'config-transfer')

    const transfer = Transfer.create(chainId, token, amount, recipient, fee)
    expect(transfer.op).toBe(OperationType.Transfer)
    expect(transfer.user).toBe(user.toString())
    expect(transfer.settler).toBe(settler.address.toString())
    expect(transfer.chainId).toBe(chainId)
    expect(transfer.deadline).toBe('300')
    expect(transfer.nonce).toBe('0x')

    expect(transfer.transfers.length).toBe(1)
    expect(transfer.transfers[0].token).toBe(token.toString())
    expect(transfer.transfers[0].recipient).toBe(recipient.toString())
    expect(transfer.transfers[0].amount).toBe(amount.toString())

    expect(transfer.feeToken).toBe(token.toString())
    expect(transfer.feeAmount).toBe(fee.toString())

    expect(JSON.stringify(transfer)).toBe(
      `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","chainId":${chainId},"transfers":[{"token":"${token}","amount":"${amount}","recipient":"${recipient}"}],"feeToken":"${token}","feeAmount":"${fee}"}`
    )
  })

  it('creates a simple Transfer with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomAddress()
    const token = randomAddress()
    const amount = BigInt.fromI32(1000)
    const fee = BigInt.fromI32(10)
    const recipient = randomAddress()
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(9999999)

    setContext(1, 1, user.toString(), [settler], 'config-transfer')

    const transfer = Transfer.create(
      chainId,
      token,
      amount,
      recipient,
      fee,
      Address.fromString(settler.address),
      user,
      deadline
    )

    expect(transfer.op).toBe(OperationType.Transfer)
    expect(transfer.chainId).toBe(chainId)
    expect(transfer.user).toBe(user.toString())
    expect(transfer.settler).toBe(settler.address.toString())
    expect(transfer.deadline).toBe(deadline.toString())
    expect(transfer.nonce).toBe('0x')

    expect(transfer.transfers.length).toBe(1)
    expect(transfer.transfers[0].token).toBe(token.toString())
    expect(transfer.transfers[0].recipient).toBe(recipient.toString())
    expect(transfer.transfers[0].amount).toBe(amount.toString())

    expect(transfer.feeToken).toBe(token.toString())
    expect(transfer.feeAmount).toBe(fee.toString())

    expect(JSON.stringify(transfer)).toBe(
      `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","chainId":${chainId},"transfers":[{"token":"${token}","amount":"${amount}","recipient":"${recipient}"}],"feeToken":"${token}","feeAmount":"${fee}"}`
    )
  })

  it('creates a complex Transfer with valid parameters and stringifies it', () => {
    const chainId = 1
    const user = randomAddress()
    const transferData = TransferData.fromI32(randomToken(chainId), 5000, randomAddress())
    const fee = TokenAmount.fromI32(randomToken(chainId), 10)
    const settler = randomSettler(chainId)
    const deadline = BigInt.fromI32(9999999)

    setContext(1, 1, user.toString(), [settler], 'config-transfer')

    const transfer = new Transfer(chainId, [transferData], fee, Address.fromString(settler.address), user, deadline)

    expect(transfer.op).toBe(OperationType.Transfer)
    expect(transfer.chainId).toBe(chainId)
    expect(transfer.user).toBe(user.toString())
    expect(transfer.settler).toBe(settler.address.toString())
    expect(transfer.deadline).toBe(deadline.toString())
    expect(transfer.nonce).toBe('0x')

    expect(transfer.transfers.length).toBe(1)
    expect(transfer.transfers[0].token).toBe(transferData.token)
    expect(transfer.transfers[0].recipient).toBe(transferData.recipient)
    expect(transfer.transfers[0].amount).toBe(transferData.amount)

    expect(transfer.feeToken).toBe(fee.token.address.toString())
    expect(transfer.feeAmount).toBe(fee.amount.toString())

    expect(JSON.stringify(transfer)).toBe(
      `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","chainId":${chainId},"transfers":[{"token":"${transferData.token}","amount":"${transferData.amount}","recipient":"${transferData.recipient}"}],"feeToken":"${fee.token.address}","feeAmount":"${fee.amount}"}`
    )
  })

  it('throws an error when transfer list is empty', () => {
    expect(() => {
      const fee = TokenAmount.fromBigInt(randomToken(), BigInt.fromI32(10))
      new Transfer(1, [], fee, null, null)
    }).toThrow('Transfer list cannot be empty')
  })
})

describe('TransferBuilder', () => {
  const chainId = 1
  const tokenAddressStr = '0x0000000000000000000000000000000000000011'
  const recipientAddressStr = '0x0000000000000000000000000000000000000012'

  it('builds a Transfer from token amounts', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const fee = TokenAmount.fromI32(randomToken(chainId), 9)
    const token = Token.fromAddress(tokenAddress, chainId)
    const tokenAmount = TokenAmount.fromI32(token, 5000)

    const builder = TransferBuilder.forChainWithFee(chainId, fee)
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
    const token = Token.fromAddress(tokenAddress, chainId)
    const fee = TokenAmount.fromI32(randomToken(chainId), 9)

    const builder = TransferBuilder.forChainWithFee(chainId, fee)
    builder.addTransferFromStringDecimal(token, '3000', recipientAddress)

    const transfer = builder.build()
    expect(transfer.transfers[0].amount).toBe('3000')
    expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
    expect(transfer.transfers[0].token).toBe(token.address.toString())
  })

  it('adds multiple TransferData via addTransfers', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const fee = TokenAmount.fromI32(randomToken(chainId), 9)

    const token = Token.fromAddress(tokenAddress, chainId)
    const amount = TokenAmount.fromI32(token, 5000)
    const transfer1 = TransferData.fromTokenAmount(amount, recipientAddress)
    const transfer2 = TransferData.fromStringDecimal(token, '1000', recipientAddress)

    const builder = TransferBuilder.forChainWithFee(chainId, fee)
    builder.addTransfers([transfer1, transfer2])

    const transfer = builder.build()
    expect(transfer.transfers.length).toBe(2)
    expect(transfer.transfers[0].amount).toBe('5000')
    expect(transfer.transfers[1].amount).toBe('1000')
  })

  it('adds multiple TokenAmounts via addTransfersFromTokenAmounts', () => {
    const tokenAddress = Address.fromString(tokenAddressStr)
    const recipientAddress = Address.fromString(recipientAddressStr)
    const fee = TokenAmount.fromI32(randomToken(chainId), 9)

    const token = Token.fromAddress(tokenAddress, chainId)
    const tokenAmounts = [TokenAmount.fromStringDecimal(token, '100'), TokenAmount.fromStringDecimal(token, '200')]

    const builder = TransferBuilder.forChainWithFee(chainId, fee)
    builder.addTransfersFromTokenAmounts(tokenAmounts, recipientAddress)

    const transfer = builder.build()
    expect(transfer.transfers.length).toBe(2)
    expect(transfer.transfers[1].amount).toBe('200')
  })

  it('throws if fee token chainId mismatches the transfer chainId', () => {
    expect(() => {
      const fee = TokenAmount.fromI32(randomToken(9), 2) // mismatched chainId
      TransferBuilder.forChainWithFee(chainId, fee)
    }).toThrow('Fee token must be on the same chain as the one requested for the transfer')
  })

  it('throws if addTransferFromStringDecimal has different chainId', () => {
    expect(() => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)
      const fee = TokenAmount.fromI32(randomToken(chainId), 9)
      const wrongChainToken = Token.fromAddress(tokenAddress, 1337)

      const builder = TransferBuilder.forChainWithFee(chainId, fee)

      builder.addTransferFromStringDecimal(wrongChainToken, '100', recipientAddress)
    }).toThrow('All tokens must be on the same chain')
  })

  it('throws if addTransferFromTokenAmount has different chainId', () => {
    expect(() => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)
      const fee = TokenAmount.fromI32(randomToken(chainId), 9)
      const wrongChainTokenAmount = TokenAmount.fromI32(Token.fromAddress(tokenAddress, 1337), 100)

      const builder = TransferBuilder.forChainWithFee(chainId, fee)

      builder.addTransferFromTokenAmount(wrongChainTokenAmount, recipientAddress)
    }).toThrow('All tokens must be on the same chain')
  })
})
