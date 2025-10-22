import { Address, BigInt, environment, TriggerType } from '@mimicprotocol/lib-ts'

import { TransferEvent } from './types/ERC20'

const SENDER_ADDRESS = '0xdd4c30aa2f3284e462df0b45c99a7e6e9ea9d186'
const RECEIVER_ADDRESS = '0x15539788fec3ed2871ddc51425f9a7050380f564'
const AMOUNT = '1000000'

export default function main(): void {
  const context = environment.getContext()
  const type = context.trigger.type
  if (type !== TriggerType.EVENT) throw new Error('Trigger type is not event')

  const eventTrigger = context.trigger.getEventData()
  const transferEvent = TransferEvent.decode(eventTrigger.topics, eventTrigger.eventData)

  if (!transferEvent.from.equals(Address.fromString(SENDER_ADDRESS))) throw new Error('Sender address does not match')
  if (!transferEvent.to.equals(Address.fromString(RECEIVER_ADDRESS))) throw new Error('Receiver address does not match')
  if (!transferEvent.value.equals(BigInt.fromString(AMOUNT))) throw new Error('Amount does not match')
}
