import { environment } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const firstNumber = environment.getValue()
  const firstIntent = firstNumber * 2
  environment.createIntent(firstIntent)

  const secondNumber = environment.getValue()
  const secondIntent = secondNumber * 3
  environment.createIntent(secondIntent)
}
