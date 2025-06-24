import { Address } from '../types'

@json
export class SerializableContext {
  constructor(
    public readonly timestamp: u64,
    public user: string,
    public settler: string,
    public configId: string
  ) {}
}

export class Context {
  constructor(
    public readonly timestamp: u64,
    public user: Address,
    public settler: Address,
    public configId: string
  ) {}

  static fromSerializable(serializable: SerializableContext): Context {
    return new Context(
      serializable.timestamp,
      Address.fromString(serializable.user),
      Address.fromString(serializable.settler),
      serializable.configId
    )
  }
}
