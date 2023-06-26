import { ActivityType, Client, Events } from 'discord.js'
import pm2 from 'pm2'

import { HELPERS, log } from '../../services/logger'
import { updateAll } from '../../services/pm2'

export const ready = (client: Client): void => {
  client.once(Events.ClientReady, async () => {
    if (!client.user || !client.application) {
      return
    }
    client.user.setActivity({ name: 'processes', type: ActivityType.Watching })

    log.info(HELPERS.discord, `${client.user.username} is online`)

    pm2.launchBus((err, bus) => {
      if (err) throw err
      bus.on(
        'process:event',
        async (data: { event: string; process: { name: string } }) => {
          if (
            data.event === 'start' &&
            client.ctx.monitor.interval &&
            !client.ctx.monitor.messages.has(data.process.name)
          ) {
            await updateAll(client)
          }
        },
      )
    })
  })
}
