import { Client, Events, Interaction } from 'discord.js'

import { HELPERS, log } from '../../services/logger'

export function interaction(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isCommand()) {
      const command = interaction.client.ctx.commands.get(
        interaction.commandName,
      )
      if (!command) {
        interaction.followUp(
          `An error has occurred with input: ${interaction.commandName}`,
        )
        return
      }

      log.info(
        HELPERS.discord,
        interaction.commandName,
        interaction.user.tag,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
      )
      await command.run(interaction)
    } else if (interaction.isModalSubmit()) {
      const command = interaction.client.ctx.commands.get(interaction.customId)
      if (!command) {
        interaction.followUp(
          `An error has occurred with input: ${interaction.customId}`,
        )
        return
      }

      log.info(
        HELPERS.discord,
        interaction.customId,
        interaction.user.tag,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
      )
      if (command.modal) await command.modal(interaction)
    } else if (interaction.isAutocomplete()) {
      const command = interaction.client.ctx.commands.get(
        interaction.commandName,
      )
      if (!command) {
        log.error(
          HELPERS.discord,
          `No command matching ${interaction.commandName} was found.`,
        )
        return
      }

      try {
        if (command.autoComplete) await command.autoComplete(interaction)
      } catch (error) {
        log.error(
          HELPERS.discord,
          interaction.commandName,
          interaction.user.tag,
          interaction.guild?.name ?? interaction.guildId ?? 'DM',
          error,
        )
      }
    }
  })
}
