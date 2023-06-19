import { REST, Routes } from 'discord.js'
import config from 'config'

import * as commands from './commands'

interface CommandType {
  id: string
  application_id: string
  version: string
  default_member_permissions: string
  type: number
  name: string
  name_localizations: null
  description: string
  description_localizations: null
  guild_id: string
  nsfw: boolean
}

export const register = async () => {
  if (process.env.NODE_ENV === 'development') return

  const rest = new REST().setToken(config.get('token'))

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        config.get('clientId'),
        config.get('guildId'),
      ),
      { body: [] },
    )
    const data = (await rest.put(
      Routes.applicationGuildCommands(
        config.get('clientId'),
        config.get('guildId'),
      ),
      { body: Object.values(commands).map((cmd) => cmd.data.toJSON()) },
    )) as CommandType[]
    console.log(
      `Successfully registered application commands: ${data
        .map((cmd) => cmd.name)
        .join(', ')}`,
    )
  } catch (error) {
    console.error(error)
  }
}

if (require.main === module) {
  console.log('Registering application commands')
  register()
}
