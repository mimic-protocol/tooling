import { Address, BigInt } from '../types'

export enum OperationType {
  Swap,
  Transfer,
  Call,
}

@json
export abstract class Intent {
  public op: OperationType
  public settler: string | null
  public deadline: string | null
  protected constructor(op: OperationType, settler: Address | null, deadline: BigInt | null) {
    this.op = op
    this.settler = settler ? settler.toString() : null
    this.deadline = deadline ? deadline.toString() : null
  }
}
