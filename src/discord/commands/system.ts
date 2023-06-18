import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import os from 'os'

import type { Command } from '../../types'
import { log } from '../../services/logger'
import {
  getFormattedCPU,
  getFormattedUptime,
  getFormattedMemory,
} from '../../services/system'

export const system: Command = {
  data: new SlashCommandBuilder()
    .setName('system')
    .setDescription('View system status')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  run: async (interaction) => {
    log.info('system command called', interaction.user.username)
    interaction.reply({
      embeds: [
        {
          title: 'System Status',
          fields: [
            {
              name: 'CPU',
              value: getFormattedCPU(),
            },
            {
              name: 'Memory',
              value: getFormattedMemory(),
            },
            {
              name: 'Uptime',
              value: getFormattedUptime(),
            },
          ],
        },
      ],
    })
  },
}
