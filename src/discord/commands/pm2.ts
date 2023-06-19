import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import pm2 from 'pm2'

import type { Command } from '../../types'
import { log } from '../../services/logger'
import {
  formatMemory,
  getFormattedCPU,
  getFormattedUptime,
} from '../../services/system'

export const pm2Command: Command = {
  data: new SlashCommandBuilder()
    .setName('pm2')
    .setDescription('Execute PM2 commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('command')
        .setRequired(true)
        .setDescription('Choose the command to execute')
        .addChoices(
          { name: 'Start', value: 'start' },
          { name: 'Stop', value: 'stop' },
          { name: 'Restart', value: 'restart' },
          { name: 'Flush', value: 'flush' },
          { name: 'List', value: 'list' },
        ),
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription(
          'Enter the name of the PM2 process',
        )
        .setRequired(false)
        .setAutocomplete(true),
    ),
  autoComplete: async (interaction) => {
    pm2.list(async (err, processDescriptionList) => {
      if (err) {
        log.error(err)
      } else {
        await interaction.respond([
          { name: 'all', value: 'all' },
          ...processDescriptionList.map((process) => ({
            name: process.name || '',
            value: process.name || '',
          })),
        ])
      }
    })
  },
  run: async (interaction) => {
    const rawCommand = interaction.options.get('command', true)
    const command = rawCommand.value as
      | 'start'
      | 'stop'
      | 'restart'
      | 'flush'
      | 'list'
    const name = interaction.options.get('name')?.value as string

    if (command && name) {
      if (command === 'list') {
        pm2.list((err, processList) => {
          if (err) {
            log.error(err)
            interaction.reply({
              content: `Error: ${err.message}`,
              ephemeral: true,
            })
          } else {
            interaction.reply({
              embeds: processList.map((process) => {
                return {
                  title: `${process.name} - ${process.pm2_env?.status}`,
                  fields: [
                    {
                      name: 'CPU',
                      value: getFormattedCPU(process.monit?.cpu || 0),
                    },
                    {
                      name: 'Memory',
                      value: formatMemory(process.monit?.memory || 0),
                    },
                    {
                      name: 'Uptime',
                      value: getFormattedUptime(
                        process.pm2_env?.pm_uptime &&
                          process.pm2_env?.status === 'online'
                          ? (Date.now() - process.pm2_env?.pm_uptime) / 1000
                          : 0,
                      ),
                    },
                  ],
                }
              }),
            })
          }
        })
      } else {
        pm2[command](name, (err, _) => {
          if (err) {
            log.error(err)
            interaction.reply({
              content: `Error: ${err.message}`,
              ephemeral: true,
            })
          } else {
            log.info(`PM2 ${command}ed ${name}`, interaction.user.username)
            interaction.reply({
              content: `${command}${command === 'stop' ? 'p' : ''}ed ${name} `,
              ephemeral: true,
            })
          }
        })
      }
    }
  },
}
