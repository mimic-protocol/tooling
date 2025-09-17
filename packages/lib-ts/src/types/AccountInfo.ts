export class AccountInfo {
  constructor(
    public owner: string,
    public lamports: string,
    public data: string,
    public rentEpoch: string,
    public executable: bool
  ) {}

  toString(): string {
    return `AccountInfo { executable: ${this.executable}, owner: ${this.owner}, lamports: ${this.lamports}, data: ${this.data}, rentEpoch: ${this.rentEpoch} }`
  }
}
