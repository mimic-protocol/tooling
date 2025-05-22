import { Address, BigInt } from '../types'
import { environment } from "../environment";
import { NULL_ADDRESS } from "../helpers";

export enum OperationType {
  Swap,
  Transfer,
  Call,
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
    const context = environment.getContext();
    this.op = op
    this.settler = settler ? settler.toString() : NULL_ADDRESS
    this.deadline = deadline ? deadline.toString() : (context.timestamp + 5 * 60 * 1000).toString()
    this.user = context.user
    this.nonce = environment.evmKeccak(`${context.configId}${context.timestamp}${++INTENT_INDEX}`)
  }
}
