import pm2 from 'pm2'
import { HELPERS, log } from './logger'
import {
  ButtonBuilder,
  type APIEmbed,
  ButtonStyle,
  ActionRowBuilder,
  Client,
  Colors,
} from 'discord.js'
import { formatMemory, getFormattedCPU, getFormattedUptime } from './system'
import { deleteMonitor } from '../discord/utils'

export const PROCESS_INPUTS = [
  'Start',
  'Stop',
  'Restart',
  'Reload',
  'Delete',
  'Flush',
] as const
export type ProcessInputs = Lowercase<(typeof PROCESS_INPUTS)[number]>

export const GENERAL_INPUTS = ['List'] as const
export type GeneralInputs = Lowercase<(typeof GENERAL_INPUTS)[number]>

export type Inputs = ProcessInputs | GeneralInputs

const BUTTON_MAP = {
  Start: ButtonStyle.Success,
  Stop: ButtonStyle.Secondary,
  Restart: ButtonStyle.Secondary,
  Reload: ButtonStyle.Primary,
  Delete: ButtonStyle.Danger,
  Flush: ButtonStyle.Primary,
  List: ButtonStyle.Primary,
} as const

const PAST_TENSE_MAP = {
  start: 'started',
  stop: 'stopped',
  restart: 'restarted',
  reload: 'reloaded',
  delete: 'deleted',
  flush: 'flushed',
  list: 'listed',
} as const

type TypeAccessor<T extends object, U extends keyof T> = Required<T>[U]

type PM2Env = Required<TypeAccessor<pm2.ProcessDescription, 'pm2_env'>> & {
  autorestart?: boolean
  max_memory_restart?: number
  exec_mode?: 'fork_mode' | 'cluster'
  // args?: string[]
  version?: string
  // versioning?: {
  //   branch?: string
  //   url?: string
  // }
}

interface Process {
  name: string
  cpu: number
  memory: number
  uptime: number
  unplannedRestarts: number
  plannedRestarts: number
  status: PM2Env['status']
  instances: PM2Env['instances']
  autorestart: boolean
  interpreter: PM2Env['exec_interpreter']
  maxMemoryRestart: number
  execMode: Exclude<PM2Env['exec_mode'], undefined> | 'Unknown'
  version: string
}

/**
 * Equivalent to `pm2 ls`
 * @returns list of processes or an error
 */
export const getProcessList = async (): Promise<Process[] | Error> => {
  return new Promise((resolve, reject) => {
    pm2.list((err, processDescriptionList) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      const processList: Process[] = processDescriptionList.map((process) => {
        const pm2Env = process.pm2_env as PM2Env
        return {
          name: process.name || 'Unknown Process',
          cpu: process.monit?.cpu || 0,
          memory: process.monit?.memory || 0,
          uptime: pm2Env?.pm_uptime || 0,
          instances: pm2Env?.instances || 0,
          unplannedRestarts: pm2Env?.unstable_restarts || 0,
          plannedRestarts: pm2Env?.restart_time || 0,
          status: pm2Env?.status || 'stopped',
          autorestart: pm2Env?.autorestart || false,
          interpreter: pm2Env?.exec_interpreter || 'Unknown',
          maxMemoryRestart: pm2Env?.max_memory_restart || 0,
          execMode: pm2Env?.exec_mode || 'Unknown',
          version: pm2Env?.version || 'Unknown',
        }
      })
      return resolve(processList)
    })
  })
}

/**
 * @param process name of the process you wish to get
 * @returns get info for a single process
 */
export const getProcess = async (
  process: string,
): Promise<Process | undefined> => {
  const processes = await getProcessList()
  if (processes instanceof Error) throw processes
  return processes.find((p) => p.name === process)
}

/**
 * Execute some of the common PM2 commands
 * @param command Valid PM2 commands, excluding reload
 * @param name name of the process to execute the command on
 * @returns a formatted string describing what was done or an error
 */
export const executeCommon = async (
  command: Exclude<ProcessInputs, 'reload'>,
  name?: string,
): Promise<string | Error> => {
  return new Promise((resolve, reject) => {
    log.info(`Executing ${command} ${name}`)
    if (name) {
      pm2[command](name, (err, _) => {
        if (err) {
          log.error(err)
          return reject(err)
        }
        return resolve(`${PAST_TENSE_MAP[command]} ${name}`)
      })
    } else {
      return reject(new Error('No process name provided'))
    }
  })
}

/**
 * Execute reload, since the callback is slightly different than the rest
 * @param name name of the process to execute the command on
 * @returns a formatted string describing what was done or an error
 */
export const executeReload = (name?: string): Promise<string | Error> => {
  return new Promise((resolve, reject) => {
    if (name) {
      pm2.reload(name, { updateEnv: true }, (err, _) => {
        if (err) {
          log.error(err)
          return reject(err)
        }
        return resolve(`Reloaded ${name} `)
      })
    } else {
      return reject(new Error('No process name provided'))
    }
  })
}

/**
 * Returns a discord embed
 * @param process
 * @returns Discord API Embed
 */
export const getEmbed = (process: Process): APIEmbed => {
  return {
    color: process.status === 'online' ? Colors.Green : Colors.Red,
    title: `${process.name} - ${process.version}`,
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
    ],
    image: {
      url: 'https://i.stack.imgur.com/Fzh0w.png',
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Builds a row of buttons for each process
 * @param process
 * @param id used to uniquely identify the buttons when they're executed
 * @returns Discord API Action Row
 */
export const getButtons = (process: Process, id = '') => {
  const buttons = PROCESS_INPUTS.filter((input) => input !== 'Reload').map(
    (input) =>
      new ButtonBuilder()
        .setCustomId(
          `${id ? `${id}-` : ''}${input.toLowerCase()}-${process.name}`,
        )
        .setLabel(input)
        .setStyle(BUTTON_MAP[input]),
  )
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)
  return row
}

/**
 * Updates the monitor message with the latest information
 * @param client Discord.js Client
 * @param process the process object or name of the process to update
 * @returns a reference to the message or undefined if it doesn't exist or was deleted
 */
export const updateMonitor = async (
  client: Client,
  process: Process | string,
) => {
  const foundProcess =
    typeof process === 'string' ? await getProcess(process) : process
  if (!foundProcess) {
    if (typeof process === 'string') {
      await deleteMonitor(client, process)
    }
    return
  }
  const message = client.ctx.monitor.messages.get(foundProcess.name)

  if (message) {
    return await message.edit({
      embeds: [getEmbed(foundProcess)],
      components: [getButtons(foundProcess, 'monitor')],
    })
  } else if (client.ctx.monitor.channel) {
    const message = await client.ctx.monitor.channel.send({
      embeds: [getEmbed(foundProcess)],
      components: [getButtons(foundProcess, 'monitor')],
    })
    client.ctx.monitor.messages.set(foundProcess.name, message)
    return message
  }
}

/**
 * Updates all of the monitors
 * @param client Discord.js Client
 * @returns references to the updated messages
 */
export const updateAll = async (client: Client) => {
  try {
    const processes = await getProcessList()
    if (processes instanceof Error) {
      throw processes
    }
    log.info(HELPERS.discord, 'Updating monitor')
    return await Promise.all(
      processes.map(async (process) => updateMonitor(client, process)),
    )
  } catch (err) {
    log.error(err)
  }
}
