import { Address, BigInt, environment } from '@mimicprotocol/lib-ts'

export class ERC20 {
  private address: Address;
  private chainId: u64;

  constructor(address: Address, chainId: u64) {
    this.address = address;
    this.chainId = chainId;
  }

  name(): string {
    const result = environment.contractCall(this.address, this.chainId, 'name', []);
    return result;
  }

  totalSupply(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, 'totalSupply', []);
    return BigInt.fromString(result);
  }

  decimals(): BigInt {
    const result = environment.contractCall(this.address, this.chainId, 'decimals', []);
    return BigInt.fromString(result);
  }

  balanceOf(_owner: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, 'balanceOf', [_owner]);
    return BigInt.fromString(result);
  }

  symbol(): string {
    const result = environment.contractCall(this.address, this.chainId, 'symbol', []);
    return result;
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const result = environment.contractCall(this.address, this.chainId, 'allowance', [_owner, _spender]);
    return BigInt.fromString(result);
  }

}