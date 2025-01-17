import { z } from 'zod'

const Version = z.custom<string>((value) => new RegExp(/\d+.\d+.\d+/gm).test(value), 'Must be a valid version (x.y.z)')

const cronRegex = /((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/g
const deltaRegex = /\d+(s|m|h)/g

const CronTrigger = z.object({
  type: z.literal('cron'),
  schedule: z.string().regex(cronRegex, 'Invalid Schedule'),
  delta: z.string().regex(deltaRegex, 'Invalid Delta'),
})

export const ManifestValidator = z.object({
  version: Version,
  name: z.string(),
  trigger: CronTrigger,
  inputs: z.record(z.string(), z.string().or(z.number())),
  abis: z.record(z.string(), z.string()),
})

export type Manifest = z.infer<typeof ManifestValidator>
