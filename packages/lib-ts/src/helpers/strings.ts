export function bytesToString(bytes: Uint8Array): string {
  return String.UTF8.decodeUnsafe(bytes.dataStart, bytes.length)
}

export function bytesToHexString(bytes: Uint8Array): string {
  let hex = '0x'
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}
