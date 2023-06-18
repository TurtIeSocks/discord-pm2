import logger from 'loglevel'
import chalk from 'chalk'
import { Client, MessageFlags } from 'discord.js'

export const log = logger.getLogger('logger')

export const HELPERS = {
  github: chalk.hex('#692886')('[GITHUB]'),
  discord: chalk.hex('#7289da')('[DISCORD]'),
}

const LOG_LEVEL_ICONS = {
  trace: chalk.gray('☭'),
  debug: chalk.green('𝜋'),
  info: chalk.blue('ℹ'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✖'),
}

log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = logger.methodFactory(methodName, logLevel, loggerName)
  return (...args) => {
    rawMethod(
      LOG_LEVEL_ICONS[methodName] ?? '',
      new Date().toISOString().split('.')[0].split('T').join(' '),
      ...args,
    )
  }
}

log.setLevel((process.env.LOG_LEVEL as logger.LogLevelDesc) || 'info')

export const logToDiscord = async (
  client: Client,
  channel: string,
  content: string,
) => {
  await client.channels.fetch(channel).then(async (channel) => {
    if (channel?.isTextBased()) {
      channel.send({ content, flags: MessageFlags.SuppressEmbeds })
    }
  })
}
