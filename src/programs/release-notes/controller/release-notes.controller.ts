import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { GithubReleaseNotesUsecase } from "../usecase/github-release-notes.usecase";
import { Client, TextChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { createYesBotLogger } from "../../../log";

@Command({
  event: DiscordEvent.READY,
})
export class ReleaseNotesController extends CommandHandler<DiscordEvent.READY> {
  private githubReleaseNotesUseCase;

  constructor() {
    super();
    this.githubReleaseNotesUseCase = new GithubReleaseNotesUsecase();
  }

  async handle(client: Client): Promise<void> {
    const message = await this.githubReleaseNotesUseCase.handle();
    if (!!message.tagMessage) {
      const updateChannel = client.guilds
        .resolve(process.env.GUILD_ID)
        .channels.cache.find(
          (channel) => channel.name === ChatNames.UPDATES
        ) as TextChannel;
      await updateChannel.send(message.tagMessage);
    } else {
      logger.info("There was no new tagMessage");
    }

    if (!!message.releaseNotes) {
      const botDevChannel = client.guilds
        .resolve(process.env.GUILD_ID)
        .channels.cache.find(
          (channel) => channel.name === ChatNames.BOT_DEVELOPMENT
        ) as TextChannel;

      if (message.tagMessage.length > 0) {
        await botDevChannel.send(message.releaseNotes);
      }
    } else {
      logger.info("There was no new releaseNotes");
    }
  }
}

const logger = createYesBotLogger("programs", ReleaseNotesController.name);
