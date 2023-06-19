import { ActivityType, Client, Events } from 'discord.js'

import { HELPERS, log } from '../../services/logger'

export function ready(client: Client): void {
  client.once(Events.ClientReady, async () => {
    if (!client.user || !client.application) {
      return
    }
    client.user.setActivity({ name: 'processes', type: ActivityType.Watching })

    log.info(HELPERS.discord, `${client.user.username} is online`)
  })
}
