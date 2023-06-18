import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import pm2 from 'pm2'

import type { Command } from '../../types'
import { log } from '../../services/logger'

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
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription(
          'Enter the name of the PM2 process, leave blank for all',
        )
        .setRequired(false)
        .setAutocomplete(true),
    ),
  autoComplete: async (interaction) => {
    const focusedOption = interaction.options.getFocused(true)

    if (focusedOption?.name === 'command') {
      await interaction.respond([
        { name: 'start', value: 'start' },
        { name: 'stop', value: 'stop' },
        { name: 'restart', value: 'restart' },
        { name: 'flush', value: 'flush' },
        { name: 'list', value: 'list' },
      ])
    } else if (focusedOption?.name === 'name') {
      pm2.list(async (err, processDescriptionList) => {
        if (err) {
          log.error(err)
        } else {
          await interaction.respond(
            processDescriptionList.map((process) => ({
              name: process.name || '',
              value: process.name || '',
            })),
          )
        }
      })
    }
  },
  run: async (interaction) => {
    const rawCommand = interaction.options.get('command', true)
    const command = rawCommand.value as
      | 'start'
      | 'stop'
      | 'restart'
      | 'flush'
      | 'list'
    const name = (interaction.options.get('name')?.value || 'all') as string

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
              embeds: processList.map((process) => ({
                title: `${process.name} - ${process.pm2_env?.status}`,
                fields: [
                  {
                    name: 'CPU',
                    value: `${process.monit?.cpu}%`,
                  },
                  {
                    name: 'Memory',
                    value: `${((process.monit?.memory || 0) / 1024 / 1024).toFixed(2)}MB`,
                  },
                ]
              }))
            })
          }
        } )
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
