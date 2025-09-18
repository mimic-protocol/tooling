import { Address, ChainId } from '../types'
import { TriggerType } from '../types/TriggerType'

@json
export class SerializableSettler {
  constructor(
    public readonly address: string,
    public readonly chainId: i32
  ) {}
}

export class Settler {
  constructor(
    public readonly address: Address,
    public readonly chainId: ChainId
  ) {}

  static fromSerializable(serializable: SerializableSettler): Settler {
    return new Settler(Address.fromString(serializable.address), serializable.chainId)
  }
}

@json
export class SerializableContext {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u8,
    public user: string,
    public settlers: SerializableSettler[],
    public configSig: string,
    public triggerType: TriggerType,
    public triggerData: string
  ) {}
}

export class Context {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u8,
    public user: Address,
    public settlers: Settler[],
    public configSig: string,
    public triggerType: TriggerType,
    public triggerData: string
  ) {}

  static fromSerializable(serializable: SerializableContext): Context {
    return new Context(
      serializable.timestamp,
      serializable.consensusThreshold,
      Address.fromString(serializable.user),
      serializable.settlers.map<Settler>((s) => Settler.fromSerializable(s)),
      serializable.configSig,
      serializable.triggerType,
      serializable.triggerData
    )
  }

  findSettler(chainId: ChainId): Address {
    for (let i = 0; i < this.settlers.length; i++) {
      if (this.settlers[i].chainId === chainId) {
        return this.settlers[i].address
      }
    }
    throw new Error(`Settler not found for chainId: ${chainId}`)
  }
}
