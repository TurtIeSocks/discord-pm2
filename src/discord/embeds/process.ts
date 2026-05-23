import {
  ActionRowBuilder,
  type APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  Colors,
} from 'discord.js'
import type { Process } from '../../services/pm2.js'
import { PROCESS_INPUTS } from '../../services/pm2.js'
import {
  formatMemory,
  getFormattedCPU,
  getFormattedUptime,
} from '../../services/system.js'

/**
 * Delimiter used in button customId payloads. Colon is safe because PM2
 * process names cannot contain colons.
 */
export const CUSTOM_ID_DELIMITER = ':'

const BUTTON_MAP = {
  Start: ButtonStyle.Success,
  Stop: ButtonStyle.Secondary,
  Restart: ButtonStyle.Secondary,
  Reload: ButtonStyle.Primary,
  Delete: ButtonStyle.Danger,
  Flush: ButtonStyle.Primary,
  List: ButtonStyle.Primary,
} as const

/**
 * Returns a discord embed for a single PM2 process.
 * @param process
 * @returns Discord API Embed
 */
export const getProcessEmbed = (process: Process): APIEmbed => {
  return {
    color: process.status === 'online' ? Colors.Green : Colors.Red,
    title: `${process.name} - ${process.version}${
      process.module ? ' (Module)' : ''
    }`,
    fields: [
      {
        name: 'Status',
        value: process.status,
        inline: true,
      },
      {
        name: 'Instances',
        value: process.instances.toString(),
        inline: true,
      },
      {
        name: 'Exec Mode',
        value: process.execMode,
        inline: true,
      },
      {
        name: 'Uptime',
        value: getFormattedUptime(
          process.uptime && process.status === 'online'
            ? (Date.now() - process.uptime) / 1000
            : 0,
        ),
        inline: true,
      },
      {
        name: 'CPU',
        value: getFormattedCPU(process.cpu),
        inline: true,
      },
      {
        name: 'Memory',
        value: formatMemory(process.memory),
        inline: true,
      },
      {
        name: 'Max Memory',
        value: process.maxMemoryRestart
          ? formatMemory(process.maxMemoryRestart)
          : 'Unlimited',
        inline: true,
      },
      {
        name: 'Restarts',
        value: process.plannedRestarts.toString(),
        inline: true,
      },
      {
        name: 'Recoveries',
        value: process.unplannedRestarts.toString(),
        inline: true,
      },
      {
        name: 'Namespace',
        value: process.namespace,
        inline: true,
      },
      {
        name: 'PM2 ID',
        value: process.pmId !== undefined ? process.pmId.toString() : 'N/A',
        inline: true,
      },
      {
        name: 'PID',
        value: process.pid ? process.pid.toString() : 'N/A',
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a row of buttons for each process. Uses `CUSTOM_ID_DELIMITER` so
 * process names with hyphens are not truncated by the button router.
 * @param process
 * @param id used to uniquely identify the buttons when they're executed
 * @returns Discord API Action Row
 */
export const getProcessButtons = (process: Process, id = '') => {
  const buttons = PROCESS_INPUTS.filter((input) => input !== 'Reload').map(
    (input) =>
      new ButtonBuilder()
        .setCustomId(
          `${id ? `${id}${CUSTOM_ID_DELIMITER}` : ''}${input.toLowerCase()}${CUSTOM_ID_DELIMITER}${process.name}`,
        )
        .setLabel(input)
        .setStyle(BUTTON_MAP[input]),
  )
  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)
}
