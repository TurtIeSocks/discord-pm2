import config from 'config'

import { startDiscord } from './discord/client.js'
import { register } from './discord/register.js'
import { log } from './services/logger.js'

const REQUIRED_CONFIG = ['token', 'clientId', 'guildId'] as const

const missing = REQUIRED_CONFIG.filter((key) => {
  const value = config.has(key) ? config.get<string>(key) : ''
  return !value
})

if (missing.length > 0) {
  log.error(
    `Missing required config keys: ${missing.join(', ')}. ` +
      `Set them in config/local.json (copy from config/default.json).`,
  )
  process.exit(1)
}

register().then(() => startDiscord())
