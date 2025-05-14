import { Address, Bytes } from '@mimicprotocol/lib-ts'

declare namespace input {
  const chainId: i32
  var feeToken: string | null
  var data: string | null
  var feeAmountStringDecimal: string | null
}

// The class name is intentionally lowercase and plural to resemble a namespace when used in a task
export class inputs {
  static get chainId(): i32 {
    return input.chainId
  }

  static get feeToken(): Address {
    return Address.fromString(input.feeToken!)
  }

  static get data(): Bytes {
    return Bytes.fromHexString(input.data!)
  }

  static get feeAmountStringDecimal(): string {
    return input.feeAmountStringDecimal!
  }
}
