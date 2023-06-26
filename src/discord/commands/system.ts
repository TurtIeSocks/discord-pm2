import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import type { Command } from '../../types'
import { log } from '../../services/logger'
import { getEmbed } from '../../services/system'

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
