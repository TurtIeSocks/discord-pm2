import { Client, Collection } from 'discord.js'
import config from 'config'

import * as events from './events'
import * as commands from './commands'

export async function startDiscord() {
  const client = new Client({
    intents: ['GuildMessages', 'GuildMembers', 'Guilds', 'DirectMessages'],
  })

  await client.login(config.get('token'))

  client.ctx = {
    commands: new Collection(),
  }

  Object.values(commands).forEach((command) => {
    client.ctx.commands.set(command.data.name, command)
  })
  Object.values(events).forEach((event) => {
    event(client)
  })

  return client
}
