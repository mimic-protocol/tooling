import { runCommand } from '@oclif/test'
import { expect } from 'chai'

import { AbiItem } from '../src/lib/AbisInterfaceGenerator/types'
import { AbiParameter } from '../src/types'

export const itThrowsACliError = (command: string[], message: string, code?: string, suggestionsLen?: number) => {
  it('throws an error', async () => {
    const { error } = await runCommand(command)
    expect(error?.message).to.contain(message)
    if (code) expect(error?.code).to.be.equal(code)
    if (suggestionsLen) expect(error?.suggestions?.length).to.be.equal(suggestionsLen)
  })
}

function createAbiFunctionItem(
  name: string,
  inputs: AbiParameter[],
  outputs: AbiParameter[],
  stateMutability: string
): AbiItem {
  return {
    type: 'function',
    name,
    inputs,
    outputs,
    stateMutability,
  }
}

export const createViewFunction = (name: string, inputs: AbiParameter[] = [], outputs: AbiParameter[] = []) =>
  createAbiFunctionItem(name, inputs, outputs, 'view')

export const createPureFunction = (name: string, inputs: AbiParameter[] = [], outputs: AbiParameter[] = []) =>
  createAbiFunctionItem(name, inputs, outputs, 'pure')

export const createNonViewFunction = (name: string, inputs: AbiParameter[] = [], outputs: AbiParameter[] = []) =>
  createAbiFunctionItem(name, inputs, outputs, 'nonpayable')

export const createPayableFunction = (name: string, inputs: AbiParameter[] = [], outputs: AbiParameter[] = []) =>
  createAbiFunctionItem(name, inputs, outputs, 'payable')

export const createEvent = (name: string, inputs: (AbiParameter & { indexed?: boolean })[] = []): AbiItem => ({
  type: 'event',
  name,
  inputs,
})
