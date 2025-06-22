import { Address, ChainId } from '../types'

@json
export class Call {
  public to: string
  public chainId: ChainId
  public timestamp: Date | null
  public data: string

  constructor(to: Address, chainId: ChainId, timestamp: Date | null, data: string) {
    this.to = to.toString()
    this.chainId = chainId
    this.data = data
    this.timestamp = timestamp
  }
}
