import { Address, BigInt, JSON } from '@mimicprotocol/lib-ts'

declare namespace erc20 {
  export function name(params: string): string;
  export function totalSupply(params: string): string;
  export function decimals(params: string): string;
  export function balanceOf(params: string): string;
  export function symbol(params: string): string;
  export function allowance(params: string): string;
}

export class ERC20 {
  address: Address;
  chainId: u64;

  constructor(address: Address, chainId: u64) {
    this.address = address;
    this.chainId = chainId;
  }

  name(): string {
    const result = erc20.name(JSON.stringify(new ERC20NameParams(this.address, this.chainId)));
    return result;
  }

  totalSupply(): BigInt {
    const result = erc20.totalSupply(JSON.stringify(new ERC20TotalSupplyParams(this.address, this.chainId)));
    return BigInt.fromString(result);
  }

  decimals(): u8 {
    const result = erc20.decimals(JSON.stringify(new ERC20DecimalsParams(this.address, this.chainId)));
    return JSON.parse<u8>(result);
  }

  balanceOf(_owner: Address): BigInt {
    const result = erc20.balanceOf(JSON.stringify(new ERC20BalanceOfParams(this.address, this.chainId, _owner)));
    return BigInt.fromString(result);
  }

  symbol(): string {
    const result = erc20.symbol(JSON.stringify(new ERC20SymbolParams(this.address, this.chainId)));
    return result;
  }

  allowance(_owner: Address, _spender: Address): BigInt {
    const result = erc20.allowance(JSON.stringify(new ERC20AllowanceParams(this.address, this.chainId, _owner, _spender)));
    return BigInt.fromString(result);
  }

}

@json
class ERC20BaseParams {
  address: string;
  chain_id: u64;

  constructor(address: Address, chainId: u64) {
    this.address = address.toHexString();
    this.chain_id = chainId;
  }
}

@json
class ERC20NameParams extends ERC20BaseParams {

  constructor(address: Address, chainId: u64) {
    super(address, chainId);
  }
}

@json
class ERC20TotalSupplyParams extends ERC20BaseParams {

  constructor(address: Address, chainId: u64) {
    super(address, chainId);
  }
}

@json
class ERC20DecimalsParams extends ERC20BaseParams {

  constructor(address: Address, chainId: u64) {
    super(address, chainId);
  }
}

@json
class ERC20BalanceOfParams extends ERC20BaseParams {
  _owner: string;

  constructor(address: Address, chainId: u64, _owner: Address) {
    super(address, chainId);
    this._owner = _owner.toHexString();
  }
}

@json
class ERC20SymbolParams extends ERC20BaseParams {

  constructor(address: Address, chainId: u64) {
    super(address, chainId);
  }
}

@json
class ERC20AllowanceParams extends ERC20BaseParams {
  _owner: string;
  _spender: string;

  constructor(address: Address, chainId: u64, _owner: Address, _spender: Address) {
    super(address, chainId);
    this._owner = _owner.toHexString();
    this._spender = _spender.toHexString();
  }
}