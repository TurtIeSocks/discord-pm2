import type {
  CommandInteraction,
  SlashCommandBuilder,
  Collection,
  AutocompleteInteraction,
  CacheType,
  SlashCommandSubcommandsOnlyBuilder,
  ModalSubmitInteraction,
} from 'discord.js'

export interface Command {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    | SlashCommandSubcommandsOnlyBuilder
  autoComplete?: (
    interaction: AutocompleteInteraction<CacheType>,
  ) => Promise<void>
  modal?: (interaction: ModalSubmitInteraction) => Promise<void>
  run: (interaction: CommandInteraction) => Promise<void>
}

declare module 'discord.js' {
  interface Client {
    ctx: {
      commands: Collection<string, Command>
    }
  }
}
