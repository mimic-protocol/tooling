import { environment } from '@mimicprotocol/lib-ts'

export default function main(): void {
  const number = environment.getNumber()
  const output = number * 2
  environment.create(output)
}
