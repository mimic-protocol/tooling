import {
  Address,
  BigInt,
  Bytes,
  environment,
  EvmDecodeParam,
  EvmEncodeParam,
  parseCSVNotNullable,
} from '@mimicprotocol/lib-ts'

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
        environment.evmEncode([
          EvmEncodeParam.fromValue('address', param0),
          EvmEncodeParam.fromValue('bytes32', param1),
        ])
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
          EvmEncodeParam.fromValue('bytes32', dataHash),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('bytes', signatures),
          EvmEncodeParam.fromValue('uint256', requiredSignatures),
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
          EvmEncodeParam.fromValue('bytes32', dataHash),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('bytes', signatures),
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
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('uint8', BigInt.fromU8(operation)),
          EvmEncodeParam.fromValue('uint256', safeTxGas),
          EvmEncodeParam.fromValue('uint256', baseGas),
          EvmEncodeParam.fromValue('uint256', gasPrice),
          EvmEncodeParam.fromValue('address', gasToken),
          EvmEncodeParam.fromValue('address', refundReceiver),
          EvmEncodeParam.fromValue('uint256', _nonce),
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

  getModulesPaginated(start: Address, pageSize: BigInt): GetModulesPaginatedOutputs {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xcc2f8452' +
        environment.evmEncode([
          EvmEncodeParam.fromValue('address', start),
          EvmEncodeParam.fromValue('uint256', pageSize),
        ])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('(address[],address)', response))
    return GetModulesPaginatedOutputs.parse(decodedResponse)
  }

  getOwners(): Address[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xa0e67e2b')
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('address[]', response))
    return decodedResponse === ''
      ? []
      : parseCSVNotNullable(decodedResponse).map<Address>((item0: string) => Address.fromString(item0))
  }

  getStorageAt(offset: BigInt, length: BigInt): Bytes {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5624b25b' +
        environment.evmEncode([
          EvmEncodeParam.fromValue('uint256', offset),
          EvmEncodeParam.fromValue('uint256', length),
        ])
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
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('uint8', BigInt.fromU8(operation)),
          EvmEncodeParam.fromValue('uint256', safeTxGas),
          EvmEncodeParam.fromValue('uint256', baseGas),
          EvmEncodeParam.fromValue('uint256', gasPrice),
          EvmEncodeParam.fromValue('address', gasToken),
          EvmEncodeParam.fromValue('address', refundReceiver),
          EvmEncodeParam.fromValue('uint256', _nonce),
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
      '0x2d9ad53d' + environment.evmEncode([EvmEncodeParam.fromValue('address', module)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  isOwner(owner: Address): bool {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2f54bf6e' + environment.evmEncode([EvmEncodeParam.fromValue('address', owner)])
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
      '0x5ae6bd37' + environment.evmEncode([EvmEncodeParam.fromValue('bytes32', param0)])
    )
    const decodedResponse = environment.evmDecode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }
}

export class ExecTransactionFromModuleReturnDataOutputs {
  readonly success: bool
  readonly returnData: Bytes

  constructor(success: bool, returnData: Bytes) {
    this.success = success
    this.returnData = returnData
  }

  static parse(data: string): ExecTransactionFromModuleReturnDataOutputs {
    const parts = parseCSVNotNullable(data)
    if (parts.length !== 2) throw new Error('Invalid data for tuple parsing')
    const success: bool = u8.parse(parts[0]) as bool
    const returnData: Bytes = Bytes.fromHexString(parts[1])
    return new ExecTransactionFromModuleReturnDataOutputs(success, returnData)
  }

  toEvmEncodeParams(): EvmEncodeParam[] {
    return [
      EvmEncodeParam.fromValue('bool', Bytes.fromBool(this.success)),
      EvmEncodeParam.fromValue('bytes', this.returnData),
    ]
  }
}

export class GetModulesPaginatedOutputs {
  readonly array: Address[]
  readonly next: Address

  constructor(array: Address[], next: Address) {
    this.array = array
    this.next = next
  }

  static parse(data: string): GetModulesPaginatedOutputs {
    const parts = parseCSVNotNullable(data)
    if (parts.length !== 2) throw new Error('Invalid data for tuple parsing')
    const array: Address[] =
      parts[0] === '' ? [] : parseCSVNotNullable(parts[0]).map<Address>((item0: string) => Address.fromString(item0))
    const next: Address = Address.fromString(parts[1])
    return new GetModulesPaginatedOutputs(array, next)
  }

  toEvmEncodeParams(): EvmEncodeParam[] {
    return [
      EvmEncodeParam.fromValues(
        'address[]',
        this.array.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('address', s0))
      ),
      EvmEncodeParam.fromValue('address', this.next),
    ]
  }
}
