import { environment } from '@mimicprotocol/lib-ts'

export default function main(): void {
  // Replace this with your task code
  const firstNumber = environment.getValue()
  const firstIntent = firstNumber * 2
  environment.createIntent(firstIntent)
}
