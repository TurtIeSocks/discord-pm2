import { Client, Events, Interaction } from 'discord.js'

import { HELPERS, log } from '../../services/logger'

export function interaction(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    const isModalSubmit = interaction.isModalSubmit()
    const isAutocomplete = interaction.isAutocomplete()
    const isCommand = interaction.isCommand()
    const name = isModalSubmit
      ? interaction.customId
      : isAutocomplete || isCommand
      ? interaction.commandName
      : 'Unknown'

    try {
      if (isCommand) {
        const command = interaction.client.ctx.commands.get(name)
        if (!command) throw new Error(`Command not found`)
        await command.run(interaction)
      } else if (isModalSubmit) {
        const command = interaction.client.ctx.commands.get(name)
        if (!command) throw new Error(`Modal submit not found`)
        if (command.modal) await command.modal(interaction)
      } else if (isAutocomplete) {
        const command = interaction.client.ctx.commands.get(name)
        if (!command) throw new Error(`Autocomplete not found`)
        if (command.autoComplete) await command.autoComplete(interaction)
      }
      log.info(
        HELPERS.discord,
        name,
        interaction.user.tag,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
      )
    } catch (error) {
      log.error(
        HELPERS.discord,
        name,
        interaction.user.tag,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
        error,
      )
      if (isModalSubmit || isCommand) {
        await interaction.followUp(`An error has occurred with input: ${name}`)
      }
    }
  })
}
