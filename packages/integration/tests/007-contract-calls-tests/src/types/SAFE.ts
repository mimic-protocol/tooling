import { Address, BigInt, Bytes, EvmCallParam, encodeCallData, environment } from '@mimicprotocol/lib-ts'

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
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xffa1ad74' )
    return result
  }

  approvedHashes(param0: Address, param1: Bytes): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x7d832974' + environment.evmEncode([EvmCallParam.fromValue('address', param0), EvmCallParam.fromValue('bytes32', param1)]))
    return BigInt.fromString(result)
  }

  checkNSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes, requiredSignatures: BigInt): void {
    environment.contractCall(this.address, this.chainId, this.timestamp, '0x12fb68e0' + environment.evmEncode([EvmCallParam.fromValue('bytes32', dataHash), EvmCallParam.fromValue('bytes', data), EvmCallParam.fromValue('bytes', signatures), EvmCallParam.fromValue('uint256', requiredSignatures.toBytes())]))
  }

  checkSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes): void {
    environment.contractCall(this.address, this.chainId, this.timestamp, '0x934f3a11' + environment.evmEncode([EvmCallParam.fromValue('bytes32', dataHash), EvmCallParam.fromValue('bytes', data), EvmCallParam.fromValue('bytes', signatures)]))
  }

  domainSeparator(): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xf698da25' )
    return Bytes.fromHexString(result)
  }

  encodeTransactionData(to: Address, value: BigInt, data: Bytes, operation: u8, safeTxGas: BigInt, baseGas: BigInt, gasPrice: BigInt, gasToken: Address, refundReceiver: Address, _nonce: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xe86637db' + environment.evmEncode([EvmCallParam.fromValue('address', to), EvmCallParam.fromValue('uint256', value.toBytes()), EvmCallParam.fromValue('bytes', data), EvmCallParam.fromValue('uint8', Bytes.fromU8(operation)), EvmCallParam.fromValue('uint256', safeTxGas.toBytes()), EvmCallParam.fromValue('uint256', baseGas.toBytes()), EvmCallParam.fromValue('uint256', gasPrice.toBytes()), EvmCallParam.fromValue('address', gasToken), EvmCallParam.fromValue('address', refundReceiver), EvmCallParam.fromValue('uint256', _nonce.toBytes())]))
    return Bytes.fromHexString(result)
  }

  getChainId(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x3408e470' )
    return BigInt.fromString(result)
  }

  getModulesPaginated(start: Address, pageSize: BigInt): unknown[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xcc2f8452' + environment.evmEncode([EvmCallParam.fromValue('address', start), EvmCallParam.fromValue('uint256', pageSize.toBytes())]))
    return result === '' ? [] : result.split(',').map(value => value)
  }

  getOwners(): Address[] {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xa0e67e2b' )
    return result === '' ? [] : result.split(',').map(value => Address.fromString(value))
  }

  getStorageAt(offset: BigInt, length: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x5624b25b' + environment.evmEncode([EvmCallParam.fromValue('uint256', offset.toBytes()), EvmCallParam.fromValue('uint256', length.toBytes())]))
    return Bytes.fromHexString(result)
  }

  getThreshold(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xe75235b8' )
    return BigInt.fromString(result)
  }

  getTransactionHash(to: Address, value: BigInt, data: Bytes, operation: u8, safeTxGas: BigInt, baseGas: BigInt, gasPrice: BigInt, gasToken: Address, refundReceiver: Address, _nonce: BigInt): Bytes {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xd8d11f78' + environment.evmEncode([EvmCallParam.fromValue('address', to), EvmCallParam.fromValue('uint256', value.toBytes()), EvmCallParam.fromValue('bytes', data), EvmCallParam.fromValue('uint8', Bytes.fromU8(operation)), EvmCallParam.fromValue('uint256', safeTxGas.toBytes()), EvmCallParam.fromValue('uint256', baseGas.toBytes()), EvmCallParam.fromValue('uint256', gasPrice.toBytes()), EvmCallParam.fromValue('address', gasToken), EvmCallParam.fromValue('address', refundReceiver), EvmCallParam.fromValue('uint256', _nonce.toBytes())]))
    return Bytes.fromHexString(result)
  }

  isModuleEnabled(module: Address): bool {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x2d9ad53d' + environment.evmEncode([EvmCallParam.fromValue('address', module)]))
    return bool.parse(result)
  }

  isOwner(owner: Address): bool {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x2f54bf6e' + environment.evmEncode([EvmCallParam.fromValue('address', owner)]))
    return bool.parse(result)
  }

  nonce(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0xaffed0e0' )
    return BigInt.fromString(result)
  }

  signedMessages(param0: Bytes): BigInt {
    const result = environment.contractCall(this.address, this.chainId, this.timestamp, '0x5ae6bd37' + environment.evmEncode([EvmCallParam.fromValue('bytes32', param0)]))
    return BigInt.fromString(result)
  }

}