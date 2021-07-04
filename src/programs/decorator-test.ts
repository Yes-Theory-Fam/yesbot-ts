import { Client, Message, MessageReaction, User, VoiceState } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  EventLocation,
} from "../event-distribution";
import { GuildMemberUpdateArgument } from "../event-distribution/events/guild-member-update";
import { VoiceStateChange } from "../event-distribution/events/voice-state-update";

/**
 * Example of a stateless message handler (stateful: true missing in config).
 * Each time the command is run, a new instance is created so the counter resets.
 */
@Command({
  event: DiscordEvent.MESSAGE,
  description: "",
  trigger: "!test",
  channelNames: ["permanent-testing"],
})
export class DecoratorTest extends CommandHandler<DiscordEvent.MESSAGE> {
  called: number = 0;

  handle(): void {
    ++this.called;
    console.log(`Called handler 1 ${this.called} times`);
  }
}

/**
 * Example of a stateful message handler.
 * Since this is kept as a singleton, the increasing counter is maintained.
 */
@Command({
  event: DiscordEvent.MESSAGE,
  description: "",
  trigger: "!test",
  stateful: true,
  channelNames: ["bot-output"],
  location: EventLocation.ANYWHERE,
  requiredRoles: ["Support"],
})
export class DecoratorTest2 extends CommandHandler<DiscordEvent.MESSAGE> {
  called: number = 0;

  async handle(message: Message): Promise<void> {
    ++this.called;
    console.log(`Called handler 2 ${this.called} times`);
  }
}

/**
 * Example of a DM only message handler.
 */
@Command({
  event: DiscordEvent.MESSAGE,
  description: "",
  trigger: "yeet",
  stateful: true,
  location: EventLocation.DIRECT_MESSAGE,
  channelNames: ["bot-output"],
})
export class DecoratorTest3 extends CommandHandler<DiscordEvent.MESSAGE> {
  called: number = 0;

  handle(message: Message): void {
    ++this.called;
    console.log(`Called handler 3 ${this.called} times`);
  }
}

/**
 * Example of a ReactionAdd Handler.
 */
@Command({
  event: DiscordEvent.REACTION_ADD,
  description: "What gives?",
  stateful: false,
  emoji: "🤓",
  channelNames: ["bot-output"],
})
export class DecoratorTest4 extends CommandHandler<DiscordEvent.REACTION_ADD> {
  handle(reaction: MessageReaction, user: User): void {
    console.log("Called handler 4");
  }
}

/**
 * Example of a MemberUpdate Handler
 */
@Command({
  event: DiscordEvent.GUILD_MEMBER_UPDATE,
  description: "Weee",
  roleNamesAdded: ["Yes Theory"],
  roleNamesRemoved: ["Seek Discomfort"],
})
export class DecoratorTest5 extends CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
  handle(
    oldMember: GuildMemberUpdateArgument,
    newMember: GuildMemberUpdateArgument
  ): void {
    console.log("Called handler 5");
  }
}

/**
 * Example of a Ready Handler
 */
@Command({
  event: DiscordEvent.READY,
})
export class DecoratorTest6 extends CommandHandler<DiscordEvent.READY> {
  handle(client: Client): void {
    console.log("Called handler 6");
  }
}

/**
 * Example of a VoiceStateUpdate Handler on join and switch channel
 */
@Command({
  event: DiscordEvent.VOICE_STATE_UPDATE,
  changes: [VoiceStateChange.JOINED, VoiceStateChange.SWITCHED_CHANNEL],
})
export class DecoratorTest7 extends CommandHandler<DiscordEvent.VOICE_STATE_UPDATE> {
  handle(oldState: VoiceState, newState: VoiceState): void {
    console.log("Called handler 7");
  }
}
