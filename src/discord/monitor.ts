import type { Client, Message } from 'discord.js'
import { HELPERS, log } from '../services/logger.js'
import { getProcess, getProcessList, type Process } from '../services/pm2.js'
import { getProcessButtons, getProcessEmbed } from './embeds/process.js'
import { deleteMonitor } from './utils.js'

/**
 * Per-process in-flight tracker — prevents two concurrent `updateMonitor`
 * calls from both seeing "no message exists" and posting duplicates to the
 * monitor channel.
 */
const inFlight = new Map<string, Promise<Message<true> | undefined>>()

/**
 * Updates the monitor message with the latest information. Concurrent calls
 * for the same process share a single in-flight promise to avoid duplicate
 * sends in the monitor channel.
 * @param client Discord.js Client
 * @param process the process object or name of the process to update
 * @returns reference to the message or undefined if it doesn't exist or was deleted
 */
export const updateMonitor = async (
  client: Client,
  process: Process | string,
): Promise<Message<true> | undefined> => {
  const name = typeof process === 'string' ? process : process.name
  const existing = inFlight.get(name)
  if (existing) return existing

  const task = (async () => {
    const foundProcess =
      typeof process === 'string' ? await getProcess(process) : process
    if (!foundProcess) {
      if (typeof process === 'string') {
        await deleteMonitor(client, process)
      }
      return undefined
    }
    const message = client.ctx.monitor.messages.get(foundProcess.name)

    if (message) {
      return await message.edit({
        embeds: [getProcessEmbed(foundProcess)],
        components: [getProcessButtons(foundProcess, 'monitor')],
      })
    } else if (client.ctx.monitor.channel) {
      const newMessage = await client.ctx.monitor.channel.send({
        embeds: [getProcessEmbed(foundProcess)],
        components: [getProcessButtons(foundProcess, 'monitor')],
      })
      client.ctx.monitor.messages.set(foundProcess.name, newMessage)
      return newMessage
    }
    return undefined
  })()

  inFlight.set(name, task)
  try {
    return await task
  } finally {
    inFlight.delete(name)
  }
}

/**
 * Updates all of the monitors
 * @param client Discord.js Client
 * @returns success status
 */
export const updateAll = async (client: Client): Promise<boolean> => {
  try {
    const processes = await getProcessList()
    log.info(HELPERS.discord, 'Updating monitor')
    await Promise.all(
      processes.map(async (process) => updateMonitor(client, process)),
    )
    return true
  } catch (err) {
    log.error(err)
    return false
  }
}
