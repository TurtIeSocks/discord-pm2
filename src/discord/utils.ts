import config from 'config'
import type { Client } from 'discord.js'
import { HELPERS, log } from '../services/logger.js'

/**
 * @param client Discord.js Client
 * @returns the channel that the monitor embeds will be sent in, if found
 */
export const getMonitorChannel = async (client: Client) => {
  const monitorChannel = config.get<string | undefined>('monitorChannel')
  if (!monitorChannel) {
    log.warn(HELPERS.discord, 'No monitor channel set')
    return null
  }
  const guild = await client.guilds.fetch(config.get('guildId'))
  if (!guild) {
    log.error(HELPERS.discord, 'Guild not found')
    return null
  }
  const channel = await guild.channels.fetch(monitorChannel)
  if (!channel) {
    log.error(HELPERS.discord, 'Monitor channel not found')
    return null
  }
  if (!channel.isTextBased() || !channel.isSendable()) {
    log.error(HELPERS.discord, 'Monitor channel not text-based or not sendable')
    return null
  }
  return channel
}

/**
 * Cleans the monitor channel of previous messages from the bot. Uses
 * `bulkDelete` for messages < 14 days old; falls back to individual deletes
 * for older ones (Discord disallows bulkDelete past 14 days).
 */
export const clearMonitorChannel = async (client: Client) => {
  if (!client.ctx.monitor.channel) return
  try {
    const channel = client.ctx.monitor.channel
    const messages = await channel.messages.fetch({ limit: 100 })
    const own = messages.filter((m) => m.author.id === client.user?.id)
    if (own.size === 0) {
      client.ctx.monitor.messages.clear()
      return
    }
    log.info(HELPERS.discord, 'Deleting', own.size, 'messages')

    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
    const recent = own.filter((m) => m.createdTimestamp > fourteenDaysAgo)
    const old = own.filter((m) => m.createdTimestamp <= fourteenDaysAgo)

    if (recent.size > 0 && 'bulkDelete' in channel) {
      await channel.bulkDelete(recent, true)
    }
    if (old.size > 0) {
      await Promise.all(old.map((m) => m.delete()))
    }
    client.ctx.monitor.messages.clear()
  } catch (err) {
    log.error(HELPERS.discord, 'Error deleting messages', err)
  }
}

/**
 * Deletes a monitor message and removes it from the cache if the process was removed
 * @param client Discord.js Client
 * @param process name of the process to remove
 */
export const deleteMonitor = async (client: Client, process: string) => {
  const message = client.ctx.monitor.messages.get(process)
  if (message) {
    await message.delete().catch(() => {
      /* message may already be deleted */
    })
    client.ctx.monitor.messages.delete(process)
  }
}
