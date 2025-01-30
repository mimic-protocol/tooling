import { ux } from '@oclif/core'

export enum COLOR {
  GREEN = '#34b233',
  RED = '#FE3756',
  BLUE = '#040090',
}

export const startAction = (text: string, color?: COLOR) => ux.action.start(ux.colorize(color, text))
export const stopAction = (text?: string) => ux.action.stop(ux.colorize(COLOR.GREEN, `${text ? `${text} ` : ''}✔️`))
export const warnText = (text: string) => ux.colorize('red', text)
export const highlightText = (text: string) => ux.colorize('yellow', text)
