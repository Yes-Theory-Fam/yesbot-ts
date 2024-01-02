import {
  ActionRowBuilder,
  AnyThreadChannel,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Snowflake,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { BuddyProjectStatus } from "../../../__generated__/types";
import { ChatNames } from "../../../collections/chat-names";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { BuddyProjectError, commonMessages } from "../constants";
import { BuddyProjectService } from "../services/buddy-project.service";
import { rescueCloseButtonId } from "./rescue-close";

const enum RescueErrors {
  THREAD_ALREADY_EXISTS = "THREAD_ALREADY_EXISTS",
  TOO_MANY_THREADS = "TOO_MANY_THREADS",
}

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  errors: {
    ...commonMessages,
    [RescueErrors.THREAD_ALREADY_EXISTS]: `Hey, it seems like you or your buddy already opened a thread to find the other. In either case, you should find it under the last message in #${ChatNames.BUDDY_PROJECT_INFO}.`,
    [RescueErrors.TOO_MANY_THREADS]: `Oof! It appears too many threads are already in use. Please try again later or try to use the instructions in #${ChatNames.BUDDY_PROJECT_INFO}, sorry about that!`,
  },
  root: "buddy-project",
  subCommand: "rescue",
  description:
    "Allows signed up members to more easily find their buddy using some cheeky Discord tricks.",
})
class BuddyProjectRescue extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const { member, guild } = interaction;
    // Guarded by command decorator
    if (!member || !guild) return;

    await interaction.deferReply({ ephemeral: true });

    const informationText = `Hey ${member}!
I opened this thread to help find your buddy. Discord sometimes displays a weird mess of numbers which I assume happened in your case.

Pulling your buddy into this thread with you should help solve that problem because they are now displayed in the member list on the side and should show up right above this message.

This thread will automatically be closed in an hour because we only have a limited amount of threads available.
If you want to help us out, please click the button below to prematurely close this thread to make it available for others once you have messaged your buddy.`;

    const memberId = member.user.id;

    const buddyId = await BuddyProjectRescue.ensureMatched(memberId);
    BuddyProjectRescue.ensureThreadCapacity(guild);
    await BuddyProjectRescue.ensureNoExistingThread(guild, memberId, buddyId);
    const thread = await BuddyProjectRescue.createRescueThread(guild, memberId);

    await thread.members.add(buddyId);

    const button = new ButtonBuilder({
      style: ButtonStyle.Success,
      label: "Done!",
      custom_id: rescueCloseButtonId,
    });

    const components = new ActionRowBuilder<ButtonBuilder>({
      components: [button],
    });

    await thread.send({
      content: informationText,
      components: [components],
    });

    await interaction.editReply(
      `You can find your rescue thread here: <#${thread.id}>`
    );
  }

  private static async createRescueThread(guild: Guild, memberId: Snowflake) {
    const memberInTrouble = await guild.members.fetch(memberId);
    const infoChannel = memberInTrouble.guild.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.BUDDY_PROJECT_INFO
    );

    if (!infoChannel) throw new Error("Could not find info channel");

    const thread = await infoChannel.threads.create({
      type: ChannelType.GuildPrivateThread,
      autoArchiveDuration: 60,
      name: BuddyProjectRescue.channelNameForMember(memberInTrouble),
    });

    await thread.members.add(memberInTrouble);

    return thread;
  }

  static channelNameForMember(member: GuildMember): string {
    return `Buddy Rescue for ${member.displayName} (${member.id})`;
  }

  static rescueChannelForMember(
    member: GuildMember
  ): AnyThreadChannel | undefined {
    const { guild } = member;
    const rescueName = this.channelNameForMember(member);

    return guild.channels.cache.find(
      (c): c is AnyThreadChannel =>
        (c.type === ChannelType.GuildPublicThread ||
          c.type === ChannelType.GuildPrivateThread) &&
        c.name === rescueName
    );
  }

  static async ensureMatched(userId: Snowflake): Promise<Snowflake> {
    const { status, buddy } = await new BuddyProjectService().getBuddy(userId);

    if (status === BuddyProjectStatus.NotSignedUp) {
      throw new Error(BuddyProjectError.NOT_SIGNED_UP);
    }

    if (!buddy) {
      throw new Error(BuddyProjectError.NOT_MATCHED);
    }

    return buddy.userId;
  }

  static ensureThreadCapacity(guild: Guild): void {
    // permitted total active threads are 1000, let's keep a solid buffer for travels
    const threadCapacity = 900;
    const currentThreadCount = guild.channels.cache.filter(
      (c) => c instanceof ThreadChannel
    ).size;

    if (currentThreadCount >= threadCapacity) {
      throw new Error(RescueErrors.TOO_MANY_THREADS);
    }
  }

  static async ensureNoExistingThread(
    guild: Guild,
    memberId: Snowflake,
    buddyId: Snowflake
  ): Promise<void> {
    const member = guild.members.resolve(memberId);
    if (!member) {
      throw new Error(`Could not resolve member from ID ${memberId}`);
    }

    const buddyMember = guild.members.resolve(buddyId);
    if (!buddyMember) {
      throw new Error(`Could not resolve member from ID ${buddyId}`);
    }

    const userThread = this.rescueChannelForMember(member);
    const buddyThread = this.rescueChannelForMember(buddyMember);
    if (userThread || buddyThread) {
      throw new Error(RescueErrors.THREAD_ALREADY_EXISTS);
    }
  }
}
