@json
export class Context {
  constructor(
    public readonly timestamp: u64,
    public user: string,
    public configId: string
  ) {}
}
