import { JSON } from 'json-as'

import { OperationEvent, OperationType, Transfer, TransferBuilder, TransferData } from '../../src/intents'
import { ERC20Token, SPLToken, TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes, ChainId } from '../../src/types'
import {
  randomERC20Token,
  randomEvmAddress,
  randomSettler,
  randomSvmAddress,
  randomSvmSettler,
  setContext,
} from '../helpers'

describe('Transfer', () => {
  describe('create', () => {
    it('creates a simple Transfer with default values and stringifies it', () => {
      const chainId = 1
      const user = randomEvmAddress()
      const tokenAddress = randomEvmAddress()
      const token = new ERC20Token(tokenAddress, chainId)
      const amount = BigInt.fromI32(1000)
      const recipient = randomEvmAddress()
      const settler = randomSettler(chainId)

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const transfer = new Transfer(chainId, [TransferData.fromBigInt(token, amount, recipient)])
      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.user).toBe(user.toString())

      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
      expect(transfer.transfers[0].recipient).toBe(recipient.toString())
      expect(transfer.transfers[0].amount).toBe(amount.toString())

      expect(transfer.events.length).toBe(0)

      expect(JSON.stringify(transfer)).toBe(
        `{"opType":1,"chainId":${chainId},"user":"${user}","events":[],"transfers":[{"token":"${transfer.transfers[0].token}","amount":"${transfer.transfers[0].amount}","recipient":"${transfer.transfers[0].recipient}"}]}`
      )
    })

    it('creates a simple Transfer with valid parameters and stringifies it', () => {
      const chainId = 1
      const user = randomEvmAddress()
      const tokenAddress = randomEvmAddress()
      const token = new ERC20Token(tokenAddress, chainId)
      const amount = BigInt.fromI32(1000)
      const recipient = randomEvmAddress()
      const settler = randomSettler(chainId)

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const transfer = new Transfer(chainId, [TransferData.fromBigInt(token, amount, recipient)], user, [
        new OperationEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data')),
      ])

      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.user).toBe(user.toString())

      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
      expect(transfer.transfers[0].recipient).toBe(recipient.toString())
      expect(transfer.transfers[0].amount).toBe(amount.toString())

      expect(transfer.events.length).toBe(1)
      expect(transfer.events[0].topic).toBe('0x746f706963')
      expect(transfer.events[0].data).toBe('0x64617461')

      expect(JSON.stringify(transfer)).toBe(
        `{"opType":1,"chainId":${chainId},"user":"${user}","events":[{"topic":"0x746f706963","data":"0x64617461"}],"transfers":[{"token":"${transfer.transfers[0].token}","amount":"${transfer.transfers[0].amount}","recipient":"${transfer.transfers[0].recipient}"}]}`
      )
    })
  })

  describe('constructor', () => {
    it('creates a complex Transfer with valid parameters and stringifies it', () => {
      const chainId = 1
      const user = randomEvmAddress()
      const transferData = TransferData.fromI32(randomERC20Token(chainId), 5000, randomEvmAddress())
      const settler = randomSettler(chainId)

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const transfer = new Transfer(chainId, [transferData], user, [])

      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.user).toBe(user.toString())

      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].token).toBe(transferData.token)
      expect(transfer.transfers[0].recipient).toBe(transferData.recipient)
      expect(transfer.transfers[0].amount).toBe(transferData.amount)

      expect(transfer.events.length).toBe(0)

      expect(JSON.stringify(transfer)).toBe(
        `{"opType":1,"chainId":${chainId},"user":"${user}","events":[],"transfers":[{"token":"${transferData.token}","amount":"${transferData.amount}","recipient":"${transferData.recipient}"}]}`
      )
    })
  })
})

describe('TransferBuilder', () => {
  const chainId = 1
  const tokenAddressStr = '0x0000000000000000000000000000000000000011'
  const recipientAddressStr = '0x0000000000000000000000000000000000000012'

  describe('build', () => {
    it('builds a Transfer from token amounts', () => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)
      const token = ERC20Token.fromAddress(tokenAddress, chainId, 0)
      const tokenAmount = TokenAmount.fromI32(token, 5000)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromTokenAmount(tokenAmount, recipientAddress)

      const transfer = builder.build()
      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].amount).toBe('5000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddressStr)
      expect(transfer.transfers[0].token).toBe(tokenAddressStr)
    })

    it('builds a Transfer from string decimals', () => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)
      const token = ERC20Token.fromAddress(tokenAddress, chainId, 0)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromStringDecimal(token, '3000', recipientAddress)

      const transfer = builder.build()
      expect(transfer.transfers[0].amount).toBe('3000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
      expect(transfer.transfers[0].token).toBe(token.address.toString())
    })

    it('adds multiple TransferData via addTransfers', () => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)

      const token = ERC20Token.fromAddress(tokenAddress, chainId, 0)
      const amount = TokenAmount.fromI32(token, 5000)
      const transfer1 = TransferData.fromTokenAmount(amount, recipientAddress)
      const transfer2 = TransferData.fromStringDecimal(token, '1000', recipientAddress)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfers([transfer1, transfer2])

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[0].amount).toBe('5000')
      expect(transfer.transfers[1].amount).toBe('1000')
    })

    it('adds multiple TokenAmounts via addTransfersFromTokenAmounts', () => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)

      const token = ERC20Token.fromAddress(tokenAddress, chainId, 0)
      const tokenAmounts = [TokenAmount.fromStringDecimal(token, '100'), TokenAmount.fromStringDecimal(token, '200')]

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfersFromTokenAmounts(tokenAmounts, recipientAddress)

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[1].amount).toBe('200')
    })
  })

  describe('validations', () => {
    describe('chainId', () => {
      it('throws if addTransferFromStringDecimal has different chainId', () => {
        expect(() => {
          const tokenAddress = Address.fromString(tokenAddressStr)
          const recipientAddress = Address.fromString(recipientAddressStr)
          const wrongChainToken = ERC20Token.fromAddress(tokenAddress, ChainId.OPTIMISM)
          const builder = TransferBuilder.forChain(chainId)

          builder.addTransferFromStringDecimal(wrongChainToken, '100', recipientAddress)
        }).toThrow('All tokens must be on the same chain')
      })

      it('throws if addTransferFromTokenAmount has different chainId', () => {
        expect(() => {
          const tokenAddress = Address.fromString(tokenAddressStr)
          const recipientAddress = Address.fromString(recipientAddressStr)
          const wrongChainTokenAmount = TokenAmount.fromI32(ERC20Token.fromAddress(tokenAddress, ChainId.OPTIMISM), 100)
          const builder = TransferBuilder.forChain(chainId)

          builder.addTransferFromTokenAmount(wrongChainTokenAmount, recipientAddress)
        }).toThrow('All tokens must be on the same chain')
      })
    })
  })
})

describe('Transfer - SVM support', () => {
  describe('create', () => {
    it('creates a simple SVM Transfer with SPLToken and stringifies it', () => {
      const chainId = ChainId.SOLANA_MAINNET
      const user = randomSvmAddress()
      const tokenAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, chainId, 9, 'SOL')
      const amount = BigInt.fromI32(1000)
      const recipient = randomSvmAddress()
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const transfer = new Transfer(chainId, [TransferData.fromBigInt(token, amount, recipient)])
      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.user).toBe(user.toString())

      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
      expect(transfer.transfers[0].recipient).toBe(recipient.toString())
      expect(transfer.transfers[0].amount).toBe(amount.toString())

      expect(transfer.events.length).toBe(0)

      expect(JSON.stringify(transfer)).toBe(
        `{"opType":1,"chainId":${chainId},"user":"${user}","events":[],"transfers":[{"token":"${transfer.transfers[0].token}","amount":"${transfer.transfers[0].amount}","recipient":"${transfer.transfers[0].recipient}"}]}`
      )
    })

    it('creates a SVM Transfer with native SOL token', () => {
      const user = randomSvmAddress()
      const token = SPLToken.native()
      const amount = BigInt.fromI32(1000)
      const recipient = randomSvmAddress()
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const transfer = new Transfer(ChainId.SOLANA_MAINNET, [TransferData.fromBigInt(token, amount, recipient)])
      expect(transfer.chainId).toBe(ChainId.SOLANA_MAINNET)
      expect(transfer.transfers[0].token).toBe(token.address.toString())
      expect(token.isNative()).toBe(true)
    })

    it('creates a complex SVM Transfer with multiple transfers', () => {
      const chainId = ChainId.SOLANA_MAINNET
      const user = randomSvmAddress()
      const token1 = SPLToken.native()
      const token2 = SPLToken.fromAddress(randomSvmAddress(), chainId, 6, 'USDC')
      const transferData1 = TransferData.fromI32(token1, 5000, randomSvmAddress())
      const transferData2 = TransferData.fromI32(token2, 1000, randomSvmAddress())
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const transfer = new Transfer(chainId, [transferData1, transferData2], user, [])

      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.user).toBe(user.toString())

      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[0].token).toBe(transferData1.token)
      expect(transfer.transfers[0].recipient).toBe(transferData1.recipient)
      expect(transfer.transfers[0].amount).toBe(transferData1.amount)
      expect(transfer.transfers[1].token).toBe(transferData2.token)
      expect(transfer.transfers[1].recipient).toBe(transferData2.recipient)
      expect(transfer.transfers[1].amount).toBe(transferData2.amount)
    })
  })
})

describe('TransferBuilder - SVM support', () => {
  const chainId = ChainId.SOLANA_MAINNET

  describe('build', () => {
    it('builds a SVM Transfer from SPLToken amounts', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, chainId, 9, 'SOL')
      const tokenAmount = TokenAmount.fromI32(token, 5000)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromTokenAmount(tokenAmount, recipientAddress)

      const transfer = builder.build()
      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].amount).toBe('5000000000000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
    })

    it('builds a SVM Transfer from string decimals', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, chainId, 9, 'SOL')

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromStringDecimal(token, '3000', recipientAddress)

      const transfer = builder.build()
      expect(transfer.transfers[0].amount).toBe('3000000000000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
      expect(transfer.transfers[0].token).toBe(token.address.toString())
    })

    it('adds multiple SVM TransferData via addTransfers', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, chainId, 9, 'SOL')
      const amount = TokenAmount.fromI32(token, 5000)
      const transfer1 = TransferData.fromTokenAmount(amount, recipientAddress)
      const transfer2 = TransferData.fromStringDecimal(token, '1000', recipientAddress)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfers([transfer1, transfer2])

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[0].amount).toBe('5000000000000')
      expect(transfer.transfers[1].amount).toBe('1000000000000')
    })

    it('adds multiple SPLToken amounts via addTransfersFromTokenAmounts', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, chainId, 9, 'SOL')
      const tokenAmounts = [TokenAmount.fromStringDecimal(token, '100'), TokenAmount.fromStringDecimal(token, '200')]

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfersFromTokenAmounts(tokenAmounts, recipientAddress)

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[1].amount).toBe('200000000000')
    })

    it('creates a complete Solana Transfer with all builder methods', () => {
      const user = randomSvmAddress()
      const token = SPLToken.native()
      const recipient = randomSvmAddress()
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-transfer')

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromI32(token, 1000, recipient)

      const transfer = builder.build()
      expect(transfer.opType).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.user).toBe(user.toString())
      expect(transfer.transfers.length).toBe(1)
    })
  })

  describe('chainId validations', () => {
    it('throws if addTransferFromStringDecimal has different chainId for Solana', () => {
      expect(() => {
        const tokenAddress = randomSvmAddress()
        const recipientAddress = randomSvmAddress()
        const wrongChainToken = ERC20Token.fromAddress(tokenAddress, ChainId.ETHEREUM)
        const builder = TransferBuilder.forChain(chainId)

        builder.addTransferFromStringDecimal(wrongChainToken, '100', recipientAddress)
      }).toThrow('All tokens must be on the same chain')
    })

    it('throws if addTransferFromTokenAmount has different chainId for Solana', () => {
      expect(() => {
        const tokenAddress = randomSvmAddress()
        const recipientAddress = randomSvmAddress()
        const wrongChainTokenAmount = TokenAmount.fromI32(ERC20Token.fromAddress(tokenAddress, ChainId.ETHEREUM), 100)
        const builder = TransferBuilder.forChain(chainId)

        builder.addTransferFromTokenAmount(wrongChainTokenAmount, recipientAddress)
      }).toThrow('All tokens must be on the same chain')
    })
  })
})
