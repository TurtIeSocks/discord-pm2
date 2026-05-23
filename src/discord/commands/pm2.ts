import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'
import {
  executeCommon,
  executeDump,
  executeReload,
  executeReloadLogs,
  GENERAL_INPUTS,
  getProcessList,
  type Inputs,
  PROCESS_INPUTS,
} from '../../services/pm2.js'
import type { Command } from '../../types.js'
import { getProcessEmbed } from '../embeds/process.js'

const ephemeral = (content: string) => ({
  content,
  flags: MessageFlags.Ephemeral as const,
})

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
          ...[...PROCESS_INPUTS, ...GENERAL_INPUTS].map((input) => ({
            name: input,
            value: input.toLowerCase(),
          })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Enter the name of the PM2 process')
        .setRequired(false)
        .setAutocomplete(true),
    ),
  autoComplete: async (interaction) => {
    try {
      const processes = await getProcessList()
      await interaction.respond([
        { name: 'all', value: 'all' },
        ...processes.map((process) => ({
          name: process.name,
          value: process.name,
        })),
      ])
    } catch {
      await interaction.respond([])
    }
  },
  run: async (interaction) => {
    const command = interaction.options.getString('command', true) as Inputs
    const name = interaction.options.getString('name') ?? undefined

    try {
      if (command === 'list') {
        const processes = await getProcessList()
        await interaction.followUp({
          content: processes.length ? '' : 'No processes found.',
          embeds: processes.map((process) => getProcessEmbed(process)),
        })
        return
      }
      if (command === 'dump') {
        const message = await executeDump()
        await interaction.followUp(ephemeral(message))
        return
      }
      if (command === 'reloadlogs') {
        const message = await executeReloadLogs()
        await interaction.followUp(ephemeral(message))
        return
      }
      const message =
        command === 'reload'
          ? await executeReload(name)
          : await executeCommon(command, name)
      await interaction.followUp(ephemeral(message))
    } catch (err) {
      await interaction.followUp(ephemeral((err as Error).message))
    }
  },
}
