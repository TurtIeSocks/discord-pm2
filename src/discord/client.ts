import { Client, Collection } from 'discord.js'
import config from 'config'

import * as events from './events'
import * as commands from './commands'
import { getMonitorChannel } from './utils'

export const startDiscord = async () => {
  const client = new Client({
    intents: ['GuildMessages', 'GuildMembers', 'Guilds', 'DirectMessages'],
  })

  Object.values(events).forEach((event) => event(client))

  await client.login(config.get('token'))

  client.ctx = {
    commands: new Collection(
      Object.values(commands).map((command) => [command.data.name, command]),
    ),
    monitor: {
      messages: new Collection(),
      channel: await getMonitorChannel(client),
      interval: null,
    },
  }

  return client
}
