import { JSON } from 'json-as'

import {
  OperationEvent,
  OperationType,
  SvmCall,
  SvmCallBuilder,
  SvmInstruction,
  SvmInstructionBuilder,
} from '../../src/intents'
import { Address, Bytes, ChainId } from '../../src/types'
import { SvmAccountMeta } from '../../src/types/svm/SvmAccountMeta'
import { randomBytes, randomSvmAddress, randomSvmSettler, setContext } from '../helpers'

describe('SvmCall', () => {
  describe('create', () => {
    it('creates a simple SvmCall with default values and stringifies it', () => {
      const user = randomSvmAddress()
      const programId = randomSvmAddress()
      const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
      const data = randomBytes(32)
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-123')

      const svmCall = new SvmCall([new SvmInstruction(programId.toBase58String(), accountsMeta, data.toHexString())])
      expect(svmCall.opType).toBe(OperationType.SvmCall)
      expect(svmCall.user).toBe(user.toString())
      expect(svmCall.chainId).toBe(ChainId.SOLANA_MAINNET)

      expect(svmCall.instructions.length).toBe(1)
      expect(svmCall.instructions[0].programId).toBe(programId.toBase58String())
      expect(svmCall.instructions[0].accountsMeta).toStrictEqual(accountsMeta)
      expect(svmCall.instructions[0].data).toBe(data.toHexString())

      expect(svmCall.events.length).toBe(0)

      expect(JSON.stringify(svmCall)).toBe(
        `{"opType":3,"chainId":${ChainId.SOLANA_MAINNET},"user":"${user}","events":[],"instructions":[{"programId":"${programId.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta[0].pubkey}","isWritable":${accountsMeta[0].isWritable},"isSigner":${accountsMeta[0].isSigner}}],"data":"${data.toHexString()}"}]}`
      )
    })

    it('creates a simple SvmCall with valid parameters and stringifies it', () => {
      const user = randomSvmAddress()
      const programId = randomSvmAddress()
      const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
      const data = randomBytes(32)
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-123')

      const svmCall = new SvmCall(
        [new SvmInstruction(programId.toBase58String(), accountsMeta, data.toHexString())],
        user,
        [new OperationEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data'))]
      )

      expect(svmCall.opType).toBe(OperationType.SvmCall)
      expect(svmCall.user).toBe(user.toString())
      expect(svmCall.chainId).toBe(ChainId.SOLANA_MAINNET)

      expect(svmCall.instructions.length).toBe(1)
      expect(svmCall.instructions[0].programId).toBe(programId.toBase58String())
      expect(svmCall.instructions[0].accountsMeta).toStrictEqual(accountsMeta)
      expect(svmCall.instructions[0].data).toBe(data.toHexString())

      expect(svmCall.events.length).toBe(1)
      expect(svmCall.events[0].topic).toBe('0x746f706963')
      expect(svmCall.events[0].data).toBe('0x64617461')

      expect(JSON.stringify(svmCall)).toBe(
        `{"opType":3,"chainId":${ChainId.SOLANA_MAINNET},"user":"${user}","events":[{"topic":"0x746f706963","data":"0x64617461"}],"instructions":[{"programId":"${programId.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta[0].pubkey}","isWritable":${accountsMeta[0].isWritable},"isSigner":${accountsMeta[0].isSigner}}],"data":"${data.toHexString()}"}]}`
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
      const instruction1 = new SvmInstruction(programId1.toBase58String(), accountsMeta1, data1.toHexString())
      const instruction2 = new SvmInstruction(programId2.toBase58String(), accountsMeta2, data2.toHexString())
      const settler = randomSvmSettler()

      setContext(1, 1, user.toString(), [settler], 'trigger-123')

      const svmCall = new SvmCall([instruction1, instruction2], user)

      expect(svmCall.opType).toBe(OperationType.SvmCall)
      expect(svmCall.user).toBe(user.toString())
      expect(svmCall.chainId).toBe(ChainId.SOLANA_MAINNET)

      expect(svmCall.instructions.length).toBe(2)
      expect(svmCall.instructions[0].programId).toBe(programId1.toBase58String())
      expect(svmCall.instructions[0].accountsMeta).toStrictEqual(accountsMeta1)
      expect(svmCall.instructions[0].data).toBe(data1.toHexString())

      expect(svmCall.instructions[1].programId).toBe(programId2.toBase58String())
      expect(svmCall.instructions[1].accountsMeta).toStrictEqual(accountsMeta2)
      expect(svmCall.instructions[1].data).toBe(data2.toHexString())

      expect(svmCall.events.length).toBe(0)

      expect(JSON.stringify(svmCall)).toBe(
        `{"opType":3,"chainId":${ChainId.SOLANA_MAINNET},"user":"${user}","events":[],"instructions":[{"programId":"${programId1.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta1[0].pubkey}","isWritable":${accountsMeta1[0].isWritable},"isSigner":${accountsMeta1[0].isSigner}}],"data":"${data1.toHexString()}"},{"programId":"${programId2.toBase58String()}","accountsMeta":[{"pubkey":"${accountsMeta2[0].pubkey}","isWritable":${accountsMeta2[0].isWritable},"isSigner":${accountsMeta2[0].isSigner}}],"data":"${data2.toHexString()}"}]}`
      )
    })
  })

  describe('validations', () => {
    it('throws an error when instructions list is empty', () => {
      expect(() => {
        new SvmCall([])
      }).toThrow('Call list cannot be empty')
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
    const instruction1 = new SvmInstruction(programId1.toBase58String(), accountsMeta1, data1.toHexString())
    const instruction2 = new SvmInstruction(programId2.toBase58String(), accountsMeta2, data2.toHexString())

    const builder = SvmCallBuilder.forChain()
    builder.addInstruction(instruction1)
    builder.addInstruction(instruction2)

    const svmCall = builder.build()
    expect(svmCall.instructions.length).toBe(2)
    expect(svmCall.instructions[0].programId).toBe(programId1.toBase58String())
    expect(svmCall.instructions[1].programId).toBe(programId2.toBase58String())
  })

  it('adds single instruction and builds call', () => {
    const programId = randomSvmAddress()
    const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const data = randomBytes(32)
    const instruction = new SvmInstruction(programId.toBase58String(), accountsMeta, data.toHexString())

    const builder = SvmCallBuilder.forChain()
    builder.addInstruction(instruction)

    const svmCall = builder.build()
    expect(svmCall.instructions.length).toBe(1)
    expect(svmCall.instructions[0].programId).toBe(programId.toBase58String())
    expect(svmCall.instructions[0].data).toBe(data.toHexString())
  })

  it('adds user and events', () => {
    const user = randomSvmAddress()
    const settler = randomSvmSettler()
    const programId = randomSvmAddress()
    const accountsMeta = [SvmAccountMeta.fromAddress(randomSvmAddress())]
    const data = randomBytes(32)
    const instruction = new SvmInstruction(programId.toBase58String(), accountsMeta, data.toHexString())

    setContext(1, 1, randomSvmAddress().toString(), [settler], 'trigger-123')

    const builder = SvmCallBuilder.forChain()
    builder.addUser(user)
    builder.addInstruction(instruction)
    builder.addEvent(Bytes.fromUTF8('topic'), Bytes.fromUTF8('data'))

    const svmCall = builder.build()
    expect(svmCall.user).toBe(user.toString())
    expect(svmCall.events.length).toBe(1)
    expect(svmCall.events[0].topic).toBe('0x746f706963')
    expect(svmCall.events[0].data).toBe('0x64617461')
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

    const instruction = new SvmInstructionBuilder()
      .setProgram(programId)
      .setAccounts(accountsMeta)
      .setDataFromHex('0xabcd')
      .instruction()

    expect(instruction.data).toBe('0xabcd')
  })

  it('builds instruction with default empty data', () => {
    const programId = randomSvmAddress()

    const instruction = new SvmInstructionBuilder().setProgram(programId).instruction()
    expect(instruction.programId).toBe(programId.toBase58String())
    expect(instruction.accountsMeta.length).toBe(0)
    expect(instruction.data).toBe(Bytes.empty().toHexString())
  })

  it('uses provided address strings', () => {
    const programId = Address.fromString('So11111111111111111111111111111111111111112')
    const account = SvmAccountMeta.fromAddress(Address.fromString('So11111111111111111111111111111111111111113'))

    const instruction = new SvmInstructionBuilder().setProgram(programId).setAccounts([account]).instruction()

    expect(instruction.programId).toBe(programId.toBase58String())
    expect(instruction.accountsMeta[0].pubkey).toBe(account.pubkey)
  })
})
