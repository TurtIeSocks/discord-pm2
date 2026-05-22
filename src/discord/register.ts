import { fileURLToPath } from 'node:url'
import config from 'config'
import {
  REST,
  type RESTPostAPIApplicationCommandsResult,
  Routes,
} from 'discord.js'

import * as commands from './commands/index.js'

export const register = async () => {
  if (process.env.NODE_ENV === 'development') return

  const rest = new REST().setToken(config.get('token'))

  try {
    const data = (await rest.put(
      Routes.applicationGuildCommands(
        config.get('clientId'),
        config.get('guildId'),
      ),
      { body: Object.values(commands).map((cmd) => cmd.data.toJSON()) },
    )) as RESTPostAPIApplicationCommandsResult[]
    console.log(
      `Successfully registered application commands: ${data
        .map((cmd) => cmd.name)
        .join(', ')}`,
    )
  } catch (error) {
    console.error(error)
  }
}

const entry = process.argv[1]
if (entry && fileURLToPath(import.meta.url) === entry) {
  console.log('Registering application commands')
  register()
}
