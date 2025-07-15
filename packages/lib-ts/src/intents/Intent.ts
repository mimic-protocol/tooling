import { environment } from '../environment'
import { evm } from '../evm'
import { NULL_ADDRESS } from '../helpers'
import { Address, BigInt } from '../types'

export enum OperationType {
  Swap,
  Transfer,
  Call,
}

const DEFAULT_DEADLINE = 5 * 60 // 5 minutes in seconds

export abstract class IntentBuilder {
  protected user: Address | null = null
  protected settler: Address | null = null
  protected deadline: BigInt | null = null
  protected nonce: string | null = null

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
  public user: string
  public deadline: string
  public nonce: string

  static getSettler(chainId: i32): Address {
    const context = environment.getContext()
    return context.findSettler(chainId)
  }

  protected constructor(
    op: OperationType,
    settler: Address,
    user: Address | null,
    deadline: BigInt | null,
    nonce: string | null
  ) {
    const context = environment.getContext()
    this.op = op
    this.settler = settler.toString()
    this.deadline = deadline ? deadline.toString() : (context.timestamp / 1000 + DEFAULT_DEADLINE).toString()
    this.user = user ? user.toString() : context.user.toString()
    this.nonce = nonce ? nonce : evm.keccak(`${context.configSig}${context.timestamp}${++INTENT_INDEX}`)

    if (!this.user || this.user == NULL_ADDRESS) throw new Error('A user must be specified')
    if (!this.settler || this.settler == NULL_ADDRESS) throw new Error('A settler contract must be specified')
  }

  abstract send(): void
}
