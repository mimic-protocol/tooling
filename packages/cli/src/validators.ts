import { bn, isValidAddress } from '@mimic-fi/helpers'
import { z } from 'zod'

const BigInteger = z.custom<string>((value) => bn(value).toString() == value, 'Must be a valid bignumber')
const String = z.string().min(1)
const Address = String.and(z.custom<string>(isValidAddress, 'Must be a valid address'))

const cronRegex = /((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/g
const deltaRegex = /\d+(s|m|h)/g
const eventRegex = /[A-Z][a-z]*\([a-z]+[0-9]*(?:,[a-z]+[0-9]*)*\)/gm
const versionRegex = /\d+.\d+.\d+/gm

const CronTrigger = z
  .object({
    type: z.literal('cron'),
    schedule: String.regex(cronRegex, 'Invalid Schedule'),
    delta: String.regex(deltaRegex, 'Invalid Delta'),
  })
  .strict()

const EventTrigger = z
  .object({
    type: z.literal('event'),
    chainId: z.number(),
    contract: Address.optional(),
    event: String.regex(eventRegex, 'Must be a valid event'),
    delta: String.regex(deltaRegex, 'Invalid Delta'),
  })
  .strict()

const BalanceTrigger = z
  .object({
    type: z.literal('balance'),
    chainId: z.number(),
    account: Address,
    token: z.union([z.literal('native'), Address]).default('native'),
    gt: BigInteger.optional(),
    lt: BigInteger.optional(),
    delta: String.regex(deltaRegex, 'Invalid Delta'),
  })
  .strict()

const Trigger = z.discriminatedUnion('type', [EventTrigger, CronTrigger, BalanceTrigger]).superRefine((data, ctx) => {
  if (data.type == 'balance' && !data.gt && !data.lt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either gt and/or lt should be used',
      path: ['[gt/lt]'],
    })
  }
})

export const ManifestValidator = z.object({
  version: String.regex(versionRegex, 'Must be a valid version'),
  name: String,
  trigger: Trigger,
  inputs: z.record(String, String.or(z.number())),
  abis: z.record(String, String),
})
