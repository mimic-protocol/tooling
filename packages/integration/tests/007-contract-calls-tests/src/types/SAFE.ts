import { Address, BigInt, Bytes, environment } from '@mimicprotocol/lib-ts'

export class SAFE {
  private address: Address
  private chainId: u64
  private blockNumber: BigInt

  constructor(address: Address, chainId: u64) {
    this.address = address
    this.chainId = chainId
    this.blockNumber = environment.getCurrentBlockNumber(chainId)
  }

  VERSION(): string {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'VERSION', [])
    return result
  }

  approvedHashes(param0: Address, param1: Bytes): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'approvedHashes', [param0, param1])
    return BigInt.fromString(result)
  }

  checkNSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes, requiredSignatures: BigInt): void {
    environment.contractCall(this.address, this.chainId, this.blockNumber, 'checkNSignatures', [dataHash, data, signatures, requiredSignatures.toBytes()])
  }

  checkSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes): void {
    environment.contractCall(this.address, this.chainId, this.blockNumber, 'checkSignatures', [dataHash, data, signatures])
  }

  domainSeparator(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'domainSeparator', [])
    return Bytes.fromHexString(result)
  }

  encodeTransactionData(to: Address, value: BigInt, data: Bytes, operation: u8, safeTxGas: BigInt, baseGas: BigInt, gasPrice: BigInt, gasToken: Address, refundReceiver: Address, _nonce: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'encodeTransactionData', [to, value.toBytes(), data, Bytes.fromU8(operation), safeTxGas.toBytes(), baseGas.toBytes(), gasPrice.toBytes(), gasToken, refundReceiver, _nonce.toBytes()])
    return Bytes.fromHexString(result)
  }

  getChainId(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'getChainId', [])
    return BigInt.fromString(result)
  }

  getModulesPaginated(start: Address, pageSize: BigInt): unknown[] {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'getModulesPaginated', [start, pageSize.toBytes()])
    return result === '' ? [] : result.split(',').map(value => value)
  }

  getOwners(): Address[] {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'getOwners', [])
    return result === '' ? [] : result.split(',').map(value => Address.fromString(value))
  }

  getStorageAt(offset: BigInt, length: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'getStorageAt', [offset.toBytes(), length.toBytes()])
    return Bytes.fromHexString(result)
  }

  getThreshold(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'getThreshold', [])
    return BigInt.fromString(result)
  }

  getTransactionHash(to: Address, value: BigInt, data: Bytes, operation: u8, safeTxGas: BigInt, baseGas: BigInt, gasPrice: BigInt, gasToken: Address, refundReceiver: Address, _nonce: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'getTransactionHash', [to, value.toBytes(), data, Bytes.fromU8(operation), safeTxGas.toBytes(), baseGas.toBytes(), gasPrice.toBytes(), gasToken, refundReceiver, _nonce.toBytes()])
    return Bytes.fromHexString(result)
  }

  isModuleEnabled(module: Address): bool {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'isModuleEnabled', [module])
    return bool.parse(result)
  }

  isOwner(owner: Address): bool {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'isOwner', [owner])
    return bool.parse(result)
  }

  nonce(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'nonce', [])
    return BigInt.fromString(result)
  }

  signedMessages(param0: Bytes): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.blockNumber, 'signedMessages', [param0])
    return BigInt.fromString(result)
  }

}