import { environment } from '../environment'
import { evm } from '../evm'
import { NULL_ADDRESS } from '../helpers'
import { Address, BigInt } from '../types'

export enum OperationType {
  Swap,
  Transfer,
  Call,
}

export abstract class IntentBuilder {
  protected user: Address | null = null
  protected settler: Address | null = null
  protected deadline: BigInt | null = null

  setSettler(settler: Address): IntentBuilder {
    this.settler = settler
    return this
  }

  setSettlerAsString(settler: string): IntentBuilder {
    this.settler = Address.fromString(settler)
    return this
  }

  setDeadline(deadline: BigInt): IntentBuilder {
    this.deadline = deadline
    return this
  }

  setUser(user: Address): IntentBuilder {
    this.user = user
    return this
  }

  abstract build(): Intent
}

let INTENT_INDEX: u32 = 0
@json
export abstract class Intent {
  public op: OperationType
  public settler: string
  public deadline: string
  public user: string
  public nonce: string
  protected constructor(op: OperationType, settler: Address | null, deadline: BigInt | null) {
    const context = environment.getContext()
    this.op = op
    this.settler = settler ? settler.toString() : NULL_ADDRESS
    this.deadline = deadline ? deadline.toString() : (context.timestamp + 5 * 60 * 1000).toString()
    this.user = context.user.toString()
    this.nonce = evm.keccak(`${context.configId}${context.timestamp}${++INTENT_INDEX}`)
  }

  abstract send(): void;
}
