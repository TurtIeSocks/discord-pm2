import config from 'config'
import { Client } from 'discord.js'
import { HELPERS, log } from '../services/logger'

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
    log.error(HELPERS.discord, 'Monitor channel not found or not text based')
    return null
  }
  if (!channel.isTextBased()) {
    log.error(HELPERS.discord, 'Monitor channel not text based')
    return null
  }
  return channel
}

/**
 * Cleans the monitor channel of previous messages from the bot
 * @param client Discord.js Client
 * @returns void
 */
export const clearMonitorChannel = async (client: Client) => {
  if (!client.ctx.monitor.channel) return
  try {
    const messages = await client.ctx.monitor.channel.messages.fetch({
      limit: 100,
    })
    const filtered = messages.filter(
      (message) => message.author.id === client.user?.id,
    )
    log.info(HELPERS.discord, 'Deleting', filtered.size, 'messages')

    await Promise.all(filtered.mapValues((message) => message.delete()))
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
    await message.delete()
    client.ctx.monitor.messages.delete(process)
  }
}
