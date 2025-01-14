/* eslint-disable @typescript-eslint/no-namespace */
import { environment } from '@mimicprotocol/lib-ts'

declare namespace input {
  const firstStaticNumber: i32
  const secondStaticNumber: i32
}
export default function main(): void {
  const firstNumber = environment.getValue()
  const firstIntent = firstNumber * input.firstStaticNumber
  environment.createIntent(firstIntent)

  const secondNumber = environment.getValue()
  const secondIntent = secondNumber * input.secondStaticNumber
  environment.createIntent(secondIntent)
}
