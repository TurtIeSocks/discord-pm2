import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { log } from '../../services/logger'
import { getEmbed } from '../../services/system'
import type { Command } from '../../types'

export const system: Command = {
  data: new SlashCommandBuilder()
    .setName('system')
    .setDescription('View system status')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  run: async (interaction) => {
    log.info('system command called', interaction.user.username)
    interaction.followUp({
      embeds: [getEmbed()],
    })
  },
}
