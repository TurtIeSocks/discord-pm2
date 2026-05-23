import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { log } from '../../services/logger.js'
import { getEmbed } from '../../services/system.js'
import type { Command } from '../../types.js'

export const system: Command = {
  data: new SlashCommandBuilder()
    .setName('system')
    .setDescription('View system status')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  run: async (interaction) => {
    log.info('system command called', interaction.user.tag)
    await interaction.followUp({
      embeds: [getEmbed()],
    })
  },
}
