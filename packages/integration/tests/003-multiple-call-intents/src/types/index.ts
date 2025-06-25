declare namespace input {
  const chainId: i32 // The chain ID to use for the transaction
}

// The class name is intentionally lowercase and plural to resemble a namespace when used in a task
export class inputs {
  static get chainId(): i32 {
    return input.chainId
  }
}
