/* eslint-disable no-secrets/no-secrets */
export function getHexString(length: i32): string {
  const hexChars: string = '0123456789abcdef'
  let result: string = '0x'
  for (let i: i32 = 0; i < length; i++) {
    const randomIndex: i32 = <i32>Math.floor(Math.random() * hexChars.length)
    result += hexChars.charAt(randomIndex)
  }
  return result
}

export function getRandomAddress(): string {
  return getHexString(40)
}
