import { JSON } from 'json-as'

import {
  IntentEvent,
  OperationType,
  SvmCall,
  SvmCallBuilder,
  SvmInstruction,
  SvmInstructionBuilder,
} from '../../src/intents'
import { TokenAmount } from '../../src/tokens'
import { Address, BigInt, Bytes, ChainId } from '../../src/types'
import { SvmAccountMeta } from '../../src/types/svm/SvmAccountMeta'
import { randomBytes, randomSPLToken, randomSvmAddress, randomSvmSettler, setContext } from '../helpers'

describe('SvmCall', () => {
  describe('create', () => {
    it('creates a simple SvmCall with default values and stringifies it', () => {
      const user = randomSvmAddress()
      const programId = randomSvmAddress()
      const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
      const data = randomBytes(32)
      const fee = TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100)
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'config-123')

      const svmCall = SvmCall.create(programId, accountsMeta, data, fee)
      expect(svmCall.op).toBe(OperationType.SvmCall)
      expect(svmCall.user).toBe(user.toString())
      expect(svmCall.settler).toBe(settler.address.toString())
      expect(svmCall.chainId).toBe(ChainId.SOLANA_MAINNET)
      expect(svmCall.deadline).toBe('300')
      expect(svmCall.nonce).toBe('0x')

      expect(svmCall.instructions.length).toBe(1)
      expect(svmCall.instructions[0].programId).toBe(programId.toBase58String())
      expect(svmCall.instructions[0].accountsMeta).toStrictEqual(accountsMeta)
      expect(svmCall.instructions[0].data).toBe(data.toHexString())

      expect(svmCall.maxFees.length).toBe(1)
      expect(svmCall.maxFees[0].token).toBe(fee.token.address.toString())
      expect(svmCall.maxFees[0].amount).toBe(fee.amount.toString())

      expect(svmCall.events.length).toBe(0)

      expect(JSON.stringify(svmCall)).toBe(
        `{"op":3,"settler":"${settler.address}","user":"${user}","deadline":"300","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"events":[],"chainId":${ChainId.SOLANA_MAINNET},"instructions":[{"programId":"${programId.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta[0].pubkey}","isWritable":${accountsMeta[0].isWritable},"isSigner":${accountsMeta[0].isSigner}}],"data":"${data.toHexString()}"}]}`
      )
    })

    it('creates a simple SvmCall with valid parameters and stringifies it', () => {
      const user = randomSvmAddress()
      const programId = randomSvmAddress()
      const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
      const data = randomBytes(32)
      const fee = TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100)
      const settler = randomSvmSettler()
      const deadline = BigInt.fromI32(9999999)

      setContext(1, 1, user.toString(), [settler], 'config-123')

      const svmCall = SvmCall.create(
        programId,
        accountsMeta,
        data,
        fee,
        Address.fromString(settler.address),
        user,
        deadline,
        null,
        [new IntentEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data'))]
      )

      expect(svmCall.op).toBe(OperationType.SvmCall)
      expect(svmCall.user).toBe(user.toString())
      expect(svmCall.settler).toBe(settler.address.toString())
      expect(svmCall.chainId).toBe(ChainId.SOLANA_MAINNET)
      expect(svmCall.deadline).toBe(deadline.toString())
      expect(svmCall.nonce).toBe('0x')

      expect(svmCall.instructions.length).toBe(1)
      expect(svmCall.instructions[0].programId).toBe(programId.toBase58String())
      expect(svmCall.instructions[0].accountsMeta).toStrictEqual(accountsMeta)
      expect(svmCall.instructions[0].data).toBe(data.toHexString())

      expect(svmCall.maxFees.length).toBe(1)
      expect(svmCall.maxFees[0].token).toBe(fee.token.address.toString())
      expect(svmCall.maxFees[0].amount).toBe(fee.amount.toString())

      expect(svmCall.events.length).toBe(1)
      expect(svmCall.events[0].topic).toBe('0x746f706963')
      expect(svmCall.events[0].data).toBe('0x64617461')

      expect(JSON.stringify(svmCall)).toBe(
        `{"op":3,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"events":[{"topic":"0x746f706963","data":"0x64617461"}],"chainId":${ChainId.SOLANA_MAINNET},"instructions":[{"programId":"${programId.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta[0].pubkey}","isWritable":${accountsMeta[0].isWritable},"isSigner":${accountsMeta[0].isSigner}}],"data":"${data.toHexString()}"}]}`
      )
    })
  })

  describe('constructor', () => {
    it('creates a complex SvmCall with multiple instructions and stringifies it', () => {
      const user = randomSvmAddress()
      const programId1 = randomSvmAddress()
      const programId2 = randomSvmAddress()
      const accountsMeta1 = [SvmAccountMeta.fromAddress(randomSvmAddress())]
      const accountsMeta2 = [SvmAccountMeta.fromAddress(randomSvmAddress())]
      const data1 = randomBytes(32)
      const data2 = randomBytes(32)
      const instruction1 = SvmInstruction.create(programId1, accountsMeta1, data1)
      const instruction2 = SvmInstruction.create(programId2, accountsMeta2, data2)
      const fee = TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100)
      const settler = randomSvmSettler()
      const deadline = BigInt.fromI32(9999999)

      setContext(1, 1, user.toString(), [settler], 'config-123')

      const svmCall = new SvmCall(
        [instruction1, instruction2],
        [fee],
        Address.fromString(settler.address),
        user,
        deadline,
        '0x'
      )

      expect(svmCall.op).toBe(OperationType.SvmCall)
      expect(svmCall.user).toBe(user.toString())
      expect(svmCall.settler).toBe(settler.address.toString())
      expect(svmCall.chainId).toBe(ChainId.SOLANA_MAINNET)
      expect(svmCall.deadline).toBe(deadline.toString())
      expect(svmCall.nonce).toBe('0x')

      expect(svmCall.instructions.length).toBe(2)
      expect(svmCall.instructions[0].programId).toBe(programId1.toBase58String())
      expect(svmCall.instructions[0].accountsMeta).toStrictEqual(accountsMeta1)
      expect(svmCall.instructions[0].data).toBe(data1.toHexString())

      expect(svmCall.instructions[1].programId).toBe(programId2.toBase58String())
      expect(svmCall.instructions[1].accountsMeta).toStrictEqual(accountsMeta2)
      expect(svmCall.instructions[1].data).toBe(data2.toHexString())

      expect(svmCall.maxFees.length).toBe(1)
      expect(svmCall.maxFees[0].token).toBe(fee.token.address.toString())
      expect(svmCall.maxFees[0].amount).toBe(fee.amount.toString())

      expect(svmCall.events.length).toBe(0)

      expect(JSON.stringify(svmCall)).toBe(
        `{"op":3,"settler":"${settler.address}","user":"${user}","deadline":"${deadline}","nonce":"0x","maxFees":[{"token":"${fee.token.address.toString()}","amount":"${fee.amount.toString()}"}],"events":[],"chainId":${ChainId.SOLANA_MAINNET},"instructions":[{"programId":"${programId1.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta1[0].pubkey}","isWritable":${accountsMeta1[0].isWritable},"isSigner":${accountsMeta1[0].isSigner}}],"data":"${data1.toHexString()}"},{"programId":"${programId2.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta2[0].pubkey}","isWritable":${accountsMeta2[0].isWritable},"isSigner":${accountsMeta2[0].isSigner}}],"data":"${data2.toHexString()}"}]}`
      )
    })
  })

  describe('validations', () => {
    it('throws an error when instructions list is empty', () => {
      expect(() => {
        const fee = TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100)
        new SvmCall([], [fee])
      }).toThrow('Call list cannot be empty')
    })

    it('throws an error when there is no max fee', () => {
      expect(() => {
        const programId = randomSvmAddress()
        const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
        const data = randomBytes(32)
        const instruction = SvmInstruction.create(programId, accountsMeta, data)
        new SvmCall([instruction], [])
      }).toThrow('At least a max fee must be specified')
    })
  })
})

describe('SvmCallBuilder', () => {
  it('adds multiple instructions and builds call', () => {
    const programId1 = randomSvmAddress()
    const programId2 = randomSvmAddress()
    const accountsMeta1 = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const accountsMeta2 = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const data1 = randomBytes(32)
    const data2 = randomBytes(32)
    const instruction1 = SvmInstruction.create(programId1, accountsMeta1, data1)
    const instruction2 = SvmInstruction.create(programId2, accountsMeta2, data2)

    const builder = SvmCallBuilder.forChain()
    builder.addInstruction(instruction1)
    builder.addInstruction(instruction2)
    builder.addMaxFee(TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100))

    const svmCall = builder.build()
    expect(svmCall.instructions.length).toBe(2)
    expect(svmCall.instructions[0].programId).toBe(programId1.toBase58String())
    expect(svmCall.instructions[1].programId).toBe(programId2.toBase58String())
  })

  it('adds single instruction and builds call', () => {
    const programId = randomSvmAddress()
    const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const data = randomBytes(32)
    const instruction = SvmInstruction.create(programId, accountsMeta, data)

    const builder = SvmCallBuilder.forChain()
    builder.addInstruction(instruction)
    builder.addMaxFee(TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100))

    const svmCall = builder.build()
    expect(svmCall.instructions.length).toBe(1)
    expect(svmCall.instructions[0].programId).toBe(programId.toBase58String())
    expect(svmCall.instructions[0].data).toBe(data.toHexString())
  })

  it('adds settler, user, deadline, nonce, and events', () => {
    const user = randomSvmAddress()
    const settler = randomSvmAddress()
    const deadline = BigInt.fromI32(9999999)
    const nonce = '0x123456'
    const programId = randomSvmAddress()
    const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const data = randomBytes(32)
    const instruction = SvmInstruction.create(programId, accountsMeta, data)

    const builder = SvmCallBuilder.forChain()
    builder.addSettler(settler)
    builder.addUser(user)
    builder.addDeadline(deadline)
    builder.addNonce(nonce)
    builder.addInstruction(instruction)
    builder.addMaxFee(TokenAmount.fromI32(randomSPLToken(ChainId.SOLANA_MAINNET), 100))
    builder.addEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data'))

    const svmCall = builder.build()
    expect(svmCall.user).toBe(user.toString())
    expect(svmCall.settler).toBe(settler.toString())
    expect(svmCall.deadline).toBe(deadline.toString())
    expect(svmCall.nonce).toBe(nonce)
    expect(svmCall.events.length).toBe(1)
    expect(svmCall.events[0].topic).toBe('0x746f706963')
    expect(svmCall.events[0].data).toBe('0x64617461')
  })

  it('throws if fee token chainId mismatches Solana chainId', () => {
    expect(() => {
      const fee = TokenAmount.fromI32(randomSPLToken(ChainId.ETHEREUM), 9)
      SvmCallBuilder.forChain().addMaxFee(fee)
    }).toThrow('Fee token must be on the same chain')
  })
})

describe('SvmInstructionBuilder', () => {
  it('builds instruction with program, accounts, and data', () => {
    const programId = randomSvmAddress()
    const accountsMeta = [
      SvmAccountMeta.fromAddress(randomSvmAddress()).signer(),
      SvmAccountMeta.fromAddress(randomSvmAddress()).writable(),
    ]
    const data = randomBytes(32)

    const builder = new SvmInstructionBuilder()
    builder.setProgram(programId)
    builder.setAccounts(accountsMeta)
    builder.setDataFromBytes(data)

    const instruction = builder.instruction()
    expect(instruction.programId).toBe(programId.toBase58String())
    expect(instruction.accountsMeta).toStrictEqual(accountsMeta)
    expect(instruction.data).toBe(data.toHexString())
  })

  it('builds instruction with hex data', () => {
    const programId = randomSvmAddress()
    const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const hexData = '0xdeadbeef'

    const builder = new SvmInstructionBuilder()
    builder.setProgram(programId)
    builder.setAccounts(accountsMeta)
    builder.setDataFromHex(hexData)

    const instruction = builder.instruction()
    expect(instruction.programId).toBe(programId.toBase58String())
    expect(instruction.accountsMeta).toStrictEqual(accountsMeta)
    expect(instruction.data).toBe(hexData)
  })

  it('creates instruction with default values', () => {
    const builder = new SvmInstructionBuilder()
    const instruction = builder.instruction()

    expect(instruction.programId).toBe(Address.zero(32).toBase58String())
    expect(instruction.accountsMeta.length).toBe(0)
    expect(instruction.data).toBe(Bytes.empty().toHexString())
  })
})
