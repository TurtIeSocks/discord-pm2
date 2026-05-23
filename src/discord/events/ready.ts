import { ActivityType, type Client, Events } from 'discord.js'
import pm2 from 'pm2'

import { HELPERS, log } from '../../services/logger.js'
import { updateMonitor } from '../monitor.js'
import { deleteMonitor } from '../utils.js'

const REFRESH_EVENTS = new Set(['start', 'restart', 'stop', 'online', 'exit'])

export const ready = (client: Client): void => {
  client.once(Events.ClientReady, async () => {
    if (!client.user || !client.application) {
      return
    }
    client.user.setActivity({ name: 'processes', type: ActivityType.Watching })

    log.info(HELPERS.discord, `${client.user.username} is online`)

    pm2.launchBus((err, bus) => {
      if (err) {
        log.error(HELPERS.discord, 'pm2.launchBus error', err)
        return
      }
      bus.on(
        'process:event',
        async (data: { event: string; process: { name: string } }) => {
          if (!client.ctx.monitor.interval) return
          if (data.event === 'delete') {
            await deleteMonitor(client, data.process.name)
          } else if (REFRESH_EVENTS.has(data.event)) {
            await updateMonitor(client, data.process.name)
          }
        },
      )
    })
  })
}
