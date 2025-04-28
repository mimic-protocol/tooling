import { Address, BigInt, Bytes, CallParam, encodeCallData, environment } from '@mimicprotocol/lib-ts'

export class SAFE {
  private address: Address
  private chainId: u64
  private timestamp: Date | null

  constructor(address: Address, chainId: u64, timestamp: Date | null = null) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
  }

  VERSION(): string {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xffa1ad74', [])
    )
    return result
  }

  approvedHashes(param0: Address, param1: Bytes): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x7d832974', [new CallParam('address', param0), new CallParam('bytes32', param1)])
    )
    return BigInt.fromString(result)
  }

  checkNSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes, requiredSignatures: BigInt): void {
    environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x12fb68e0', [
        new CallParam('bytes32', dataHash),
        new CallParam('bytes', data),
        new CallParam('bytes', signatures),
        new CallParam('uint256', requiredSignatures.toBytesBigEndian()),
      ])
    )
  }

  checkSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes): void {
    environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x934f3a11', [
        new CallParam('bytes32', dataHash),
        new CallParam('bytes', data),
        new CallParam('bytes', signatures),
      ])
    )
  }

  domainSeparator(): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xf698da25', [])
    )
    return changetype<Bytes>(Bytes.fromHexString(result).reverse())
  }

  encodeTransactionData(
    to: Address,
    value: BigInt,
    data: Bytes,
    operation: u8,
    safeTxGas: BigInt,
    baseGas: BigInt,
    gasPrice: BigInt,
    gasToken: Address,
    refundReceiver: Address,
    _nonce: BigInt
  ): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xe86637db', [
        new CallParam('address', to),
        new CallParam('uint256', value.toBytesBigEndian()),
        new CallParam('bytes', data),
        new CallParam('uint8', Bytes.fromU8(operation)),
        new CallParam('uint256', safeTxGas.toBytesBigEndian()),
        new CallParam('uint256', baseGas.toBytesBigEndian()),
        new CallParam('uint256', gasPrice.toBytesBigEndian()),
        new CallParam('address', gasToken),
        new CallParam('address', refundReceiver),
        new CallParam('uint256', _nonce.toBytesBigEndian()),
      ])
    )
    return changetype<Bytes>(Bytes.fromHexString(result).reverse())
  }

  getChainId(): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x3408e470', [])
    )
    return BigInt.fromString(result)
  }

  getModulesPaginated(start: Address, pageSize: BigInt): unknown[] {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xcc2f8452', [
        new CallParam('address', start),
        new CallParam('uint256', pageSize.toBytesBigEndian()),
      ])
    )
    return result === '' ? [] : result.split(',').map((value) => value)
  }

  getOwners(): Address[] {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xa0e67e2b', [])
    )
    return result === '' ? [] : result.split(',').map((value) => Address.fromString(value))
  }

  getStorageAt(offset: BigInt, length: BigInt): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x5624b25b', [
        new CallParam('uint256', offset.toBytesBigEndian()),
        new CallParam('uint256', length.toBytesBigEndian()),
      ])
    )
    return changetype<Bytes>(Bytes.fromHexString(result).reverse())
  }

  getThreshold(): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xe75235b8', [])
    )
    return BigInt.fromString(result)
  }

  getTransactionHash(
    to: Address,
    value: BigInt,
    data: Bytes,
    operation: u8,
    safeTxGas: BigInt,
    baseGas: BigInt,
    gasPrice: BigInt,
    gasToken: Address,
    refundReceiver: Address,
    _nonce: BigInt
  ): Bytes {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xd8d11f78', [
        new CallParam('address', to),
        new CallParam('uint256', value.toBytesBigEndian()),
        new CallParam('bytes', data),
        new CallParam('uint8', Bytes.fromU8(operation)),
        new CallParam('uint256', safeTxGas.toBytesBigEndian()),
        new CallParam('uint256', baseGas.toBytesBigEndian()),
        new CallParam('uint256', gasPrice.toBytesBigEndian()),
        new CallParam('address', gasToken),
        new CallParam('address', refundReceiver),
        new CallParam('uint256', _nonce.toBytesBigEndian()),
      ])
    )
    return changetype<Bytes>(Bytes.fromHexString(result).reverse())
  }

  isModuleEnabled(module: Address): bool {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x2d9ad53d', [new CallParam('address', module)])
    )
    return bool.parse(result)
  }

  isOwner(owner: Address): bool {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x2f54bf6e', [new CallParam('address', owner)])
    )
    return bool.parse(result)
  }

  nonce(): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0xaffed0e0', [])
    )
    return BigInt.fromString(result)
  }

  signedMessages(param0: Bytes): BigInt {
    const result = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      encodeCallData('0x5ae6bd37', [new CallParam('bytes32', param0)])
    )
    return BigInt.fromString(result)
  }
}
