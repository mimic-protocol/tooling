import { Address, BigInt, Bytes, environment, EvmCallParam, EvmDecodeParam } from '@mimicprotocol/lib-ts'

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
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xffa1ad74')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  approvedHashes(param0: Address, param1: Bytes): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x7d832974' +
        environment.evmEncode([EvmCallParam.fromValue('address', param0), EvmCallParam.fromValue('bytes32', param1)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  checkNSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes, requiredSignatures: BigInt): void {
    environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x12fb68e0' +
        environment.evmEncode([
          EvmCallParam.fromValue('bytes32', dataHash),
          EvmCallParam.fromValue('bytes', data),
          EvmCallParam.fromValue('bytes', signatures),
          EvmCallParam.fromValue('uint256', requiredSignatures),
        ])
    )
  }

  checkSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes): void {
    environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x934f3a11' +
        environment.evmEncode([
          EvmCallParam.fromValue('bytes32', dataHash),
          EvmCallParam.fromValue('bytes', data),
          EvmCallParam.fromValue('bytes', signatures),
        ])
    )
  }

  domainSeparator(): Bytes {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xf698da25')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
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
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xe86637db' +
        environment.evmEncode([
          EvmCallParam.fromValue('address', to),
          EvmCallParam.fromValue('uint256', value),
          EvmCallParam.fromValue('bytes', data),
          EvmCallParam.fromValue('uint8', BigInt.fromU8(operation)),
          EvmCallParam.fromValue('uint256', safeTxGas),
          EvmCallParam.fromValue('uint256', baseGas),
          EvmCallParam.fromValue('uint256', gasPrice),
          EvmCallParam.fromValue('address', gasToken),
          EvmCallParam.fromValue('address', refundReceiver),
          EvmCallParam.fromValue('uint256', _nonce),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getChainId(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x3408e470')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  getModulesPaginated(start: Address, pageSize: BigInt): unknown[] {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xcc2f8452' +
        environment.evmEncode([EvmCallParam.fromValue('address', start), EvmCallParam.fromValue('uint256', pageSize)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address[]', response))
    return decodedResponse === '' ? [] : decodedResponse.split(',').map<unknown>((value) => value)
  }

  getOwners(): Address[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xa0e67e2b')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address[]', response))
    return decodedResponse === '' ? [] : decodedResponse.split(',').map<Address>((value) => Address.fromString(value))
  }

  getStorageAt(offset: BigInt, length: BigInt): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5624b25b' +
        environment.evmEncode([EvmCallParam.fromValue('uint256', offset), EvmCallParam.fromValue('uint256', length)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getThreshold(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xe75235b8')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
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
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xd8d11f78' +
        environment.evmEncode([
          EvmCallParam.fromValue('address', to),
          EvmCallParam.fromValue('uint256', value),
          EvmCallParam.fromValue('bytes', data),
          EvmCallParam.fromValue('uint8', BigInt.fromU8(operation)),
          EvmCallParam.fromValue('uint256', safeTxGas),
          EvmCallParam.fromValue('uint256', baseGas),
          EvmCallParam.fromValue('uint256', gasPrice),
          EvmCallParam.fromValue('address', gasToken),
          EvmCallParam.fromValue('address', refundReceiver),
          EvmCallParam.fromValue('uint256', _nonce),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  isModuleEnabled(module: Address): bool {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2d9ad53d' + environment.evmEncode([EvmCallParam.fromValue('address', module)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  isOwner(owner: Address): bool {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2f54bf6e' + environment.evmEncode([EvmCallParam.fromValue('address', owner)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  nonce(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xaffed0e0')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  signedMessages(param0: Bytes): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5ae6bd37' + environment.evmEncode([EvmCallParam.fromValue('bytes32', param0)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }
}
