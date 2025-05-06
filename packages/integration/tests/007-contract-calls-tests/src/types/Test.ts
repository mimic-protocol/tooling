import { Address, BigInt, Bytes, environment, EvmCallParam } from '@mimicprotocol/lib-ts'

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
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x12600aa3' +
        environment.evmEncode([
          EvmCallParam.fromValue('string', Bytes.fromUTF8(a)),
          EvmCallParam.fromValue('string', Bytes.fromUTF8(b)),
        ])
    )
    return result
  }

  createStruct(id: BigInt, name: string, value: BigInt): MyStruct {
    const result = environment.contractCall(
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
    return MyStruct._parse(result)
  }

  echoStruct(s: MyStruct): MyStruct {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5b6a43af' + environment.evmEncode([EvmCallParam.fromValues('()', s.toEvmCallParams())])
    )
    return MyStruct._parse(result)
  }

  echoUint(value: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x3b021af1' + environment.evmEncode([EvmCallParam.fromValue('uint256', value)])
    )
    return BigInt.fromString(result)
  }

  getBool(): bool {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x12a7b914')
    return bool.parse(result)
  }

  getBytes(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x0bcd3b33')
    return Bytes.fromHexString(result)
  }

  getBytes32(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x1f903037')
    return Bytes.fromHexString(result)
  }

  getCallerAddress(): Address {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x46b3353b')
    return Address.fromString(result)
  }

  getElement(arr: Bytes[], index: BigInt): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x6e8184d0' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'bytes32[3]',
            arr.map((x: Bytes) => EvmCallParam.fromValue('bytes32', x))
          ),
          EvmCallParam.fromValue('uint256', index),
        ])
    )
    return Bytes.fromHexString(result)
  }

  getEnum(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xf0ebce5a')
    return u8.parse(result)
  }

  getFixedUintArray(): BigInt[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x09cf75a7')
    return result === '' ? [] : result.split(',').map<BigInt>((value) => BigInt.fromString(value))
  }

  getInt(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x62738998')
    return BigInt.fromString(result)
  }

  getIntArray(input: BigInt): BigInt[] {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xa49c97b4' + environment.evmEncode([EvmCallParam.fromValue('int256', input)])
    )
    return result === '' ? [] : result.split(',').map<BigInt>((value) => BigInt.fromString(value))
  }

  getMultipleValues(): unknown[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x650543a3')
    return result === '' ? [] : result.split(',').map<unknown>((value) => value)
  }

  getStatusName(status: u8): string {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xed496529' + environment.evmEncode([EvmCallParam.fromValue('uint8', BigInt.fromU8(status))])
    )
    return result
  }

  getString(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x89ea642f')
    return result
  }

  getStringArray(): string[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x103b1828')
    return result === '' ? [] : result.split(',').map<string>((value) => value)
  }

  getUint(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x000267a4')
    return BigInt.fromString(result)
  }

  getUintArray(): BigInt[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x4fe1e215')
    return result === '' ? [] : result.split(',').map<BigInt>((value) => BigInt.fromString(value))
  }

  processTransactionData(user: Address, amount: BigInt, note: string, data: Bytes): Bytes {
    const result = environment.contractCall(
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
    return Bytes.fromHexString(result)
  }

  readAddress(_addr: Address): Address {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xcade77fa' + environment.evmEncode([EvmCallParam.fromValue('address', _addr)])
    )
    return Address.fromString(result)
  }

  readBytes16(_input: Bytes): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x544d0ec9' + environment.evmEncode([EvmCallParam.fromValue('bytes16', _input)])
    )
    return Bytes.fromHexString(result)
  }

  readBytes8(_input: Bytes): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x6a9a1222' + environment.evmEncode([EvmCallParam.fromValue('bytes8', _input)])
    )
    return Bytes.fromHexString(result)
  }

  readDynamicAddressArray(_addrs: Address[]): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x890e4c02' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'address[]',
            _addrs.map((x: Address) => EvmCallParam.fromValue('address', x))
          ),
        ])
    )
    return BigInt.fromString(result)
  }

  readDynamicStringArray(_strings: string[]): string {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x19c6982e' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'string[]',
            _strings.map((x: string) => EvmCallParam.fromValue('string', Bytes.fromUTF8(x)))
          ),
        ])
    )
    return result
  }

  readFixedAddressArray(_addrs: Address[]): Address {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xceca6c77' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'address[3]',
            _addrs.map((x: Address) => EvmCallParam.fromValue('address', x))
          ),
        ])
    )
    return Address.fromString(result)
  }

  readFixedStringArray(_strings: string[]): string {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0ec91470' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'string[2]',
            _strings.map((x: string) => EvmCallParam.fromValue('string', Bytes.fromUTF8(x)))
          ),
        ])
    )
    return result
  }

  reverseBytes(input: Bytes): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2f278ecb' + environment.evmEncode([EvmCallParam.fromValue('bytes', input)])
    )
    return Bytes.fromHexString(result)
  }

  sumArray(values: BigInt[]): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x1e2aea06' +
        environment.evmEncode([
          EvmCallParam.fromValues(
            'uint256[]',
            values.map((x: BigInt) => EvmCallParam.fromValue('uint256', x))
          ),
        ])
    )
    return BigInt.fromString(result)
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
    const parts = data.split(',')
    if (parts.length !== 3) throw new Error('Invalid data for tuple parsing')
    const id_value: BigInt = BigInt.fromString(parts[0])
    const name_value: string = parts[1]
    const value_value: BigInt = BigInt.fromString(parts[2])
    return new MyStruct(id_value, name_value, value_value)
  }

  toEvmCallParams(): EvmCallParam[] {
    return [
      EvmCallParam.fromValue('uint256', this.id),
      EvmCallParam.fromValue('string', Bytes.fromUTF8(this.name)),
      EvmCallParam.fromValue('int256', this.value),
    ]
  }
}
