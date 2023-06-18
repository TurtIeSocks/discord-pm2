import { REST, Routes } from 'discord.js'
import config from 'config'

import * as commands from './src/discord/commands'

const rest = new REST().setToken(config.get('discord.token'))

;(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        config.get('clientId'),
        config.get('guildId'),
      ),
      { body: [] },
    )
    await rest.put(Routes.applicationCommands(config.get('clientId')), {
      body: [],
    })

    const data = await rest.put(
      Routes.applicationGuildCommands(
        config.get('clientId'),
        config.get('guildId'),
      ),
      { body: Object.values(commands).map((cmd) => cmd.data.toJSON()) },
    )
    console.log(`Successfully registered application commands: ${data}`)
  } catch (error) {
    console.error(error)
  }
})()
