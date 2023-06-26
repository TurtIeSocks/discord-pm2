import { APIEmbed, Colors } from 'discord.js'
import os from 'os'

const KILOBYTE = 1024
const MEGABYTE = KILOBYTE * 1024
const GIGABYTE = MEGABYTE * 1024
const SECONDS_IN_DAY = 24 * 60 * 60
const SECONDS_IN_HOUR = 60 * 60
const SECONDS_IN_MINUTES = 60

/**
 * Returns CPU usage in %
 */
export const getCPU = () => Math.round(os.loadavg()[0] * 100) / 100

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
    return (memory / GIGABYTE).toFixed(2) + ' GB'
  } else if (memory >= MEGABYTE) {
    return (memory / MEGABYTE).toFixed(2) + ' MB'
  } else if (memory >= KILOBYTE) {
    return (memory / KILOBYTE).toFixed(2) + ' KB'
  } else {
    return memory + ' bytes'
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
    formatted.push(days + ' day' + (days > 1 ? 's' : ''))
  }
  if (hours > 0) {
    formatted.push(hours + ' hour' + (hours > 1 ? 's' : ''))
  }
  if (days === 0)
    if (minutes > 0) {
      formatted.push(minutes + ' minute' + (minutes > 1 ? 's' : ''))
    }
  if (days === 0 && hours === 0) {
    formatted.push(seconds + ' second' + (seconds > 1 ? 's' : ''))
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
