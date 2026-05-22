import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { executeCommon, type ProcessInputs } from '../../services/pm2.js'
import type { Command } from '../../types.js'
import { CUSTOM_ID_DELIMITER } from '../embeds/process.js'
import { updateAll, updateMonitor } from '../monitor.js'
import { clearMonitorChannel } from '../utils.js'

const MIN_INTERVAL_MINUTES = 0.25

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
            .setDescription(
              `Interval in minutes (default 1, min ${MIN_INTERVAL_MINUTES})`,
            )
            .setMinValue(MIN_INTERVAL_MINUTES)
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
    const parts = interaction.customId.split(CUSTOM_ID_DELIMITER)
    const [, command, ...nameParts] = parts
    const name = nameParts.join(CUSTOM_ID_DELIMITER)
    if (!command || !name) {
      await interaction.followUp('Invalid command')
      return
    }
    try {
      const message = await executeCommon(
        command as Exclude<ProcessInputs, 'reload'>,
        name,
      )
      await updateMonitor(interaction.client, name)
      await interaction.followUp(message)
      await interaction.deleteReply()
    } catch (err) {
      await interaction.followUp((err as Error).message)
    }
  },
  run: async (interaction) => {
    const action = interaction.options.getSubcommand()
    if (action === 'stop') {
      if (interaction.client.ctx.monitor.interval) {
        clearInterval(interaction.client.ctx.monitor.interval)
        interaction.client.ctx.monitor.interval = null
      }
      await clearMonitorChannel(interaction.client)
      await interaction.followUp('Monitor stopped')
    } else if (action === 'start') {
      await clearMonitorChannel(interaction.client)
      const success = await updateAll(interaction.client)
      if (success) {
        const rawInterval = interaction.options.getNumber('interval') ?? 1
        const intervalMinutes = Math.max(MIN_INTERVAL_MINUTES, rawInterval)
        if (interaction.client.ctx.monitor.interval) {
          clearInterval(interaction.client.ctx.monitor.interval)
        }
        interaction.client.ctx.monitor.interval = setInterval(
          () => updateAll(interaction.client),
          1000 * 60 * intervalMinutes,
        )
        await interaction.followUp(
          `Monitor started (${intervalMinutes} min interval)`,
        )
      } else {
        await interaction.followUp('Monitor failed to start')
      }
    } else {
      const success = await updateAll(interaction.client)
      await interaction.followUp(
        success ? 'Monitor updated' : 'Monitor failed to update',
      )
    }
    await interaction.deleteReply()
  },
}
