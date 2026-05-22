import type {
  AutocompleteInteraction,
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Collection,
  ModalSubmitInteraction,
  SharedSlashCommand,
} from 'discord.js'
import type { getMonitorChannel } from './discord/utils.js'

export interface Command {
  data: SharedSlashCommand
  autoComplete?: (
    interaction: AutocompleteInteraction<CacheType>,
  ) => Promise<void>
  modal?: (interaction: ModalSubmitInteraction) => Promise<void>
  button?: (interaction: ButtonInteraction) => Promise<void>
  run: (interaction: ChatInputCommandInteraction) => Promise<void>
}

declare module 'discord.js' {
  interface Client {
    ctx: {
      commands: Collection<string, Command>
      monitor: {
        messages: Collection<string, Message<true>>
        channel: Awaited<ReturnType<typeof getMonitorChannel>>
        interval: NodeJS.Timeout | null
      }
    }
  }
}
