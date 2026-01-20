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
    public chainId: BigInt,
    public blockHash: string,
    public index: BigInt,
    public contract: Address,
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
    if (this.type !== TriggerType.CRON) throw new Error("Can't get cron data, trigger type is not cron")
    return Trigger.deserializeCronTriggerData(this.data)
  }

  getEventData(): EventTriggerData {
    if (this.type !== TriggerType.EVENT) throw new Error("Can't get event data, trigger type is not event")
    return Trigger.deserializeEventTriggerData(this.data)
  }

  static deserializeCronTriggerData(data: string): BigInt {
    return BigInt.fromString(evm.decode(new EvmDecodeParam('uint256', data)))
  }

  static deserializeEventTriggerData(data: string): EventTriggerData {
    const fields = JSON.parse<string[]>(
      evm.decode(new EvmDecodeParam('(uint256,bytes32,uint256,address,bytes32[],bytes)', data))
    )
    return new EventTriggerData(
      BigInt.fromString(fields[0]),
      fields[1],
      BigInt.fromString(fields[2]),
      Address.fromString(fields[3]),
      JSON.parse<string[]>(fields[4]),
      fields[5]
    )
  }
}

@json
export class SerializableContext {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u8,
    public user: string,
    public settlers: SerializableSettler[],
    public triggerSig: string,
    public trigger: SerializableTrigger
  ) {}
}

export class Context {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u8,
    public user: Address,
    public settlers: Settler[],
    public triggerSig: string,
    public trigger: Trigger
  ) {}

  static fromSerializable(serializable: SerializableContext): Context {
    return new Context(
      serializable.timestamp,
      serializable.consensusThreshold,
      Address.fromString(serializable.user),
      serializable.settlers.map<Settler>((s) => Settler.fromSerializable(s)),
      serializable.triggerSig,
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
