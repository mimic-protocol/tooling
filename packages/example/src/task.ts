import { environment } from '@mimicprotocol/lib-ts'
import { input } from './types'

export default function main(): void {
  const firstNumber = environment.getValue()
  const firstIntent = firstNumber * input.firstStaticNumber
  environment.createIntent(firstIntent)

  const secondNumber = environment.getValue()
  const secondIntent = secondNumber * input.secondStaticNumber
  environment.createIntent(secondIntent)
}
