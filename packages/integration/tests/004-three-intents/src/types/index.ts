import { BigInt } from '@mimicprotocol/lib-ts'

declare namespace input {
  const chainId: i32
  var amount: string | null
  const slippage: i32
}

// The class name is intentionally lowercase and plural to resemble a namespace when used in a task
export class inputs {
  static get chainId(): i32 {
    return input.chainId
  }

  static get amount(): BigInt {
    return BigInt.fromString(input.amount!)
  }

  static get slippage(): i32 {
    return input.slippage
  }
}
