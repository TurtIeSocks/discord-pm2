import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'

import type { Command } from '../../types'
import {
  ProcessInputs,
  executeCommon,
  updateAll,
  updateMonitor,
} from '../../services/pm2'
import { clearMonitorChannel } from '../utils'

export const monitor: Command = {
  data: new SlashCommandBuilder()
    .setName('monitor')
    .setDescription('Toggles the PM2 Live Monitor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription('Start the monitor')
        .addNumberOption((option) =>
          option
            .setName('interval')
            .setDescription('Set the interval in minutes, defaults to 1')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('update').setDescription('Force an early refresh'),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('stop').setDescription('Stop the monitor'),
    ),

  button: async (interaction) => {
    const [, command, name] = interaction.customId.split('-') as [
      string,
      Exclude<ProcessInputs, 'reload'>,
      string,
    ]
    if (!command || !name) {
      await interaction.followUp('Invalid command')
      return
    }
    const response = await executeCommon(command, name)
    await updateMonitor(interaction.client, name)
    await interaction.followUp(
      typeof response === 'string' ? response : response.message,
    )
    if (typeof response === 'string') {
      await interaction.deleteReply()
    }
  },
  run: async (interaction) => {
    if (interaction instanceof ChatInputCommandInteraction) {
      const action = interaction.options.getSubcommand()
      if (action === 'stop') {
        if (interaction.client.ctx.monitor.interval) {
          clearInterval(interaction.client.ctx.monitor.interval)
          interaction.client.ctx.monitor.interval = null
        }
        await clearMonitorChannel(interaction.client)
        await interaction.followUp('Monitor stopped')
      } else if (action === 'start') {
        const interval = interaction.options.get('interval')?.value as
          | number
          | undefined
        await clearMonitorChannel(interaction.client)
        await updateAll(interaction.client)
        interaction.client.ctx.monitor.interval = setInterval(
          () => updateAll(interaction.client),
          1000 * 60 * (interval || 1),
        )
        await interaction.followUp('Monitor started')
      } else {
        await updateAll(interaction.client)
        await interaction.followUp('Monitor updated')
      }
      await interaction.deleteReply()
    }
  },
}
