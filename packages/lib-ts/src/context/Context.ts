import { evm } from '../evm'
import { Address, BigInt, ChainId, EvmDecodeParam, JSON } from '../types'
import { ConfigType } from '../types/ConfigType'

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
export class SerializableConfig {
  constructor(
    public type: u8,
    public data: string
  ) {}
}

export class EventConfigData {
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
export class Config {
  constructor(
    public type: ConfigType,
    public data: string
  ) {}

  static fromSerializable(serializable: SerializableConfig): Config {
    return new Config(serializable.type, serializable.data)
  }

  getCronData(): BigInt {
    if (this.type !== ConfigType.CRON) throw new Error("Can't get cron data, config type is not cron")
    return Config.deserializeCronConfigData(this.data)
  }

  getEventData(): EventConfigData {
    if (this.type !== ConfigType.EVENT) throw new Error("Can't get event data, config type is not event")
    return Config.deserializeEventConfigData(this.data)
  }

  static deserializeCronConfigData(data: string): BigInt {
    return BigInt.fromString(evm.decode(new EvmDecodeParam('uint256', data)))
  }

  static deserializeEventConfigData(data: string): EventConfigData {
    const fields = JSON.parse<string[]>(
      evm.decode(new EvmDecodeParam('(uint256,bytes32,uint256,address,bytes32[],bytes)', data))
    )
    return new EventConfigData(
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
    public config: SerializableConfig
  ) {}
}

export class Context {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u8,
    public user: Address,
    public settlers: Settler[],
    public triggerSig: string,
    public config: Config
  ) {}

  static fromSerializable(serializable: SerializableContext): Context {
    return new Context(
      serializable.timestamp,
      serializable.consensusThreshold,
      Address.fromString(serializable.user),
      serializable.settlers.map<Settler>((s) => Settler.fromSerializable(s)),
      serializable.triggerSig,
      Config.fromSerializable(serializable.config)
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
