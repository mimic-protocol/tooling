import { JSON } from 'json-as'

import { OperationType, Transfer, TransferBuilder, TransferData } from '../../src/intents'
import { ERC20Token, SPLToken, TokenAmount } from '../../src/tokens'
import { Address, BigInt, ChainId } from '../../src/types'
import {
  randomEvmAddress,
  randomSettler,
  randomSvmAddress,
  randomSvmSettler,
  randomToken,
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
      const fee = BigInt.fromI32(10)
      const recipient = randomEvmAddress()
      const settler = randomSettler(chainId)

      setContext(1, 1, user.toString(), [settler], 'config-transfer')

      const transfer = Transfer.create(token, amount, recipient, fee)
      expect(transfer.op).toBe(OperationType.Transfer)
      expect(transfer.user).toBe(user.toString())
      expect(transfer.settler).toBe(settler.address.toString())
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.deadline).toBe('300')
      expect(transfer.nonce).toBe('0x')

      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
      expect(transfer.transfers[0].recipient).toBe(recipient.toString())
      expect(transfer.transfers[0].amount).toBe(amount.toString())

      expect(transfer.maxFees.length).toBe(1)
      expect(transfer.maxFees[0].token).toBe(tokenAddress.toString())
      expect(transfer.maxFees[0].amount).toBe(fee.toString())

      expect(JSON.stringify(transfer)).toBe(
        `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","maxFees":[{"token":"${tokenAddress}","amount":"${fee.toString()}"}],"chainId":${chainId},"transfers":[{"token":"${tokenAddress}","amount":"${amount}","recipient":"${recipient}"}]}`
      )
    })

    it('creates a simple Transfer with valid parameters and stringifies it', () => {
      const chainId = 1
      const user = randomEvmAddress()
      const tokenAddress = randomEvmAddress()
      const token = new ERC20Token(tokenAddress, chainId)
      const amount = BigInt.fromI32(1000)
      const fee = BigInt.fromI32(10)
      const recipient = randomEvmAddress()
      const settler = randomSettler(chainId)
      const deadline = BigInt.fromI32(9999999)

      setContext(1, 1, user.toString(), [settler], 'config-transfer')

      const transfer = Transfer.create(
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
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
      expect(transfer.transfers[0].recipient).toBe(recipient.toString())
      expect(transfer.transfers[0].amount).toBe(amount.toString())

      expect(transfer.maxFees.length).toBe(1)
      expect(transfer.maxFees[0].token).toBe(tokenAddress.toString())
      expect(transfer.maxFees[0].amount).toBe(fee.toString())

      expect(JSON.stringify(transfer)).toBe(
        `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[{"token":"${tokenAddress}","amount":"${fee.toString()}"}],"chainId":${chainId},"transfers":[{"token":"${tokenAddress}","amount":"${amount}","recipient":"${recipient}"}]}`
      )
    })
  })

  describe('constructor', () => {
    it('creates a complex Transfer with valid parameters and stringifies it', () => {
      const chainId = 1
      const user = randomEvmAddress()
      const transferData = TransferData.fromI32(randomToken(chainId), 5000, randomEvmAddress())
      const fee = TokenAmount.fromI32(randomToken(chainId), 10)
      const settler = randomSettler(chainId)
      const deadline = BigInt.fromI32(9999999)

      setContext(1, 1, user.toString(), [settler], 'config-transfer')

      const transfer = new Transfer(
        chainId,
        [transferData],
        [fee],
        Address.fromString(settler.address),
        user,
        deadline,
        '0x'
      )

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

      expect(transfer.maxFees.length).toBe(1)
      expect(transfer.maxFees[0].token).toBe(fee.token.address.toString())
      expect(transfer.maxFees[0].amount).toBe(fee.amount.toString())

      expect(JSON.stringify(transfer)).toBe(
        `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"chainId":${chainId},"transfers":[{"token":"${transferData.token}","amount":"${transferData.amount}","recipient":"${transferData.recipient}"}]}`
      )
    })
  })

  describe('validations', () => {
    describe('misc', () => {
      it('throws an error when transfer list is empty', () => {
        expect(() => {
          new Transfer(1, [], [])
        }).toThrow('Transfer list cannot be empty')
      })

      it('throws an error when there is no max fee', () => {
        expect(() => {
          const transferData = TransferData.fromI32(randomToken(1), 5000, randomEvmAddress())
          new Transfer(1, [transferData], [])
        }).toThrow('At least a max fee must be specified')
      })
    })

    describe('addresses', () => {
      it('throws when SVM user address is used with EVM transfer', () => {
        expect(() => {
          const user = randomSvmAddress()
          const token = new ERC20Token(randomEvmAddress(), 1)
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomEvmAddress()
          const settler = randomEvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid user address')
      })

      it('throws when SVM settler address is used with EVM transfer', () => {
        expect(() => {
          const user = randomEvmAddress()
          const token = new ERC20Token(randomEvmAddress(), 1)
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomEvmAddress()
          const settler = randomSvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid settler address')
      })

      it('throws when SVM token address is used with EVM transfer', () => {
        expect(() => {
          const user = randomEvmAddress()
          const token = SPLToken.native()
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomEvmAddress()
          const settler = randomEvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid transfer token address')
      })

      it('throws when SVM recipient address is used with EVM transfer', () => {
        expect(() => {
          const user = randomEvmAddress()
          const token = new ERC20Token(randomEvmAddress(), 1)
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomSvmAddress()
          const settler = randomEvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid transfer token address')
      })
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
      const token = ERC20Token.fromAddress(tokenAddress, chainId)
      const tokenAmount = TokenAmount.fromI32(token, 5000)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromTokenAmount(tokenAmount, recipientAddress)
      builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 9))

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
      const token = ERC20Token.fromAddress(tokenAddress, chainId)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromStringDecimal(token, '3000', recipientAddress)
      builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 9))

      const transfer = builder.build()
      expect(transfer.transfers[0].amount).toBe('3000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
      expect(transfer.transfers[0].token).toBe(token.address.toString())
    })

    it('adds multiple TransferData via addTransfers', () => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)

      const token = ERC20Token.fromAddress(tokenAddress, chainId)
      const amount = TokenAmount.fromI32(token, 5000)
      const transfer1 = TransferData.fromTokenAmount(amount, recipientAddress)
      const transfer2 = TransferData.fromStringDecimal(token, '1000', recipientAddress)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfers([transfer1, transfer2])
      builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 9))

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[0].amount).toBe('5000')
      expect(transfer.transfers[1].amount).toBe('1000')
    })

    it('adds multiple TokenAmounts via addTransfersFromTokenAmounts', () => {
      const tokenAddress = Address.fromString(tokenAddressStr)
      const recipientAddress = Address.fromString(recipientAddressStr)

      const token = ERC20Token.fromAddress(tokenAddress, chainId)
      const tokenAmounts = [TokenAmount.fromStringDecimal(token, '100'), TokenAmount.fromStringDecimal(token, '200')]

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfersFromTokenAmounts(tokenAmounts, recipientAddress)
      builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 9))

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[1].amount).toBe('200')
    })
  })

  describe('validations', () => {
    describe('chainId', () => {
      it('throws if fee token chainId mismatches the transfer chainId', () => {
        expect(() => {
          const fee = TokenAmount.fromI32(randomToken(ChainId.GNOSIS), 2)
          TransferBuilder.forChain(chainId).addMaxFee(fee)
        }).toThrow('Fee token must be on the same chain as the one requested for the transfer')
      })

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

    describe('addresses', () => {
      it('throws when SVM token is used with EVM TransferBuilder', () => {
        expect(() => {
          const svmToken = SPLToken.native()
          const recipientAddress = Address.fromString(recipientAddressStr)
          const builder = TransferBuilder.forChain(chainId)

          builder.addTransferFromStringDecimal(svmToken, '100', recipientAddress)
        }).toThrow('All tokens must be on the same chain')
      })

      it('throws when SVM token amount is used with EVM TransferBuilder', () => {
        expect(() => {
          const svmToken = SPLToken.native()
          const svmTokenAmount = TokenAmount.fromI32(svmToken, 100)
          const recipientAddress = Address.fromString(recipientAddressStr)
          const builder = TransferBuilder.forChain(chainId)

          builder.addTransferFromTokenAmount(svmTokenAmount, recipientAddress)
        }).toThrow('All tokens must be on the same chain')
      })

      it('throws when SVM fee token is used with EVM TransferBuilder', () => {
        expect(() => {
          const svmToken = SPLToken.native()
          const svmFee = TokenAmount.fromI32(svmToken, 10)
          const builder = TransferBuilder.forChain(chainId)

          builder.addMaxFee(svmFee)
        }).toThrow('Fee token must be on the same chain')
      })

      it('throws when SVM settler address is used with EVM TransferBuilder', () => {
        expect(() => {
          const svmSettler = randomSvmAddress()
          const builder = TransferBuilder.forChain(chainId)

          builder.addSettler(svmSettler).build()
        }).toThrow('Invalid settler address')
      })

      it('throws when SVM user address is used with EVM TransferBuilder', () => {
        expect(() => {
          const svmUser = randomSvmAddress()
          const token = ERC20Token.fromAddress(Address.fromString(tokenAddressStr), chainId)
          const recipientAddress = Address.fromString(recipientAddressStr)
          const builder = TransferBuilder.forChain(chainId)

          builder.addTransferFromI32(token, 100, recipientAddress)
          builder.addMaxFee(TokenAmount.fromI32(randomToken(chainId), 9))
          builder.addUser(svmUser).build()
        }).toThrow('Invalid user address')
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
      const token = SPLToken.fromAddress(tokenAddress, 9, 'SOL')
      const amount = BigInt.fromI32(1000)
      const fee = BigInt.fromI32(10)
      const recipient = randomSvmAddress()
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'config-transfer')

      const transfer = Transfer.create(token, amount, recipient, fee)
      expect(transfer.op).toBe(OperationType.Transfer)
      expect(transfer.user).toBe(user.toString())
      expect(transfer.settler).toBe(settler.address.toString())
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.deadline).toBe('300')
      expect(transfer.nonce).toBe('0x')
      expect(transfer.isSVM()).toBe(true)

      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
      expect(transfer.transfers[0].recipient).toBe(recipient.toString())
      expect(transfer.transfers[0].amount).toBe(amount.toString())

      expect(transfer.maxFees.length).toBe(1)
      expect(transfer.maxFees[0].token).toBe(tokenAddress.toString())
      expect(transfer.maxFees[0].amount).toBe(fee.toString())

      expect(JSON.stringify(transfer)).toBe(
        `{"op":1,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","maxFees":[{"token":"${tokenAddress}","amount":"${fee.toString()}"}],"chainId":${chainId},"transfers":[{"token":"${tokenAddress}","amount":"${amount}","recipient":"${recipient}"}]}`
      )
    })

    it('creates a SVM Transfer with native SOL token', () => {
      const user = randomSvmAddress()
      const token = SPLToken.native()
      const amount = BigInt.fromI32(1000)
      const fee = BigInt.fromI32(10)
      const recipient = randomSvmAddress()
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'config-transfer')

      const transfer = Transfer.create(token, amount, recipient, fee)
      expect(transfer.chainId).toBe(ChainId.SOLANA_MAINNET)
      expect(transfer.isSVM()).toBe(true)
      expect(transfer.transfers[0].token).toBe(token.address.toString())
      expect(token.isNative()).toBe(true)
    })

    it('creates a complex SVM Transfer with multiple transfers', () => {
      const chainId = ChainId.SOLANA_MAINNET
      const user = randomSvmAddress()
      const token1 = SPLToken.native()
      const token2 = SPLToken.fromAddress(randomSvmAddress(), 6, 'USDC')
      const transferData1 = TransferData.fromI32(token1, 5000, randomSvmAddress())
      const transferData2 = TransferData.fromI32(token2, 1000, randomSvmAddress())
      const fee = TokenAmount.fromI32(token1, 10)
      const settler = randomSvmSettler()
      const deadline = BigInt.fromI32(9999999)

      setContext(1, 1, user.toString(), [settler], 'config-transfer')

      const transfer = new Transfer(
        chainId,
        [transferData1, transferData2],
        [fee],
        Address.fromString(settler.address),
        user,
        deadline,
        '0x'
      )

      expect(transfer.op).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.isSVM()).toBe(true)
      expect(transfer.user).toBe(user.toString())
      expect(transfer.settler).toBe(settler.address.toString())
      expect(transfer.deadline).toBe(deadline.toString())
      expect(transfer.nonce).toBe('0x')

      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[0].token).toBe(transferData1.token)
      expect(transfer.transfers[0].recipient).toBe(transferData1.recipient)
      expect(transfer.transfers[0].amount).toBe(transferData1.amount)
      expect(transfer.transfers[1].token).toBe(transferData2.token)
      expect(transfer.transfers[1].recipient).toBe(transferData2.recipient)
      expect(transfer.transfers[1].amount).toBe(transferData2.amount)

      expect(transfer.maxFees.length).toBe(1)
      expect(transfer.maxFees[0].token).toBe(fee.token.address.toString())
      expect(transfer.maxFees[0].amount).toBe(fee.amount.toString())
    })

    describe('address encoding validations', () => {
      it('validates SVM address encoding for user address', () => {
        expect(() => {
          const user = randomEvmAddress()
          const token = SPLToken.native()
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomSvmAddress()
          const settler = randomSvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid user address')
      })

      it('validates SVM address encoding for settler address', () => {
        expect(() => {
          const user = randomSvmAddress()
          const token = SPLToken.native()
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomSvmAddress()
          const settler = randomEvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid settler address')
      })

      it('validates SVM address encoding for transfer token addresses', () => {
        expect(() => {
          const user = randomSvmAddress()
          const token = ERC20Token.fromAddress(randomEvmAddress(), ChainId.ETHEREUM)
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomSvmAddress()
          const settler = randomSvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid transfer token address')
      })

      it('validates SVM address encoding for recipient addresses', () => {
        expect(() => {
          const user = randomSvmAddress()
          const token = SPLToken.native()
          const amount = BigInt.fromI32(1000)
          const fee = BigInt.fromI32(10)
          const recipient = randomEvmAddress()
          const settler = randomSvmAddress()

          Transfer.create(token, amount, recipient, fee, settler, user)
        }).toThrow('Invalid transfer token address')
      })
    })
  })
})

describe('TransferBuilder - SVM support', () => {
  const chainId = ChainId.SOLANA_MAINNET

  describe('build', () => {
    it('builds a SVM Transfer from SPLToken amounts', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, 9, 'SOL')
      const tokenAmount = TokenAmount.fromI32(token, 5000)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromTokenAmount(tokenAmount, recipientAddress)
      builder.addMaxFee(TokenAmount.fromI32(token, 9))

      const transfer = builder.build()
      expect(transfer.op).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.isSVM()).toBe(true)
      expect(transfer.transfers.length).toBe(1)
      expect(transfer.transfers[0].amount).toBe('5000000000000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
      expect(transfer.transfers[0].token).toBe(tokenAddress.toString())
    })

    it('builds a SVM Transfer from string decimals', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, 9, 'SOL')

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransferFromStringDecimal(token, '3000', recipientAddress)
      builder.addMaxFee(TokenAmount.fromI32(token, 9))

      const transfer = builder.build()
      expect(transfer.transfers[0].amount).toBe('3000000000000')
      expect(transfer.transfers[0].recipient).toBe(recipientAddress.toString())
      expect(transfer.transfers[0].token).toBe(token.address.toString())
    })

    it('adds multiple SVM TransferData via addTransfers', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, 9, 'SOL')
      const amount = TokenAmount.fromI32(token, 5000)
      const transfer1 = TransferData.fromTokenAmount(amount, recipientAddress)
      const transfer2 = TransferData.fromStringDecimal(token, '1000', recipientAddress)

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfers([transfer1, transfer2])
      builder.addMaxFee(TokenAmount.fromI32(token, 9))

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[0].amount).toBe('5000000000000')
      expect(transfer.transfers[1].amount).toBe('1000000000000')
    })

    it('adds multiple SPLToken amounts via addTransfersFromTokenAmounts', () => {
      const tokenAddress = randomSvmAddress()
      const recipientAddress = randomSvmAddress()
      const token = SPLToken.fromAddress(tokenAddress, 9, 'SOL')
      const tokenAmounts = [TokenAmount.fromStringDecimal(token, '100'), TokenAmount.fromStringDecimal(token, '200')]

      const builder = TransferBuilder.forChain(chainId)
      builder.addTransfersFromTokenAmounts(tokenAmounts, recipientAddress)
      builder.addMaxFee(TokenAmount.fromI32(token, 9))

      const transfer = builder.build()
      expect(transfer.transfers.length).toBe(2)
      expect(transfer.transfers[1].amount).toBe('200000000000')
    })

    it('creates a complete Solana Transfer with all builder methods', () => {
      const user = randomSvmAddress()
      const settler = randomSvmAddress()
      const token = SPLToken.native()
      const recipient = randomSvmAddress()
      const deadline = BigInt.fromI32(9999999)
      const nonce = '0x123456'

      const builder = TransferBuilder.forChain(chainId)
      builder.addSettler(settler)
      builder.addUser(user)
      builder.addDeadline(deadline)
      builder.addNonce(nonce)
      builder.addTransferFromI32(token, 1000, recipient)
      builder.addMaxFee(TokenAmount.fromI32(token, 10))

      const transfer = builder.build()
      expect(transfer.op).toBe(OperationType.Transfer)
      expect(transfer.chainId).toBe(chainId)
      expect(transfer.isSVM()).toBe(true)
      expect(transfer.user).toBe(user.toString())
      expect(transfer.settler).toBe(settler.toString())
      expect(transfer.deadline).toBe(deadline.toString())
      expect(transfer.nonce).toBe(nonce)
      expect(transfer.transfers.length).toBe(1)
      expect(transfer.maxFees.length).toBe(1)
    })
  })

  describe('chainId validations', () => {
    it('throws if fee token chainId mismatches the Solana transfer chainId', () => {
      expect(() => {
        const fee = TokenAmount.fromI32(randomToken(ChainId.ETHEREUM), 2)
        TransferBuilder.forChain(chainId).addMaxFee(fee)
      }).toThrow('Fee token must be on the same chain')
    })

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

  describe('address encoding validations', () => {
    it('throws if trying to use EVM token with Solana TransferBuilder', () => {
      expect(() => {
        const recipientAddress = randomSvmAddress()
        const evmToken = ERC20Token.fromAddress(randomEvmAddress(), ChainId.ETHEREUM)
        const builder = TransferBuilder.forChain(chainId)

        builder.addTransferFromStringDecimal(evmToken, '100', recipientAddress)
      }).toThrow('All tokens must be on the same chain')
    })

    it('throws if trying to use SVM token with EVM TransferBuilder', () => {
      expect(() => {
        const svmToken = SPLToken.native()
        const recipientAddress = randomEvmAddress()
        const builder = TransferBuilder.forChain(ChainId.ETHEREUM)

        builder.addTransferFromStringDecimal(svmToken, '100', recipientAddress)
      }).toThrow('All tokens must be on the same chain')
    })

    it('validates SVM address encoding in TransferBuilder settler', () => {
      expect(() => {
        const builder = TransferBuilder.forChain(chainId)
        const evmSettler = randomEvmAddress()

        builder.addSettler(evmSettler).build()
      }).toThrow('Invalid settler address')
    })

    it('validates SVM address encoding in TransferBuilder user', () => {
      expect(() => {
        const builder = TransferBuilder.forChain(chainId)
        const evmUser = randomEvmAddress()
        const svmSettler = randomSvmAddress()
        const token = SPLToken.native()
        const recipient = randomSvmAddress()

        builder.addSettler(svmSettler)
        builder.addTransferFromI32(token, 100, recipient)
        builder.addMaxFee(TokenAmount.fromI32(token, 9))

        builder.addUser(evmUser).build()
      }).toThrow('Invalid user address')
    })
  })
})
