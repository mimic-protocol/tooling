import {
  Address,
  BigInt,
  Bytes,
  CallBuilder,
  ChainId,
  environment,
  evm,
  EvmDecodeParam,
  EvmEncodeParam,
  parseCSVNotNullable,
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export class SAFE {
  private address: Address
  private chainId: ChainId
  private timestamp: Date | null
  private feeTokenAmount: TokenAmount | null

  constructor(
    address: Address,
    chainId: ChainId,
    timestamp: Date | null = null,
    feeTokenAmount: TokenAmount | null = null
  ) {
    this.address = address
    this.chainId = chainId
    this.timestamp = timestamp
    this.feeTokenAmount = feeTokenAmount
  }

  VERSION(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xffa1ad74')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  addOwnerWithThreshold(owner: Address, _threshold: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x0d582f13' +
        evm.encode([EvmEncodeParam.fromValue('address', owner), EvmEncodeParam.fromValue('uint256', _threshold)])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  approveHash(hashToApprove: Bytes): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xd4d9bdcd' + evm.encode([EvmEncodeParam.fromValue('bytes32', hashToApprove)])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  approvedHashes(param0: Address, param1: Bytes): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x7d832974' +
        evm.encode([EvmEncodeParam.fromValue('address', param0), EvmEncodeParam.fromValue('bytes32', param1)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  changeThreshold(_threshold: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x694e80c3' + evm.encode([EvmEncodeParam.fromValue('uint256', _threshold)])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  checkNSignatures(dataHash: Bytes, data: Bytes, signatures: Bytes, requiredSignatures: BigInt): void {
    environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x12fb68e0' +
        evm.encode([
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
        evm.encode([
          EvmEncodeParam.fromValue('bytes32', dataHash),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('bytes', signatures),
        ])
    )
  }

  disableModule(prevModule: Address, module: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xe009cfde' +
        evm.encode([EvmEncodeParam.fromValue('address', prevModule), EvmEncodeParam.fromValue('address', module)])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  domainSeparator(): Bytes {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xf698da25')
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  enableModule(module: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString('0x610b5925' + evm.encode([EvmEncodeParam.fromValue('address', module)]))
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
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
        evm.encode([
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
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  execTransaction(
    to: Address,
    value: BigInt,
    data: Bytes,
    operation: u8,
    safeTxGas: BigInt,
    baseGas: BigInt,
    gasPrice: BigInt,
    gasToken: Address,
    refundReceiver: Address,
    signatures: Bytes
  ): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x6a761202' +
        evm.encode([
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('uint8', BigInt.fromU8(operation)),
          EvmEncodeParam.fromValue('uint256', safeTxGas),
          EvmEncodeParam.fromValue('uint256', baseGas),
          EvmEncodeParam.fromValue('uint256', gasPrice),
          EvmEncodeParam.fromValue('address', gasToken),
          EvmEncodeParam.fromValue('address', refundReceiver),
          EvmEncodeParam.fromValue('bytes', signatures),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  execTransactionFromModule(to: Address, value: BigInt, data: Bytes, operation: u8): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x468721a7' +
        evm.encode([
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('uint8', BigInt.fromU8(operation)),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  execTransactionFromModuleReturnData(to: Address, value: BigInt, data: Bytes, operation: u8): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x5229073f' +
        evm.encode([
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('uint8', BigInt.fromU8(operation)),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  getChainId(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x3408e470')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  getModulesPaginated(start: Address, pageSize: BigInt): GetModulesPaginatedOutputs {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xcc2f8452' +
        evm.encode([EvmEncodeParam.fromValue('address', start), EvmEncodeParam.fromValue('uint256', pageSize)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('(address[],address)', response))
    return GetModulesPaginatedOutputs.parse(decodedResponse)
  }

  getOwners(): Address[] {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xa0e67e2b')
    const decodedResponse = evm.decode(new EvmDecodeParam('address[]', response))
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
        evm.encode([EvmEncodeParam.fromValue('uint256', offset), EvmEncodeParam.fromValue('uint256', length)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes', response))
    return Bytes.fromHexString(decodedResponse)
  }

  getThreshold(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xe75235b8')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
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
        evm.encode([
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
    const decodedResponse = evm.decode(new EvmDecodeParam('bytes32', response))
    return Bytes.fromHexString(decodedResponse)
  }

  isModuleEnabled(module: Address): bool {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2d9ad53d' + evm.encode([EvmEncodeParam.fromValue('address', module)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  isOwner(owner: Address): bool {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x2f54bf6e' + evm.encode([EvmEncodeParam.fromValue('address', owner)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('bool', response))
    return u8.parse(decodedResponse) as bool
  }

  nonce(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0xaffed0e0')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  removeOwner(prevOwner: Address, owner: Address, _threshold: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xf8dc5dd9' +
        evm.encode([
          EvmEncodeParam.fromValue('address', prevOwner),
          EvmEncodeParam.fromValue('address', owner),
          EvmEncodeParam.fromValue('uint256', _threshold),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  requiredTxGas(to: Address, value: BigInt, data: Bytes, operation: u8): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xc4ca3a9c' +
        evm.encode([
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('uint8', BigInt.fromU8(operation)),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  setFallbackHandler(handler: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString('0xf08a0323' + evm.encode([EvmEncodeParam.fromValue('address', handler)]))
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  setGuard(guard: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString('0xe19a9dd9' + evm.encode([EvmEncodeParam.fromValue('address', guard)]))
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  setup(
    _owners: Address[],
    _threshold: BigInt,
    to: Address,
    data: Bytes,
    fallbackHandler: Address,
    paymentToken: Address,
    payment: BigInt,
    paymentReceiver: Address
  ): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xb63e800d' +
        evm.encode([
          EvmEncodeParam.fromValues(
            'address[]',
            _owners.map<EvmEncodeParam>((s0) => EvmEncodeParam.fromValue('address', s0))
          ),
          EvmEncodeParam.fromValue('uint256', _threshold),
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('bytes', data),
          EvmEncodeParam.fromValue('address', fallbackHandler),
          EvmEncodeParam.fromValue('address', paymentToken),
          EvmEncodeParam.fromValue('uint256', payment),
          EvmEncodeParam.fromValue('address', paymentReceiver),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  signedMessages(param0: Bytes): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x5ae6bd37' + evm.encode([EvmEncodeParam.fromValue('bytes32', param0)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  simulateAndRevert(targetContract: Address, calldataPayload: Bytes): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xb4faba09' +
        evm.encode([
          EvmEncodeParam.fromValue('address', targetContract),
          EvmEncodeParam.fromValue('bytes', calldataPayload),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
  }

  swapOwner(prevOwner: Address, oldOwner: Address, newOwner: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xe318b52b' +
        evm.encode([
          EvmEncodeParam.fromValue('address', prevOwner),
          EvmEncodeParam.fromValue('address', oldOwner),
          EvmEncodeParam.fromValue('address', newOwner),
        ])
    )
    return CallBuilder.fromTokenAmountAndChain(this.feeTokenAmount, this.chainId).addCall(this.address, encodedData)
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
