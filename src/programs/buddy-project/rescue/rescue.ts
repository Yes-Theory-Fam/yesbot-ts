import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import {
  Guild,
  GuildMember,
  Message,
  Snowflake,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import prisma from "../../../prisma";
import { ChatNames } from "../../../collections/chat-names";

enum RescueErrors {
  NOT_MATCHED = "NOT_MATCHED",
  NOT_SIGNED_UP = "NOT_SIGNED_UP",
  THREAD_ALREADY_EXISTS = "THREAD_ALREADY_EXISTS",
  TOO_MANY_THREADS = "TOO_MANY_THREADS",
}

@Command({
  event: DiscordEvent.MESSAGE,
  errors: {
    [RescueErrors.NOT_MATCHED]:
      "Hey, you are not matched yet! Please have some patience while the matching process is still ongoing.",
    [RescueErrors.NOT_SIGNED_UP]:
      "Hey, it looks like you are not signed up yet! Head over to <https://yestheory.family/buddyproject> to sign up and get matched soon.",
    [RescueErrors.THREAD_ALREADY_EXISTS]: `Hey, it seems like you or your buddy already opened a thread to find the other. In either case, you should find it under the last message in #${ChatNames.BUDDY_PROJECT_INFO}.`,
    [RescueErrors.TOO_MANY_THREADS]: `Oof! It appears too many threads are already in use. Please try again later or try to use the instructions in #${ChatNames.BUDDY_PROJECT_INFO}, sorry about that!`,
  },
  trigger: "!rescue",
  channelNames: [ChatNames.BUDDY_PROJECT],
  allowedRoles: ["Buddy Project 2021"],
  description:
    "Allows signed up members to more easily find their buddy using some cheeky Discord tricks.",
  stateful: false,
})
class BuddyProjectRescue extends CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const memberInTrouble = message.member;
    const informationText = `Hey ${memberInTrouble}!
I opened this thread to help find your buddy. Discord sometimes displays a weird mess of numbers which I assume happened in your case.

Pulling your buddy into this thread with you should help solve that problem because they are now displayed in the member list on the side.

This thread will automatically be closed in an hour because we only have a limited amount of threads available.
If you want to help us out, please click the checkmark below to prematurely close this thread to make it available for others once you have messaged your buddy.`;

    const buddyId = await BuddyProjectRescue.ensureMatched(memberInTrouble.id);
    BuddyProjectRescue.ensureThreadCapacity(message.guild);
    await BuddyProjectRescue.ensureNoExistingThread(memberInTrouble, buddyId);
    const thread = await BuddyProjectRescue.createRescueThread(memberInTrouble);

    await thread.members.add(buddyId);

    const infoMessage = await thread.send(informationText);
    await infoMessage.react("✅");

    await message.delete();
  }

  private static async createRescueThread(memberInTrouble: GuildMember) {
    const infoChannel = memberInTrouble.guild.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.BUDDY_PROJECT_INFO
    );

    const hasPrivateThreads =
      memberInTrouble.guild.features.includes("PRIVATE_THREADS");
    const threadType = hasPrivateThreads
      ? "GUILD_PRIVATE_THREAD"
      : "GUILD_PUBLIC_THREAD";

    const thread = await infoChannel.threads.create({
      type: threadType,
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
  ): ThreadChannel | undefined {
    const { guild } = member;
    const rescueName = this.channelNameForMember(member);
    return guild.channels.cache.find(
      (c): c is ThreadChannel =>
        c instanceof ThreadChannel && c.name === rescueName
    );
  }

  static async ensureMatched(userId: Snowflake): Promise<Snowflake> {
    const userAndBuddy = await prisma.buddyProjectEntry.findUnique({
      where: { userId },
      select: { userId: true, buddyId: true },
    });

    if (!userAndBuddy) {
      throw new Error(RescueErrors.NOT_SIGNED_UP);
    }

    if (!userAndBuddy.buddyId) {
      throw new Error(RescueErrors.NOT_MATCHED);
    }

    return userAndBuddy.buddyId;
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
    member: GuildMember,
    buddyId: Snowflake
  ): Promise<void> {
    const guild = member.guild;
    const buddyMember = guild.members.resolve(buddyId);

    const userThread = this.rescueChannelForMember(member);
    const buddyThread = this.rescueChannelForMember(buddyMember);
    if (userThread || buddyThread) {
      throw new Error(RescueErrors.THREAD_ALREADY_EXISTS);
    }
  }
}
