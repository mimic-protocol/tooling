/* eslint-disable no-secrets/no-secrets */
export function randomHex(length: i32): string {
  const hexChars: string = '0123456789abcdef'
  let result: string = '0x'
  for (let i: i32 = 0; i < length; i++) {
    const randomIndex: i32 = <i32>Math.floor(Math.random() * hexChars.length)
    result += hexChars.charAt(randomIndex)
  }
  return result
}

export function randomAddress(): string {
  return randomHex(40)
}

export const MAX_I32: i32 = 2147483647
export const MAX_U32: u32 = 4294967295
export const MAX_I64: i64 = 9223372036854775807
export const MAX_U64: u64 = 18446744073709551615
export const NULL_ADDRESS: string = '0x0000000000000000000000000000000000000000'
