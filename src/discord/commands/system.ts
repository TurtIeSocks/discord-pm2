import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import os from 'os'

import type { Command } from '../../types'
import { log } from '../../services/logger'

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
              value: `${os.cpus().length}x ${os.cpus()[0].model}`,
            },
            {
              name: 'CPU Usage',
              value: `${Math.round(os.loadavg()[0] * 100) / 100}%`,
            },
            {
              name: 'Memory',
              value: `${Math.round(
                (os.totalmem() - os.freemem()) / 1024 / 1024,
              )} MB / ${Math.round(os.totalmem() / 1024 / 1024)} MB`,
            },
            {
              name: 'Uptime',
              value: `${Math.round(os.uptime() / 60 / 60)} hours`,
            },
          ],
        },
      ],
    })
  },
}
