import { z } from 'zod'

const String = z.string().min(1)

const VERSION_REGEX = /\d+.\d+.\d+/gm
const TYPE_REGEX =
  /^(u?int(8|16|24|32|40|48|56|64|72|80|88|96|1(04|12|20|28|36|44|52|60|68|76|84|92)|2(00|08|16|24|32|40|48|56))?|bool|address|bytes([1-9]|[1-2][0-9]|3[0-2])?|string|float)$/

export const ManifestValidator = z.object({
  version: String.regex(VERSION_REGEX, 'Must be a valid semver'),
  name: String,
  description: String.optional(),
  inputs: z.record(String, String.regex(TYPE_REGEX, 'Must be a valid solidity type or float')),
  abis: z.record(String, String),
})
