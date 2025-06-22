import { environment } from '../environment'
import { TokenAmount } from '../tokens'
import { ChainId } from '../types'
import { Address, BigInt, Bytes } from '../types'

import { Intent, IntentBuilder, OperationType } from './Intent'

export class CallBuilder extends IntentBuilder {
  private chainId: ChainId
  private fee: TokenAmount
  private calls: CallData[] = []

  static forChainWithFee(chainId: ChainId, fee: TokenAmount): CallBuilder {
    return new CallBuilder(chainId, fee)
  }

  constructor(chainId: ChainId, fee: TokenAmount) {
    super()
    if (fee.token.chainId !== chainId) {
      throw new Error('Fee token must be on the same chain as the one requested for the call')
    }
    this.chainId = chainId
    this.fee = fee
  }

  addCall(target: Address, data: Bytes = Bytes.empty(), value: BigInt = BigInt.zero()): CallBuilder {
    this.calls.push(new CallData(target, data, value))
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
    return new Call(this.calls, this.fee, this.chainId, this.settler, this.user, this.deadline, this.nonce)
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
  public calls: CallData[]
  public feeToken: string
  public feeAmount: string
  public chainId: ChainId

  static create(
    chainId: ChainId,
    target: Address,
    data: Bytes,
    fee: TokenAmount,
    value: BigInt = BigInt.zero(),
    user: Address | null = null,
    settler: Address | null = null,
    deadline: BigInt | null = null,
    nonce: string | null = null
  ): Call {
    const callData = new CallData(target, data, value)
    return new Call([callData], fee, chainId, settler, user, deadline, nonce)
  }

  constructor(
    calls: CallData[],
    fee: TokenAmount,
    chainId: ChainId,
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
