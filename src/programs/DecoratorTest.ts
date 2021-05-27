import { Message } from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../events/handler";

/**
 * Example of a stateless message handler (stateful: true missing in config).
 * Each time the command is run, a new instance is created so the counter resets.
 */
@Command({
  event: DiscordEvent.Message,
  description: "",
  trigger: "!test",
  channelNames: ["permanent-testing"],
})
export class DecoratorTest extends CommandHandler<DiscordEvent.Message> {
  called: number = 0;

  handleEvent(message: Message): void {
    ++this.called;
    console.log(`Called handler 1 ${this.called} times`);
  }
}

/**
 * Example of a stateful message handler.
 * Since this is kept as a singleton, the increasing counter is maintained.
 */
@Command({
  event: DiscordEvent.Message,
  description: "",
  trigger: "!test",
  stateful: true,
  channelNames: ["bot-output"],
})
export class DecoratorTest2 extends CommandHandler<DiscordEvent.Message> {
  called: number = 0;

  handleEvent(message: Message): void {
    ++this.called;
    console.log(`Called handler 2 ${this.called} times`);
  }
}
