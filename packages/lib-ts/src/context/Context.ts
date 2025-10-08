import { evm } from '../evm'
import { Address, BigInt, ChainId, EvmDecodeParam, JSON } from '../types'
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
export class SerializableTrigger {
  constructor(
    public type: u8,
    public data: string
  ) {}
}

export class EventTriggerData {
  constructor(
    public blockHash: string,
    public index: BigInt,
    public topics: string[],
    public eventData: string
  ) {}
}

@json
export class Trigger {
  constructor(
    public type: TriggerType,
    public data: string
  ) {}

  static fromSerializable(serializable: SerializableTrigger): Trigger {
    return new Trigger(serializable.type, serializable.data)
  }

  getCronData(): BigInt {
    return Trigger.deserializeCronTriggerData(this.data)
  }

  getEventData(): EventTriggerData {
    return Trigger.deserializeEventTriggerData(this.data)
  }

  static deserializeCronTriggerData(data: string): BigInt {
    return BigInt.fromString(evm.decode(new EvmDecodeParam('uint256', data)))
  }

  static deserializeEventTriggerData(data: string): EventTriggerData {
    const fields = JSON.parse<string[]>(evm.decode(new EvmDecodeParam('(bytes32,uint256,bytes32[],bytes)', data)))
    return new EventTriggerData(fields[0], BigInt.fromString(fields[1]), JSON.parse<string[]>(fields[2]), fields[3])
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
    public trigger: SerializableTrigger
  ) {}
}

export class Context {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u8,
    public user: Address,
    public settlers: Settler[],
    public configSig: string,
    public trigger: Trigger
  ) {}

  static fromSerializable(serializable: SerializableContext): Context {
    return new Context(
      serializable.timestamp,
      serializable.consensusThreshold,
      Address.fromString(serializable.user),
      serializable.settlers.map<Settler>((s) => Settler.fromSerializable(s)),
      serializable.configSig,
      Trigger.fromSerializable(serializable.trigger)
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
