import config from 'config'
import pm2 from 'pm2'
import { log } from './logger.js'

export const PROCESS_INPUTS = [
  'Start',
  'Stop',
  'Restart',
  'Reload',
  'Delete',
  'Flush',
] as const
export type ProcessInputs = Lowercase<(typeof PROCESS_INPUTS)[number]>

export const GENERAL_INPUTS = ['List', 'Dump', 'ReloadLogs'] as const
export type GeneralInputs = Lowercase<(typeof GENERAL_INPUTS)[number]>

export type Inputs = ProcessInputs | GeneralInputs

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
  pmx_module?: boolean
  version?: string
  /** PM2 namespace tag (default `'default'`, customizable via `namespace` start option) */
  namespace?: string
}

export interface Process {
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
  module: boolean
  namespace: string
  pmId: number | undefined
  pid: number | undefined
}

/**
 * Maps a raw `pm2.ProcessDescription` into the project's flat `Process` shape.
 * Extracted so both `getProcessList` (via `pm2.list`) and `getProcess` (via
 * `pm2.describe`) share identical normalization.
 */
const toProcess = (description: pm2.ProcessDescription): Process => {
  const pm2Env = description.pm2_env as PM2Env
  const name = description.name || 'Unknown Process'
  return {
    name,
    cpu: description.monit?.cpu || 0,
    memory: description.monit?.memory || 0,
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
    module: pm2Env?.pmx_module || false,
    namespace: pm2Env?.namespace || 'default',
    pmId: description.pm_id,
    pid: description.pid,
  }
}

const shouldKeep = (process: Process): boolean =>
  !config.get('ignoreModules') || !process.module

/**
 * Equivalent to `pm2 ls`
 * @returns list of processes
 * @throws Error on pm2 failure
 */
export const getProcessList = async (): Promise<Process[]> => {
  return new Promise((resolve, reject) => {
    pm2.list((err, processDescriptionList) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      // Dedupe by name — clustered apps appear once per instance; first wins.
      const seen = new Map<string, Process>()
      for (const description of processDescriptionList) {
        const proc = toProcess(description)
        if (!seen.has(proc.name)) seen.set(proc.name, proc)
      }
      return resolve(Array.from(seen.values()).filter(shouldKeep))
    })
  })
}

/**
 * Look up a single process by name via `pm2.describe` (v7 API). Avoids the
 * wasteful `list().find()` round-trip for one-process queries. Returns the
 * first instance when the process is clustered.
 * @param name name of the process you wish to get
 * @returns get info for a single process
 * @throws Error on pm2 failure
 */
export const getProcess = async (
  name: string,
): Promise<Process | undefined> => {
  return new Promise((resolve, reject) => {
    pm2.describe(name, (err, descriptions) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      if (!descriptions || descriptions.length === 0) {
        return resolve(undefined)
      }
      const proc = toProcess(descriptions[0])
      return resolve(shouldKeep(proc) ? proc : undefined)
    })
  })
}

/**
 * Execute some of the common PM2 commands
 * @param command Valid PM2 commands, excluding reload
 * @param name name of the process to execute the command on
 * @returns formatted string describing what was done
 * @throws Error on pm2 failure or missing name
 */
export const executeCommon = async (
  command: Exclude<ProcessInputs, 'reload'>,
  name?: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    log.info(`Executing ${command} ${name}`)
    if (!name) {
      return reject(new Error('No process name provided'))
    }
    pm2[command](name, (err) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      return resolve(`${PAST_TENSE_MAP[command]} ${name}`)
    })
  })
}

/**
 * Execute reload, since the callback is slightly different than the rest
 * @param name name of the process to execute the command on
 * @returns formatted string describing what was done
 * @throws Error on pm2 failure or missing name
 */
export const executeReload = (name?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!name) {
      return reject(new Error('No process name provided'))
    }
    pm2.reload(name, { updateEnv: true }, (err) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      return resolve(`Reloaded ${name}`)
    })
  })
}

/**
 * Saves the current process list to `~/.pm2/dump.pm2` so it can be restored
 * with `pm2 resurrect` after a host reboot (equivalent to `pm2 save`).
 * @returns success message
 * @throws Error on pm2 failure
 */
export const executeDump = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    log.info('Executing pm2 dump')
    pm2.dump((err) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      return resolve('Process list dumped to disk')
    })
  })
}

/**
 * Rotates pm2's log files (equivalent to `pm2 reloadLogs`). Useful when the
 * host's log-rotation tool has just renamed the current log file and pm2
 * still holds the old file handle.
 * @returns success message
 * @throws Error on pm2 failure
 */
export const executeReloadLogs = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    log.info('Executing pm2 reloadLogs')
    pm2.reloadLogs((err) => {
      if (err) {
        log.error(err)
        return reject(err)
      }
      return resolve('Logs reloaded')
    })
  })
}
