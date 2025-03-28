// @ts-ignore
@external('environment', '_result')
declare function _result(params: string): void

export function result(key: string, value: string): void {
  _result(`${key},${value}`)
}
