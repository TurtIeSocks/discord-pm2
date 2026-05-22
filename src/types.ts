import type {
  AutocompleteInteraction,
  ButtonInteraction,
  CacheType,
  Collection,
  CommandInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js'
import type { getMonitorChannel } from './discord/utils'

export interface Command {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    | SlashCommandSubcommandsOnlyBuilder
  autoComplete?: (
    interaction: AutocompleteInteraction<CacheType>,
  ) => Promise<void>
  modal?: (interaction: ModalSubmitInteraction) => Promise<void>
  button?: (interaction: ButtonInteraction) => Promise<void>
  run: (interaction: CommandInteraction) => Promise<void>
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
