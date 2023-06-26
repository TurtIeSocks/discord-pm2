import { Client, Events, Interaction } from 'discord.js'

import { HELPERS, log } from '../../services/logger'

export const interaction = async (client: Client): Promise<void> => {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    const isModalSubmit = interaction.isModalSubmit()
    const isAutocomplete = interaction.isAutocomplete()
    const isCommand = interaction.isCommand()
    const isButton = interaction.isButton()
    const name = isModalSubmit
      ? interaction.customId
      : isAutocomplete || isCommand
      ? interaction.commandName
      : isButton
      ? interaction.customId.split('-')[0]
      : 'unknown'

    if (!isAutocomplete) {
      await interaction.deferReply({ ephemeral: true })
    }
    log.debug({ name, isModalSubmit, isAutocomplete, isCommand })
    const command = interaction.client.ctx.commands.get(name)
    try {
      if (!command) throw new Error(`Command not found`)
      if (isCommand) {
        await command.run(interaction)
      } else if (isModalSubmit) {
        if (command.modal) await command.modal(interaction)
      } else if (isAutocomplete) {
        if (command.autoComplete) await command.autoComplete(interaction)
      } else if (isButton) {
        if (command.button) await command.button(interaction)
      }
      log.info(
        HELPERS.discord,
        name,
        interaction.user.tag,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
      )
    } catch (err) {
      log.error(
        HELPERS.discord,
        name,
        interaction.user.username,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
        err,
      )
      if (isAutocomplete) {
        await interaction.respond([])
      } else {
        await interaction.followUp(`An error has occurred with input: ${name}`)
      }
    }
  })
}
