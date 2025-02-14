import { Address, BigInt, Bytes } from '../common'

@json
export class CallParams {
  settler: string
  chain_id: u64
  target: string
  data: string | null
  fee_token: string
  fee_amount: string

  constructor(
    settler: Address,
    chainId: u64,
    target: Address,
    feeToken: Address,
    feeAmount: BigInt,
    data: Bytes | null
  ) {
    this.settler = settler.toHexString()
    this.chain_id = chainId
    this.target = target.toHexString()
    this.fee_token = feeToken.toHexString()
    this.fee_amount = feeAmount.toString()
    this.data = data ? data.toHexString() : null
  }
}

@json
export class SwapParams {
  settler: string
  source_chain_id: u64
  token_in: string
  token_out: string
  amount_in: string
  min_amount_out: string

  constructor(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: BigInt,
    minAmountOut: BigInt
  ) {
    this.settler = settler.toHexString()
    this.source_chain_id = sourceChainId
    this.token_in = tokenIn.toHexString()
    this.token_out = tokenOut.toHexString()
    this.amount_in = amountIn.toString()
    this.min_amount_out = minAmountOut.toString()
  }
}

@json
export class BridgeParams {
  settler: string
  source_chain_id: u64
  token_in: string
  amount_in: string
  destination_chain_id: u64
  token_out: string
  min_amount_out: string

  constructor(
    settler: Address,
    sourceChainId: u64,
    tokenIn: Address,
    amountIn: BigInt,
    destinationChainId: u64,
    tokenOut: Address,
    minAmountOut: BigInt
  ) {
    this.settler = settler.toHexString()
    this.source_chain_id = sourceChainId
    this.token_in = tokenIn.toHexString()
    this.amount_in = amountIn.toString()
    this.destination_chain_id = destinationChainId
    this.token_out = tokenOut.toHexString()
    this.min_amount_out = minAmountOut.toString()
  }
}

@json
export class TransferParams {
  settler: string
  source_chain_id: u64
  token: string
  amount: string
  recipient: string
  fee_amount: string

  constructor(
    settler: Address,
    sourceChainId: u64,
    token: Address,
    amount: BigInt,
    recipient: Address,
    feeAmount: BigInt
  ) {
    this.settler = settler.toHexString()
    this.source_chain_id = sourceChainId
    this.token = token.toHexString()
    this.amount = amount.toString()
    this.recipient = recipient.toHexString()
    this.fee_amount = feeAmount.toString()
  }
}
