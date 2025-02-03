import { Address, BigInt } from '@mimicprotocol/lib-ts'
export declare namespace ERC20 {
  export function name(): string;
  export function totalSupply(): BigInt;
  export function decimals(): BigInt;
  export function balanceOf(_owner: Address): BigInt;
  export function symbol(): string;
  export function allowance(_owner: Address, _spender: Address): BigInt;
}