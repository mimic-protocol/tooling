import { z } from 'zod'

const String = z.string().min(1)

const VERSION_REGEX = /\d+.\d+.\d+/gm
const SOLIDITY_TYPE_REGEX = /^(u?int(8|16|32|64|128|256)?|bool|address|bytes([1-9]|[1-2][0-9]|3[0-2])?|string)$/

export const ManifestValidator = z.object({
  version: String.regex(VERSION_REGEX, 'Must be a valid semver'),
  libVersion: String.regex(VERSION_REGEX, 'Must be a valid semver'),
  name: String,
  description: String.optional(),
  inputs: z.record(String, String.regex(SOLIDITY_TYPE_REGEX, 'Must be a valid solidity type')),
  abis: z.record(String, String),
})
