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
  protected nonce: string = ''

  addSettler(settler: Address): IntentBuilder {
    this.settler = settler
    return this
  }

  addSettlerAsString(settler: string): IntentBuilder {
    return this.addSettler(Address.fromString(settler))
  }

  addDeadline(deadline: BigInt): IntentBuilder {
    this.deadline = deadline
    return this
  }

  addUser(user: Address): IntentBuilder {
    this.user = user
    return this
  }

  addUserAsString(user: string): IntentBuilder {
    return this.addUser(Address.fromString(user))
  }

  addNonce(nonce: string): IntentBuilder {
    this.nonce = nonce
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

  protected constructor(
    op: OperationType,
    user: Address | null,
    settler: Address | null,
    deadline: BigInt | null,
    nonce: string = ''
  ) {
    this.op = op
    this.settler = settler ? settler.toString() : NULL_ADDRESS
    const context = environment.getContext()
    this.deadline = deadline ? deadline.toString() : (context.timestamp + 5 * 60 * 1000).toString()
    this.user = user ? user.toString() : context.user.toString()
    this.nonce = nonce != '' ? nonce : evm.keccak(`${context.configId}${context.timestamp}${++INTENT_INDEX}`)
  }

  abstract send(): void
}
