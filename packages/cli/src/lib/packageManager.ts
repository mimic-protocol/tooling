import { spawnSync, SpawnSyncReturns } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const detectFromUserAgent = (): PackageManager | undefined => {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.includes('pnpm/')) return 'pnpm'
  if (ua.includes('yarn/')) return 'yarn'
  if (ua.includes('bun/')) return 'bun'
  if (ua.includes('npm/')) return 'npm'
  return undefined
}

const detectFromLockfiles = (cwd: string): PackageManager | undefined => {
  const files: Array<[PackageManager, string]> = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['npm', 'package-lock.json'],
    ['bun', 'bun.lockb'],
  ]
  for (const [pm, file] of files) {
    if (fs.existsSync(path.join(cwd, file))) return pm
  }
  return undefined
}

export const detectPackageManager = (cwd: string): PackageManager => {
  return detectFromUserAgent() || detectFromLockfiles(cwd) || 'npm'
}

export const installDependencies = (cwd: string): SpawnSyncReturns<Buffer> => {
  const pm = detectPackageManager(cwd)
  if (pm === 'npm') return spawnSync('npm', ['install', '--legacy-peer-deps'], { cwd, stdio: 'inherit' })
  if (pm === 'pnpm') return spawnSync('pnpm', ['install'], { cwd, stdio: 'inherit' })
  if (pm === 'yarn') return spawnSync('yarn', ['install'], { cwd, stdio: 'inherit' })
  if (pm === 'bun') return spawnSync('bun', ['install'], { cwd, stdio: 'inherit' })
  return spawnSync('npm', ['install', '--legacy-peer-deps'], { cwd, stdio: 'inherit' })
}

export const execBinCommand = (bin: string, args: string[], cwd: string): SpawnSyncReturns<Buffer> => {
  const localBin = path.join(cwd, 'node_modules', '.bin', bin)
  if (fs.existsSync(localBin)) {
    return spawnSync(localBin, args, { cwd, stdio: 'inherit' })
  }
  // Fallback to spawning the bin directly (global or resolved in PATH)
  return spawnSync(bin, args, { cwd, stdio: 'inherit' })
}
