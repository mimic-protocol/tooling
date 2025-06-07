import { Address } from '../types'

@json
export class Call {
  public to: string
  public chainId: u64
  public timestamp: Date | null
  public data: string

  constructor(to: Address, chainId: u64, timestamp: Date | null, data: string) {
    this.to = to.toString()
    this.chainId = chainId
    this.data = data
    this.timestamp = timestamp
  }
}
