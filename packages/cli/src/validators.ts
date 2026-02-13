import { z } from 'zod'

const SOLIDITY_TYPE_REGEX = /^(u?int(8|16|32|64|128|256)?|bool|address|bytes([1-9]|[1-2][0-9]|3[0-2])?|string)$/
const TOKEN_TYPE_REGEX = /^(Token|TokenAmount)$/

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
export const SEM_VER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

const String = z.string().min(1)

const SolidityType = String.regex(SOLIDITY_TYPE_REGEX, 'Must be a valid solidity type')
const TokenType = String.regex(TOKEN_TYPE_REGEX, 'Must be a valid token type')
const InputType = z.union([SolidityType, TokenType])

const InputValue = z.union([InputType, z.object({ type: InputType, description: String.optional() })])

export const ManifestValidator = z.object({
  version: String.regex(SEM_VER_REGEX, 'Must be a valid semver'),
  name: String,
  description: String,
  inputs: z.record(String, InputValue),
  abis: z.record(String, String),
  metadata: z.object({
    runnerTarget: String.regex(SEM_VER_REGEX, 'Must be a valid semver'),
  }),
})
