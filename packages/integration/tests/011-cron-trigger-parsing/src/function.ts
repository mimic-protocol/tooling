import { BigInt, environment } from '@mimicprotocol/lib-ts'
import { ConfigType } from '@mimicprotocol/lib-ts/src/types/ConfigType'

export default function main(): void {
  const context = environment.getContext()
  const type = context.config.type
  if (type !== ConfigType.CRON) throw new Error('Config type is not cron')

  const cronTrigger = context.config.getCronData()
  const isEqual = cronTrigger.equals(BigInt.fromU64(context.timestamp))

  if (!isEqual) throw new Error('Cron trigger does not match')
}
