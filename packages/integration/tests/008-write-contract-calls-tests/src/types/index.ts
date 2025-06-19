import { Address } from '@mimicprotocol/lib-ts'

declare namespace input {
  var smartAccount: string | null
  var usdFeeAmount: string | null
}

// The class name is intentionally lowercase and plural to resemble a namespace when used in a task
export class inputs {
  static get smartAccount(): Address {
    return Address.fromString(input.smartAccount!)
  }

  static get usdFeeAmount(): string {
    return input.usdFeeAmount!
  }
}
