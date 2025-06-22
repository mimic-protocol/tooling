import { Address } from '../types'

@json
export class SerializableContext {
  constructor(
    public readonly timestamp: u64,
    public user: string,
    public configId: string
  ) {}
}

export class Context {
  constructor(
    public readonly timestamp: u64,
    public user: Address,
    public configId: string
  ) {}

  static fromSerializable(serializable: SerializableContext): Context {
    return new Context(serializable.timestamp, Address.fromString(serializable.user), serializable.configId)
  }
}
