import os from 'node:os'
import { type APIEmbed, Colors } from 'discord.js'

const KILOBYTE = 1024
const MEGABYTE = KILOBYTE * 1024
const GIGABYTE = MEGABYTE * 1024
const SECONDS_IN_DAY = 24 * 60 * 60
const SECONDS_IN_HOUR = 60 * 60
const SECONDS_IN_MINUTES = 60

interface CpuSnapshot {
  total: number
  idle: number
}

const snapshotCpus = (): CpuSnapshot => {
  let total = 0
  let idle = 0
  for (const cpu of os.cpus()) {
    const t = cpu.times
    total += t.user + t.nice + t.sys + t.idle + t.irq
    idle += t.idle
  }
  return { total, idle }
}

let lastSnapshot = snapshotCpus()

/**
 * Returns aggregate CPU usage across all cores in % (0-100), computed from
 * the delta in CPU times since the last call. First call after process
 * start measures usage since boot.
 */
export const getCPU = () => {
  const current = snapshotCpus()
  const totalDelta = current.total - lastSnapshot.total
  const idleDelta = current.idle - lastSnapshot.idle
  lastSnapshot = current
  if (totalDelta <= 0) return 0
  const usage = (1 - idleDelta / totalDelta) * 100
  return Math.round(usage * 100) / 100
}

/**
 * Returns a nicely formatted string of CPU usage
 * @param cpu
 */
export const getFormattedCPU = (cpu = getCPU()) => `${cpu}%`

/**
 * Returns memory usage in bytes
 */
export const getMemory = () => {
  const total = Math.round(os.totalmem())
  const free = Math.round(os.freemem())
  const used = total - free
  return { total, free, used }
}

/**
 * Nicely formatted memory usage string
 * @param memory in bytes
 */
export const formatMemory = (memory: number) => {
  if (memory >= GIGABYTE) {
    return `${(memory / GIGABYTE).toFixed(2)} GB`
  } else if (memory >= MEGABYTE) {
    return `${(memory / MEGABYTE).toFixed(2)} MB`
  } else if (memory >= KILOBYTE) {
    return `${(memory / KILOBYTE).toFixed(2)} KB`
  } else {
    return `${memory} bytes`
  }
}

/**
 * Returns a nicely formatted string of memory usage
 * @param memory
 */
export const getFormattedMemory = (memory = getMemory()) =>
  `${formatMemory(memory.used)} / ${formatMemory(memory.total)}`

/**
 * Returns a nicely formatted string of uptime
 * @param uptime in seconds
 */
export const getFormattedUptime = (uptime = os.uptime()) => {
  const days = Math.floor(uptime / SECONDS_IN_DAY)
  const hours = Math.floor((uptime % SECONDS_IN_DAY) / SECONDS_IN_HOUR)
  const minutes = Math.floor((uptime % SECONDS_IN_HOUR) / SECONDS_IN_MINUTES)
  const seconds = Math.floor(uptime % SECONDS_IN_MINUTES)

  const formatted: string[] = []
  if (days > 0) {
    formatted.push(`${days} day${days > 1 ? 's' : ''}`)
  }
  if (hours > 0) {
    formatted.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  }
  if (days === 0 && minutes > 0) {
    formatted.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
  }
  if (days === 0 && hours === 0) {
    formatted.push(`${seconds} second${seconds > 1 ? 's' : ''}`)
  }
  return formatted.join(', ')
}

/**
 * Returns a Discord embed with system stats
 */
export const getEmbed = (): APIEmbed => {
  return {
    title: 'System Status',
    color: Colors.Blurple,
    fields: [
      {
        name: 'CPU',
        value: getFormattedCPU(),
      },
      {
        name: 'Memory',
        value: getFormattedMemory(),
      },
      {
        name: 'Uptime',
        value: getFormattedUptime(),
      },
    ],
  }
}
