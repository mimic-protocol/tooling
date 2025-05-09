import { Address, BigInt, Bytes, environment, EvmCallParam, EvmDecodeParam, parseCSV } from '@mimicprotocol/lib-ts'

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
        environment.evmEncode([
          EvmCallParam.fromValue('string', Bytes.fromUTF8(a)),
          EvmCallParam.fromValue('string', Bytes.fromUTF8(b)),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  createStruct(id: BigInt, name: string, value: BigInt): MyStruct {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xb0d6df12' +
        environment.evmEncode([
          EvmCallParam.fromValue('uint256', id),
          EvmCallParam.fromValue('string', Bytes.fromUTF8(name)),
          EvmCallParam.fromValue('int256', value),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('(uint256,string,int256)', response))
    return MyStruct._parse(decodedResponse)
  }

  echoNestedStruct(ns: NestedStruct): NestedStruct {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x544170e2' + environment.evmEncode([EvmCallParam.fromValues('()', ns.toEvmCallParams())])
    )
    const decodedResponse = environment.evmDecode(
      new EvmDecodeParam('((uint256,string,int256),(uint256,string,int256)[])', response)
    )
    return NestedStruct._parse(decodedResponse)
  }

  echoStruct(s: MyStruct): MyStruct {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5b6a43af' + environment.evmEncode([EvmCallParam.fromValues('()', s.toEvmCallParams())])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('(uint256,string,int256)', response))
    return MyStruct._parse(decodedResponse)
  }

  echoStructs(structs: MyStruct[]): MyStruct[] {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5d1aea3b' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            '()[]',
            structs.map<EvmCallParam>((item) => EvmCallParam.fromValues('()', item.toEvmCallParams()))
          ),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('(uint256,string,int256)[]', response))
    return decodedResponse === ''
      ? []
      : changetype<string[]>(parseCSV(decodedResponse)).map<MyStruct>((item) => MyStruct._parse(item))
  }

  echoUint(value: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x3b021af1' + environment.evmEncode([EvmCallParam.fromValue('uint256', value)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  getBool(): bool {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x12a7b914')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  getBytes(): Bytes {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x0bcd3b33')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getBytes32(): Bytes {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x1f903037')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getCallerAddress(): Address {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x46b3353b')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  getElement(arr: Bytes[], index: BigInt): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x6e8184d0' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'bytes32[3]',
            arr.map<EvmCallParam>((item) => EvmCallParam.fromValue('bytes32', item))
          ),
          EvmCallParam.fromValue('uint256', index),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getEnum(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xf0ebce5a')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint8', response))
    return u8.parse(decodedResponse)
  }

  getFixedUintArray(): BigInt[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x09cf75a7')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256[3]', response))
    return decodedResponse === ''
      ? []
      : changetype<string[]>(parseCSV(decodedResponse)).map<BigInt>((value) => BigInt.fromString(value))
  }

  getInt(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x62738998')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('int256', response))
    return BigInt.fromString(decodedResponse)
  }

  getIntArray(input: BigInt): BigInt[] {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xa49c97b4' + environment.evmEncode([EvmCallParam.fromValue('int256', input)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('int256[]', response))
    return decodedResponse === ''
      ? []
      : changetype<string[]>(parseCSV(decodedResponse)).map<BigInt>((value) => BigInt.fromString(value))
  }

  getMultipleValues(): GetMultipleValuesOutputs {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x650543a3')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('(uint256,bool,string)', response))
    return GetMultipleValuesOutputs._parse(decodedResponse)
  }

  getStatusName(status: u8): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xed496529' + environment.evmEncode([EvmCallParam.fromValue('uint8', BigInt.fromU8(status))])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  getString(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x89ea642f')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  getStringArray(): string[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x103b1828')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string[]', response))
    return decodedResponse === '' ? [] : changetype<string[]>(parseCSV(decodedResponse)).map<string>((value) => value)
  }

  getUint(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x000267a4')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  getUintArray(): BigInt[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x4fe1e215')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256[]', response))
    return decodedResponse === ''
      ? []
      : changetype<string[]>(parseCSV(decodedResponse)).map<BigInt>((value) => BigInt.fromString(value))
  }

  processTransactionData(user: Address, amount: BigInt, note: string, data: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xbc6270a0' +
        environment.evmEncode([
          EvmCallParam.fromValue('address', user),
          EvmCallParam.fromValue('uint256', amount),
          EvmCallParam.fromValue('string', Bytes.fromUTF8(note)),
          EvmCallParam.fromValue('bytes', data),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  readAddress(_addr: Address): Address {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xcade77fa' + environment.evmEncode([EvmCallParam.fromValue('address', _addr)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  readBytes16(_input: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x544d0ec9' + environment.evmEncode([EvmCallParam.fromValue('bytes16', _input)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes16', response))
    return Bytes.fromHexString(decodedResponse)
  }

  readBytes8(_input: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x6a9a1222' + environment.evmEncode([EvmCallParam.fromValue('bytes8', _input)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes8', response))
    return Bytes.fromHexString(decodedResponse)
  }

  readDynamicAddressArray(_addrs: Address[]): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x890e4c02' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'address[]',
            _addrs.map<EvmCallParam>((item) => EvmCallParam.fromValue('address', item))
          ),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  readDynamicStringArray(_strings: string[]): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x19c6982e' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'string[]',
            _strings.map<EvmCallParam>((item) => EvmCallParam.fromValue('string', Bytes.fromUTF8(item)))
          ),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  readFixedAddressArray(_addrs: Address[]): Address {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xceca6c77' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'address[3]',
            _addrs.map<EvmCallParam>((item) => EvmCallParam.fromValue('address', item))
          ),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  readFixedStringArray(_strings: string[]): string {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0ec91470' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'string[2]',
            _strings.map<EvmCallParam>((item) => EvmCallParam.fromValue('string', Bytes.fromUTF8(item)))
          ),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  reverseBytes(input: Bytes): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2f278ecb' + environment.evmEncode([EvmCallParam.fromValue('bytes', input)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  sumArray(values: BigInt[]): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x1e2aea06' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'uint256[]',
            values.map<EvmCallParam>((item) => EvmCallParam.fromValue('uint256', item))
          ),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
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

  static _parse(data: string): MyStruct {
    const parts = changetype<string[]>(parseCSV(data))
    if (parts.length !== 3) throw new Error('Invalid data for tuple parsing')
    const id: BigInt = BigInt.fromString(parts[0])
    const name: string = parts[1]
    const value: BigInt = BigInt.fromString(parts[2])
    return new MyStruct(id, name, value)
  }

  toEvmCallParams(): EvmCallParam[] {
    return [
      EvmCallParam.fromValue('uint256', this.id),
      EvmCallParam.fromValue('string', Bytes.fromUTF8(this.name)),
      EvmCallParam.fromValue('int256', this.value),
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

  static _parse(data: string): NestedStruct {
    const parts = changetype<string[]>(parseCSV(data))
    if (parts.length !== 2) throw new Error('Invalid data for tuple parsing')
    const single: MyStruct = MyStruct._parse(parts[0])
    const list: MyStruct[] =
      parts[1] === '' ? [] : changetype<string[]>(parseCSV(parts[1])).map<MyStruct>((item) => MyStruct._parse(item))
    return new NestedStruct(single, list)
  }

  toEvmCallParams(): EvmCallParam[] {
    return [
      EvmCallParam.fromValues('()', this.single.toEvmCallParams()),
      EvmCallParam.fromValues(
        '()[]',
        this.list.map<EvmCallParam>((s) => EvmCallParam.fromValues('()', s.toEvmCallParams()))
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

  static _parse(data: string): GetMultipleValuesOutputs {
    const parts = changetype<string[]>(parseCSV(data))
    if (parts.length !== 3) throw new Error('Invalid data for tuple parsing')
    const field0: BigInt = BigInt.fromString(parts[0])
    const field1: bool = u8.parse(parts[1]) as bool
    const field2: string = parts[2]
    return new GetMultipleValuesOutputs(field0, field1, field2)
  }

  toEvmCallParams(): EvmCallParam[] {
    return [
      EvmCallParam.fromValue('uint256', this.field0),
      EvmCallParam.fromValue('bool', Bytes.fromBool(this.field1)),
      EvmCallParam.fromValue('string', Bytes.fromUTF8(this.field2)),
    ]
  }
}
