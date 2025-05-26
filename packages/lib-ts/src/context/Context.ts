@json
export class Context {
  constructor(
    public readonly timestamp: u64,
    public readonly consensusThreshold: u64,
    public readonly user: string,
    public readonly configId: string
  ) {}
}
