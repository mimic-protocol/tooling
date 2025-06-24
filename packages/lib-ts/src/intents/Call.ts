import { environment } from '../environment'
import { TokenAmount } from '../tokens'
import { ChainId } from '../types'
import { Address, BigInt, Bytes } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class CallBuilder extends IntentBuilder {
  private chainId: ChainId
  private calls: CallData[] = []
  private fee: TokenAmount | null = null

  static forChain(chainId: ChainId): CallBuilder {
    return new CallBuilder(chainId)
  }

  static forChainWithFee(chainId: ChainId, fee: TokenAmount): CallBuilder {
    const builder = new CallBuilder(chainId)
    builder.addFee(fee)
    return builder
  }

  constructor(chainId: ChainId) {
    super()
    this.chainId = chainId
  }

  addCall(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()): CallBuilder {
    this.calls.push(new CallData(target, data, value))
    return this
  }

  addFee(fee: TokenAmount): CallBuilder {
    if (fee.token.chainId !== this.chainId) throw new Error('Fee token must be on the same chain')
    this.fee = fee
    return this
  }

  addSettler(settler: Address): CallBuilder {
    return changetype<CallBuilder>(super.addSettler(settler))
  }

  addSettlerAsString(settler: string): CallBuilder {
    return changetype<CallBuilder>(super.addSettlerAsString(settler))
  }

  addDeadline(deadline: BigInt): CallBuilder {
    return changetype<CallBuilder>(super.addDeadline(deadline))
  }

  addUser(user: Address): CallBuilder {
    return changetype<CallBuilder>(super.addUser(user))
  }

  addUserAsString(user: string): CallBuilder {
    return changetype<CallBuilder>(super.addUserAsString(user))
  }

  addNonce(nonce: string): CallBuilder {
    return changetype<CallBuilder>(super.addNonce(nonce))
  }

  build(): Call {
    if (!this.fee) throw new Error('Transfer fee must be specified')
    return new Call(
      this.chainId,
      this.calls,
      this.fee as TokenAmount,
      this.settler,
      this.user,
      this.deadline,
      this.nonce
    )
  }
}

@json
export class CallData {
  public target: string
  public data: string
  public value: string

  constructor(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()) {
    this.target = target.toString()
    this.data = data.toHexString()
    this.value = value.toString()
  }
}

@json
export class Call extends Intent {
  public chainId: ChainId
  public calls: CallData[]
  public feeToken: string
  public feeAmount: string

  static create(
    chainId: ChainId,
    target: Address,
    data: Bytes,
    fee: TokenAmount,
    value: BigInt = BigInt.zero(),
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Call {
    const callData = new CallData(target, data, value)
    return new Call(chainId, [callData], fee, settler, user, deadline, nonce)
  }

  constructor(
    chainId: ChainId,
    calls: CallData[],
    fee: TokenAmount,
    settler: Address | null = null,
    user: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ) {
    super(OperationType.Call, settler, user, deadline, nonce)

    if (calls.length === 0) throw new Error('Call list cannot be empty')

    this.calls = calls
    this.feeToken = fee.token.address.toString()
    this.feeAmount = fee.amount.toString()
    this.chainId = chainId
  }

  public send(): void {
    environment.call(this)
  }
}
