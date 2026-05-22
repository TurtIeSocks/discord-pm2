import config from 'config'
import { Client, Collection } from 'discord.js'
import pm2 from 'pm2'
import { HELPERS, log } from '../services/logger.js'
import * as commands from './commands/index.js'
import * as events from './events/index.js'
import { getMonitorChannel } from './utils.js'

export const startDiscord = async () => {
  const client = new Client({
    intents: ['Guilds', 'GuildMessages'],
  })

  client.ctx = {
    commands: new Collection(
      Object.values(commands).map((command) => [command.data.name, command]),
    ),
    monitor: {
      messages: new Collection(),
      channel: null,
      interval: null,
    },
  }

  const eventHandlers = Object.values(events) as Array<
    (c: Client) => void | Promise<void>
  >
  for (const event of eventHandlers) {
    event(client)
  }

  await client.login(config.get('token'))

  client.ctx.monitor.channel = await getMonitorChannel(client)

  const shutdown = (signal: NodeJS.Signals) => {
    log.info(HELPERS.discord, `Received ${signal}, shutting down`)
    if (client.ctx.monitor.interval) {
      clearInterval(client.ctx.monitor.interval)
      client.ctx.monitor.interval = null
    }
    try {
      pm2.disconnect()
    } catch (err) {
      log.error(HELPERS.discord, 'pm2.disconnect error', err)
    }
    client
      .destroy()
      .catch((err) => log.error(HELPERS.discord, 'client.destroy error', err))
      .finally(() => process.exit(0))
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  return client
}
