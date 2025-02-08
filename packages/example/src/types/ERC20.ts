import { Address, BigInt } from '@mimicprotocol/lib-ts'
export declare class ERC20 {
  static load(address: Address, chainId: u64): ERC20;
  name(): string;
  totalSupply(): BigInt;
  decimals(): BigInt;
  balanceOf(_owner: Address): BigInt;
  symbol(): string;
  allowance(_owner: Address, _spender: Address): BigInt;
}