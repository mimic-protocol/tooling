// eslint-disable-next-line no-secrets/no-secrets
// This file is based on code from "The Graph Tooling" (https://github.com/graphprotocol/graph-tooling/tree/7faa3098b2e6c61f09fc81b8b2d333e66b0080d1).
// Licensed under the MIT License.
// Copyright (c) 2018 Graph Protocol, Inc. and contributors.
// Modified by Mimic Protocol, 2025.

export namespace log {
  @external('log', '_log')
  declare function _log(level: Level, msg: string): void

  export enum Level {
    CRITICAL = 0,
    ERROR = 1,
    WARNING = 2,
    INFO = 3,
    DEBUG = 4,
  }

  /**
   * Logs a critical message that terminates the execution.
   *
   * @param msg Format string like "Value = {}, other = {}".
   * @param args Format string arguments.
   */
  export function critical(msg: string, args: Array<string>): void {
    _log(Level.CRITICAL, format(msg, args))
  }

  /**
   * Logs an error message.
   *
   * @param msg Format string like "Value = {}, other = {}".
   * @param args Format string arguments.
   */
  export function error(msg: string, args: Array<string>): void {
    _log(Level.ERROR, format(msg, args))
  }

  /** Logs a warning message.
   *
   * @param msg Format string like "Value = {}, other = {}".
   * @param args Format string arguments.
   */
  export function warning(msg: string, args: Array<string>): void {
    _log(Level.WARNING, format(msg, args))
  }

  /** Logs an info message.
   *
   * @param msg Format string like "Value = {}, other = {}".
   * @param args Format string arguments.
   */
  export function info(msg: string, args: Array<string>): void {
    _log(Level.INFO, format(msg, args))
  }

  /** Logs a debug message.
   *
   * @param msg Format string like "Value = {}, other = {}".
   * @param args Format string arguments.
   */
  export function debug(msg: string, args: Array<string>): void {
    _log(Level.DEBUG, format(msg, args))
  }
}

function format(fmt: string, args: string[]): string {
  let out = ''
  let argIndex = 0
  for (let i: i32 = 0, len: i32 = fmt.length; i < len; i++) {
    if (i < len - 1 && fmt.charCodeAt(i) == 0x7b /* '{' */ && fmt.charCodeAt(i + 1) == 0x7d /* '}' */) {
      if (argIndex >= args.length) {
        throw new Error('Too few arguments for format string: ' + fmt)
      } else {
        out += args[argIndex++]
        i++
      }
    } else {
      out += fmt.charAt(i)
    }
  }
  return out
}
