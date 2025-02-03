import { ux } from '@oclif/core'
import { StandardAnsi } from '@oclif/core/lib/interfaces/theme'

const log = {
  startAction: (text: string, color?: StandardAnsi) => {
    log.stopAction()
    ux.action.start(ux.colorize(color, text))
  },

  stopAction: (text?: string) => ux.action.stop(ux.colorize('green', `${text ? `${text} ` : ''}✔️`)),

  warnText: (text: string) => ux.colorize('red', text),

  highlightText: (text: string) => ux.colorize('yellow', text),
}

export default log
