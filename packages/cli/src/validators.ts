import { z } from 'zod'

const String = z.string().min(1)

const VERSION_REGEX = /\d+.\d+.\d+/gm

export const ManifestValidator = z.object({
  version: String.regex(VERSION_REGEX, 'Must be a valid semver'),
  name: String,
  description: String.optional(),
  inputs: z.record(String, String.or(z.number())),
  abis: z.record(String, String),
})
