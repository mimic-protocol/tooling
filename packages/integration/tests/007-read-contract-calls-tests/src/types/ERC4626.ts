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
  TokenAmount,
} from '@mimicprotocol/lib-ts'

export class ERC4626 {
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

  allowance(owner: Address, spender: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xdd62ed3e' +
        evm.encode([EvmEncodeParam.fromValue('address', owner), EvmEncodeParam.fromValue('address', spender)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  approve(spender: Address, value: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x095ea7b3' +
        evm.encode([EvmEncodeParam.fromValue('address', spender), EvmEncodeParam.fromValue('uint256', value)])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }

  asset(): Address {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x38d52e0f')
    const decodedResponse = evm.decode(new EvmDecodeParam('address', response))
    return Address.fromString(decodedResponse)
  }

  balanceOf(account: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x70a08231' + evm.encode([EvmEncodeParam.fromValue('address', account)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  convertToAssets(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x07a2d13a' + evm.encode([EvmEncodeParam.fromValue('uint256', shares)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  convertToShares(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc6e6f592' + evm.encode([EvmEncodeParam.fromValue('uint256', assets)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  decimals(): u8 {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x313ce567')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint8', response))
    return u8.parse(decodedResponse)
  }

  deposit(assets: BigInt, receiver: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x6e553f65' +
        evm.encode([EvmEncodeParam.fromValue('uint256', assets), EvmEncodeParam.fromValue('address', receiver)])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }

  maxDeposit(param0: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x402d267d' + evm.encode([EvmEncodeParam.fromValue('address', param0)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  maxMint(param0: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xc63d75b6' + evm.encode([EvmEncodeParam.fromValue('address', param0)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  maxRedeem(owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xd905777e' + evm.encode([EvmEncodeParam.fromValue('address', owner)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  maxWithdraw(owner: Address): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xce96cb77' + evm.encode([EvmEncodeParam.fromValue('address', owner)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  mint(shares: BigInt, receiver: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x94bf804d' +
        evm.encode([EvmEncodeParam.fromValue('uint256', shares), EvmEncodeParam.fromValue('address', receiver)])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }

  name(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x06fdde03')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  previewDeposit(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xef8b30f7' + evm.encode([EvmEncodeParam.fromValue('uint256', assets)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  previewMint(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0xb3d7f6b9' + evm.encode([EvmEncodeParam.fromValue('uint256', shares)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  previewRedeem(shares: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x4cdad506' + evm.encode([EvmEncodeParam.fromValue('uint256', shares)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  previewWithdraw(assets: BigInt): BigInt {
    const response = environment.contractCall(
      this.address,
      this.chainId,
      this.timestamp,
      '0x0a28a477' + evm.encode([EvmEncodeParam.fromValue('uint256', assets)])
    )
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  redeem(shares: BigInt, receiver: Address, owner: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xba087652' +
        evm.encode([
          EvmEncodeParam.fromValue('uint256', shares),
          EvmEncodeParam.fromValue('address', receiver),
          EvmEncodeParam.fromValue('address', owner),
        ])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }

  symbol(): string {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x95d89b41')
    const decodedResponse = evm.decode(new EvmDecodeParam('string', response))
    return decodedResponse
  }

  totalAssets(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x01e1d114')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  totalSupply(): BigInt {
    const response = environment.contractCall(this.address, this.chainId, this.timestamp, '0x18160ddd')
    const decodedResponse = evm.decode(new EvmDecodeParam('uint256', response))
    return BigInt.fromString(decodedResponse)
  }

  transfer(to: Address, value: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xa9059cbb' + evm.encode([EvmEncodeParam.fromValue('address', to), EvmEncodeParam.fromValue('uint256', value)])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }

  transferFrom(from: Address, to: Address, value: BigInt): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0x23b872dd' +
        evm.encode([
          EvmEncodeParam.fromValue('address', from),
          EvmEncodeParam.fromValue('address', to),
          EvmEncodeParam.fromValue('uint256', value),
        ])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }

  withdraw(assets: BigInt, receiver: Address, owner: Address): CallBuilder {
    if (!this.feeTokenAmount) throw new Error('Fee token amount is not set')
    const encodedData = Bytes.fromHexString(
      '0xb460af94' +
        evm.encode([
          EvmEncodeParam.fromValue('uint256', assets),
          EvmEncodeParam.fromValue('address', receiver),
          EvmEncodeParam.fromValue('address', owner),
        ])
    )
    return CallBuilder.forChainWithFee(this.chainId, changetype<TokenAmount>(this.feeTokenAmount)).addCall(
      this.address,
      encodedData
    )
  }
}
