import { BigInt, environment } from '@mimicprotocol/lib-ts'
import { TriggerType } from '@mimicprotocol/lib-ts/src/types/TriggerType'

export default function main(): void {
  const context = environment.getContext()
  const type = context.trigger.type
  if (type !== TriggerType.CRON) throw new Error('Trigger type is not cron')

  const cronTrigger = context.trigger.getCronData()
  const isEqual = cronTrigger.equals(BigInt.fromU64(context.timestamp))

  if (!isEqual) throw new Error('Cron trigger does not match')
}
