import { Message } from "discord.js";
import {
  Command,
  CommandHandler,
  DiscordEvent,
  MessageLocation,
} from "../event-distribution";

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
  location: MessageLocation.DIRECT_MESSAGE,
})
export class DecoratorTest3 extends CommandHandler<DiscordEvent.MESSAGE> {
  called: number = 0;

  handle(message: Message): void {
    ++this.called;
    console.log(`Called handler 3 ${this.called} times`);
  }
}
