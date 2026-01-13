import { ux } from '@oclif/core'
import { StandardAnsi } from '@oclif/core/lib/interfaces/theme'

import { Logger } from './core/types'

const log = {
  startAction: (text: string, color?: StandardAnsi) => {
    log.stopAction()
    ux.action.start(ux.colorize(color, text))
  },

  stopAction: (text?: string) => ux.action.stop(ux.colorize('green', `${text ? `${text} ` : ''}✔️`)),

  warnText: (text: string) => ux.colorize('red', text),

  highlightText: (text: string) => ux.colorize('yellow', text),
}

export const coreLogger: Logger = {
  startAction: log.startAction,
  stopAction: log.stopAction,
  info: console.log,
  warn: console.warn,
  error: console.error,
  success: console.log,
}

export const defaultLogger: Logger = {
  startAction: () => {},
  stopAction: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  success: () => {},
}

export default log
