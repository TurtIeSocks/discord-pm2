import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import type { Command } from '../../types'
import {
  GENERAL_INPUTS,
  Inputs,
  PROCESS_INPUTS,
  executeCommon,
  executeReload,
  getEmbed,
  getProcessList,
} from '../../services/pm2'

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
    const processes = await getProcessList()

    if (processes instanceof Error) {
      await interaction.respond([])
    } else {
      await interaction.respond([
        { name: 'all', value: 'all' },
        ...processes.map((process) => ({
          name: process.name,
          value: process.name,
        })),
      ])
    }
  },
  run: async (interaction) => {
    const rawCommand = interaction.options.get('command', true)
    const command = rawCommand.value as Inputs
    const name = interaction.options.get('name')?.value as string | undefined

    if (command === 'list') {
      const processes = await getProcessList()
      if (processes instanceof Error) {
        await interaction.followUp({
          content: `Error: ${processes.message}`,
          ephemeral: true,
        })
      } else {
        await interaction.followUp({
          content: processes.length ? '' : 'No processes found.',
          embeds: processes.map((process) => getEmbed(process)),
        })
      }
    } else {
      const response =
        command === 'reload'
          ? await executeReload(name)
          : await executeCommon(command, name)
      await interaction.followUp({
        content: typeof response === 'string' ? response : response.message,
        ephemeral: true,
      })
    }
  },
}
