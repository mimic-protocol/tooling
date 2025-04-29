import { Address, BigInt, Bytes, CallParam, environment, evmEncode, evmEncodeArray } from '@mimicprotocol/lib-ts'

export class TEST {
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
      evmEncode('0x12600aa3', [new CallParam('string', Bytes.fromUTF8(a)), new CallParam('string', Bytes.fromUTF8(b))])
    )
    return result
  }

  echoUint(value: BigInt): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0x3b021af1', [new CallParam('uint256', value.toBytesBigEndian())])
    )
    return BigInt.fromString(result)
  }

  getBool(): bool {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x12a7b914', []))
    return bool.parse(result)
  }

  getBytes(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x0bcd3b33', []))
    return Bytes.fromHexString(result).reverse()
  }

  getBytes32(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x1f903037', []))
    return Bytes.fromHexString(result).reverse()
  }

  getCallerAddress(): Address {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x46b3353b', []))
    return Address.fromString(result)
  }

  getElement(arr: Bytes[], index: BigInt): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0x6e8184d0', [
        new CallParam('bytes32[3]', evmEncodeArray<Bytes>('bytes32[3]', arr)),
        new CallParam('uint256', index.toBytesBigEndian()),
      ])
    )
    return Bytes.fromHexString(result).reverse()
  }

  getEnum(): u8 {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0xf0ebce5a', []))
    return u8.parse(result)
  }

  getFixedUintArray(): BigInt[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x09cf75a7', []))
    return result === '' ? [] : result.split(',').map((value) => BigInt.fromString(value))
  }

  getInt(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x62738998', []))
    return BigInt.fromString(result)
  }

  getMultipleValues(): unknown[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x650543a3', []))
    return result === '' ? [] : result.split(',').map((value) => value)
  }

  getStatusName(status: u8): string {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0xed496529', [new CallParam('uint8', Bytes.fromU8(status))])
    )
    return result
  }

  getString(): string {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x89ea642f', []))
    return result
  }

  getStringArray(): string[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x103b1828', []))
    return result === '' ? [] : result.split(',').map((value) => value)
  }

  getUint(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x000267a4', []))
    return BigInt.fromString(result)
  }

  getUintArray(): BigInt[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, evmEncode('0x4fe1e215', []))
    return result === '' ? [] : result.split(',').map((value) => BigInt.fromString(value))
  }

  processTransactionData(user: Address, amount: BigInt, note: string, data: Bytes): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0xbc6270a0', [
        new CallParam('address', user),
        new CallParam('uint256', amount.toBytesBigEndian()),
        new CallParam('string', Bytes.fromUTF8(note)),
        new CallParam('bytes', data),
      ])
    )
    return Bytes.fromHexString(result).reverse()
  }

  readAddress(_addr: Address): Address {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0xcade77fa', [new CallParam('address', _addr)])
    )
    return Address.fromString(result)
  }

  readDynamicAddressArray(_addrs: Address[]): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0x890e4c02', [new CallParam('address[]', evmEncodeArray<Address>('address[]', _addrs))])
    )
    return BigInt.fromString(result)
  }

  readFixedAddressArray(_addrs: Address[]): Address {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0xceca6c77', [new CallParam('address[3]', evmEncodeArray<Address>('address[3]', _addrs))])
    )
    return Address.fromString(result)
  }

  reverseBytes(input: Bytes): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0x2f278ecb', [new CallParam('bytes', input)])
    )
    return Bytes.fromHexString(result).reverse()
  }

  sumArray(values: BigInt[]): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      evmEncode('0x1e2aea06', [new CallParam('uint256[]', evmEncodeArray<BigInt>('uint256[]', values))])
    )
    return BigInt.fromString(result)
  }
}
