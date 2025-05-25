import {
  Address,
  BigInt,
  Bytes,
  environment,
  evm,
  EvmDecodeParam,
  EvmEncodeParam,
  parseCSVNotNullable,
} from '@mimicprotocol/lib-ts'

export class Test {
  private address: Address
  private chainId: u64
  private timestamp: Date | null

  constructor(address: Address, chainId: u64, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
  }

  concatStrings(a: string, b: string): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x12600aa3' +
        evm.encode([
          EvmEncodeParam.fromValue('string', Bytes.fromUTF8(a)),
          EvmEncodeParam.fromValue('string', Bytes.fromUTF8(b)),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  createStruct(id: BigInt, name: string, value: BigInt): MyStruct {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xb0d6df12' +
        evm.encode([
          EvmEncodeParam.fromValue('uint256', id),
          EvmEncodeParam.fromValue('string', Bytes.fromUTF8(name)),
          EvmEncodeParam.fromValue('int256', value),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('(uint256,string,int256)', response))
    return MyStruct.parse(decodedResponse)
  }

  echoNestedStruct(ns: NestedStruct): NestedStruct {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x544170e2' + evm.encode([EvmEncodeParam.fromValues('()', ns.toEvmEncodeParams())])
    )
    const decodedResponse = evm.decode(
      new EvmDecodeParam('((uint256,string,int256),(uint256,string,int256)[])', response)
    )
    return NestedStruct.parse(decodedResponse)
  }

  echoStruct(s: MyStruct): MyStruct {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5b6a43af' + evm.encode([EvmEncodeParam.fromValues('()', s.toEvmEncodeParams())])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('(uint256,string,int256)', response))
    return MyStruct.parse(decodedResponse)
  }

  echoStructs(structs: MyStruct[]): MyStruct[] {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5d1aea3b' +
        evm.encode([
          EvmEncodeParam.fromValues(
            '()[]',
            structs.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('()', s0.toEvmEncodeParams()))
          ),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('(uint256,string,int256)[]', response))
    return decodedResponse === ''
      ? []
      : parseCSVNotNullable(decodedResponse).map<MyStruct>((item0: string) => MyStruct.parse(item0))
  }

  echoUint(value: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x3b021af1' + evm.encode([EvmEncodeParam.fromValue('uint256', value)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  getBool(): bool {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x12a7b914')
    const decodedResponse = evm.decode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  getBytes(): Bytes {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x0bcd3b33')
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getBytes32(): Bytes {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x1f903037')
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getCallerAddress(): Address {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x46b3353b')
    const decodedResponse = evm.decode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  getElement(arr: Bytes[], index: BigInt): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x6e8184d0' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'bytes32[3]',
            arr.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('bytes32', s0))
          ),
          EvmEncodeParam.fromValue('uint256', index),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getEnum(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xf0ebce5a')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint8', response))
    return u8.parse(decodedResponse)
  }

  getFixedUintArray(): BigInt[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x09cf75a7')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256[3]', response))
    return decodedResponse === ''
      ? []
      : parseCSVNotNullable(decodedResponse).map<BigInt>((item0: string) => BigInt.fromString(item0))
  }

  getInt(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x62738998')
    const decodedResponse = evm.decode(new EvmDecodeParam('int256', response))
    return BigInt.fromString(decodedResponse)
  }

  getIntArray(input: BigInt): BigInt[] {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xa49c97b4' + evm.encode([EvmEncodeParam.fromValue('int256', input)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('int256[]', response))
    return decodedResponse === ''
      ? []
      : parseCSVNotNullable(decodedResponse).map<BigInt>((item0: string) => BigInt.fromString(item0))
  }

  getMultipleValues(): GetMultipleValuesOutputs {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x650543a3')
    const decodedResponse = evm.decode(new EvmDecodeParam('(uint256,bool,string)', response))
    return GetMultipleValuesOutputs.parse(decodedResponse)
  }

  getStatusName(status: u8): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xed496529' + evm.encode([EvmEncodeParam.fromValue('uint8', BigInt.fromU8(status))])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  getString(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x89ea642f')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  getStringArray(): string[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x103b1828')
    const decodedResponse = evm.decode(new EvmDecodeParam('string[]', response))
    return decodedResponse === '' ? [] : parseCSVNotNullable(decodedResponse).map<string>((item0: string) => item0)
  }

  getUint(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x000267a4')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  getUintArray(): BigInt[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x4fe1e215')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256[]', response))
    return decodedResponse === ''
      ? []
      : parseCSVNotNullable(decodedResponse).map<BigInt>((item0: string) => BigInt.fromString(item0))
  }

  processTransactionData(user: Address, amount: BigInt, note: string, data: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xbc6270a0' +
        evm.encode([
          EvmEncodeParam.fromValue('address', user),
          EvmEncodeParam.fromValue('uint256', amount),
          EvmEncodeParam.fromValue('string', Bytes.fromUTF8(note)),
          EvmEncodeParam.fromValue('bytes', data),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  readAddress(_addr: Address): Address {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xcade77fa' + evm.encode([EvmEncodeParam.fromValue('address', _addr)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  readBytes16(_input: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x544d0ec9' + evm.encode([EvmEncodeParam.fromValue('bytes16', _input)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes16', response))
    return Bytes.fromHexString(decodedResponse)
  }

  readBytes8(_input: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x6a9a1222' + evm.encode([EvmEncodeParam.fromValue('bytes8', _input)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes8', response))
    return Bytes.fromHexString(decodedResponse)
  }

  readDynamicAddressArray(_addrs: Address[]): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x890e4c02' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'address[]',
            _addrs.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('address', s0))
          ),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  readDynamicStringArray(_strings: string[]): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x19c6982e' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'string[]',
            _strings.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('string', Bytes.fromUTF8(s0)))
          ),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  readFixedAddressArray(_addrs: Address[]): Address {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xceca6c77' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'address[3]',
            _addrs.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('address', s0))
          ),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  readFixedStringArray(_strings: string[]): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0ec91470' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'string[2]',
            _strings.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('string', Bytes.fromUTF8(s0)))
          ),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  reverseBytes(input: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2f278ecb' + evm.encode([EvmEncodeParam.fromValue('bytes', input)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  sumArray(values: BigInt[]): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x1e2aea06' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'uint256[]',
            values.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('uint256', s0))
          ),
        ])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }
}

export class MyStruct {
  readonly id: BigInt
  readonly name: string
  readonly value: BigInt

  constructor(id: BigInt, name: string, value: BigInt) {
    this.id = id
    this.name = name
    this.value = value
  }

  static parse(data: string): MyStruct {
    const parts = parseCSVNotNullable(data)
    if (parts.length !== 3) throw new Error('Invalid data for tuple parsing')
    const id: BigInt = BigInt.fromString(parts[0])
    const name: string = parts[1]
    const value: BigInt = BigInt.fromString(parts[2])
    return new MyStruct(id, name, value)
  }

  toEvmEncodeParams(): EvmEncodeParam[] {
    return [
      EvmEncodeParam.fromValue('uint256', this.id),
      EvmEncodeParam.fromValue('string', Bytes.fromUTF8(this.name)),
      EvmEncodeParam.fromValue('int256', this.value),
    ]
  }
}

export class NestedStruct {
  readonly single: MyStruct
  readonly list: MyStruct[]

  constructor(single: MyStruct, list: MyStruct[]) {
    this.single = single
    this.list = list
  }

  static parse(data: string): NestedStruct {
    const parts = parseCSVNotNullable(data)
    if (parts.length !== 2) throw new Error('Invalid data for tuple parsing')
    const single: MyStruct = MyStruct.parse(parts[0])
    const list: MyStruct[] =
      parts[1] === '' ? [] : parseCSVNotNullable(parts[1]).map<MyStruct>((item0: string) => MyStruct.parse(item0))
    return new NestedStruct(single, list)
  }

  toEvmEncodeParams(): EvmEncodeParam[] {
    return [
      EvmEncodeParam.fromValues('()', this.single.toEvmEncodeParams()),
      EvmEncodeParam.fromValues(
        '()[]',
        this.list.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValues('()', s0.toEvmEncodeParams()))
      ),
    ]
  }
}

export class GetMultipleValuesOutputs {
  readonly field0: BigInt
  readonly field1: bool
  readonly field2: string

  constructor(field0: BigInt, field1: bool, field2: string) {
    this.field0 = field0
    this.field1 = field1
    this.field2 = field2
  }

  static parse(data: string): GetMultipleValuesOutputs {
    const parts = parseCSVNotNullable(data)
    if (parts.length !== 3) throw new Error('Invalid data for tuple parsing')
    const field0: BigInt = BigInt.fromString(parts[0])
    const field1: bool = u8.parse(parts[1]) as bool
    const field2: string = parts[2]
    return new GetMultipleValuesOutputs(field0, field1, field2)
  }

  toEvmEncodeParams(): EvmEncodeParam[] {
    return [
      EvmEncodeParam.fromValue('uint256', this.field0),
      EvmEncodeParam.fromValue('bool', Bytes.fromBool(this.field1)),
      EvmEncodeParam.fromValue('string', Bytes.fromUTF8(this.field2)),
    ]
  }
}
