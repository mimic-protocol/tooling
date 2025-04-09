import { Address, BigInt, Bytes, environment } from '@mimicprotocol/lib-ts'

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
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'VERSION', [])
    return result
  }

  approvedHashes(param0: Address, param1: Bytes): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'approvedHashes', [
      param0,
      param1,
    ])
    return BigInt.fromString(result)
  }

  checkNSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes, requiredSignatures: BigInt): void {
    environment.contractCall(this.address, this.chainId, this.timestamp, 'checkNSignatures', [
      dataHash,
      data,
      signatures,
      requiredSignatures.toBytes(),
    ])
  }

  checkSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes): void {
    environment.contractCall(this.address, this.chainId, this.timestamp, 'checkSignatures', [
      dataHash,
      data,
      signatures,
    ])
  }

  domainSeparator(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'domainSeparator', [])
    return Bytes.fromHexString(result)
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
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'encodeTransactionData', [
      to,
      value.toBytes(),
      data,
      Bytes.fromU8(operation),
      safeTxGas.toBytes(),
      baseGas.toBytes(),
      gasPrice.toBytes(),
      gasToken,
      refundReceiver,
      _nonce.toBytes(),
    ])
    return Bytes.fromHexString(result)
  }

  getChainId(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'getChainId', [])
    return BigInt.fromString(result)
  }

  getModulesPaginated(start: Address, pageSize: BigInt): unknown[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'getModulesPaginated', [
      start,
      pageSize.toBytes(),
    ])
    return result === '' ? [] : result.split(',').map((value) => value)
  }

  getOwners(): Address[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'getOwners', [])
    return result === '' ? [] : result.split(',').map((value) => Address.fromString(value))
  }

  getStorageAt(offset: BigInt, length: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'getStorageAt', [
      offset.toBytes(),
      length.toBytes(),
    ])
    return Bytes.fromHexString(result)
  }

  getThreshold(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'getThreshold', [])
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
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'getTransactionHash', [
      to,
      value.toBytes(),
      data,
      Bytes.fromU8(operation),
      safeTxGas.toBytes(),
      baseGas.toBytes(),
      gasPrice.toBytes(),
      gasToken,
      refundReceiver,
      _nonce.toBytes(),
    ])
    return Bytes.fromHexString(result)
  }

  isModuleEnabled(module: Address): bool {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'isModuleEnabled', [module])
    return bool.parse(result)
  }

  isOwner(owner: Address): bool {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'isOwner', [owner])
    return bool.parse(result)
  }

  nonce(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'nonce', [])
    return BigInt.fromString(result)
  }

  signedMessages(param0: Bytes): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, 'signedMessages', [param0])
    return BigInt.fromString(result)
  }
}
