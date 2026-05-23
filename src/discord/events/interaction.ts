import { type Client, Events, type Interaction, MessageFlags } from 'discord.js'

import { HELPERS, log } from '../../services/logger.js'
import { CUSTOM_ID_DELIMITER } from '../embeds/process.js'

export const interaction = async (client: Client): Promise<void> => {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    const isModalSubmit = interaction.isModalSubmit()
    const isAutocomplete = interaction.isAutocomplete()
    const isChatInput = interaction.isChatInputCommand()
    const isButton = interaction.isButton()
    const name = isModalSubmit
      ? interaction.customId
      : isAutocomplete || isChatInput
        ? interaction.commandName
        : isButton
          ? interaction.customId.split(CUSTOM_ID_DELIMITER)[0]
          : 'unknown'

    if (!isAutocomplete) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    }
    log.debug({ name, isModalSubmit, isAutocomplete, isChatInput, isButton })
    const command = interaction.client.ctx.commands.get(name)
    try {
      if (!command) throw new Error(`Command not found: ${name}`)
      if (isChatInput) {
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
        interaction.user.tag,
        interaction.guild?.name ?? interaction.guildId ?? 'DM',
        err,
      )
      if (isAutocomplete) {
        await interaction.respond([]).catch(() => {})
      } else {
        await interaction
          .followUp(`An error has occurred with input: ${name}`)
          .catch(() => {})
      }
    }
  })
}
