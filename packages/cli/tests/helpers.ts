import { runCommand } from '@oclif/test'
import { expect } from 'chai'

export const itThrowsACliError = (command: string[], message: string, code?: string, suggestionsLen?: number) => {
  it('throws an error', async () => {
    const { error } = await runCommand(command)
    expect(error?.message).to.contain(message)
    if (code) expect(error?.code).to.be.equal(code)
    if (suggestionsLen) expect(error?.suggestions?.length).to.be.equal(suggestionsLen)
  })
}
