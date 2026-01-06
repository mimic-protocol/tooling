import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { AbiItem } from '../src/lib/AbisInterfaceGenerator/types'
import { CredentialsManager } from '../src/lib/CredentialsManager'
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

// Backup existing credentials directory and remove it to start tests from a clean slate.
// Returns the backup directory path so it can be restored later.
export const backupCredentials = (credentialsManager: CredentialsManager): string | null => {
  const credDir = credentialsManager.getBaseDir()

  if (!fs.existsSync(credDir)) return null

  const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mimic-backup-'))
  fs.cpSync(credDir, backupDir, { recursive: true })
  fs.rmSync(credDir, { recursive: true, force: true })

  return backupDir
}

// Restore credentials from a previously created backup directory and clean up temp files.
export const restoreCredentials = (credentialsManager: CredentialsManager, backupDir: string | null): void => {
  const credDir = credentialsManager.getBaseDir()

  if (fs.existsSync(credDir)) {
    fs.rmSync(credDir, { recursive: true, force: true })
  }

  if (backupDir && fs.existsSync(backupDir)) {
    fs.cpSync(backupDir, credDir, { recursive: true })
    fs.rmSync(backupDir, { recursive: true, force: true })
  }
}
