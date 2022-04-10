import { differenceInDays } from "date-fns";
import { Client, TextChannel } from "discord.js";
import { ChatNames } from "../../../collections/chat-names";
import { textLog } from "../../../common/moderator";
import prisma from "../../../prisma";
import { zonedTimeToUtc } from "date-fns-tz";
import {isBirthdayToday} from '../usecase/is-birthday-today';
import { referenceYear } from "../utils/birthday-utils";

export class BirthdayRoleApplyActivity {
  public constructor(private readonly client: Client) {}

  private birthdayRole = this.client.guilds
    .resolve(process.env.GUILD_ID)
    .roles.cache.find((r) => r.name.includes("Happy Birthday"));

  private async getCurrentBirthdayRoleUsers() {
    await this.client.guilds
      .resolve(process.env.GUILD_ID)
      .roles.fetch(this.birthdayRole.id, { force: true });
    return [...this.birthdayRole.members.values()];
  }

  private async applyRole(userId: string) {
    const guild = this.client.guilds.resolve(process.env.GUILD_ID);

    const member = guild.members.cache.find((m) => m.id === userId);
    if (member) {
      await member.roles.add(this.birthdayRole);
    }
  }

  private async removeRole(userId: string) {
    const guild = this.client.guilds.resolve(process.env.GUILD_ID);
    const member = guild.members.cache.find((m) => m.id === userId);
    if (member) {
      await member.roles.remove(this.birthdayRole);
    }
  }

  private async announceBirthdays(userIds: string[]) {
    if (userIds.length === 0) {
      return;
    }

    const guild = this.client.guilds.resolve(process.env.GUILD_ID);
    const pings = userIds.map((id) => `<@${id}>`);

    const announcementString =
      userIds.length === 1
        ? `**Hooray! It's ${pings[0]} birthday today!** 🎉🎁🎊`
        : `**It's a party! 🎊 Happy Birthday to our esteemed members: ${pings.join(
            ", "
          )}!**`;

    const channel = guild.channels.cache.find(
      (c): c is TextChannel => c.name === ChatNames.CHAT
    );
    await channel.send(announcementString);
  }

  public async applyBirthdayRoles() {
    // To reduce the bot's load of calculating the timezoned dates, we only fetch two days ahead and two days behind.
    // We can likely get away with less but my head hurts, so I'm leaving it as is.
    const reference = new Date();
    reference.setFullYear(referenceYear);

    const upperReference = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate() + 2
    );
    const lowerReference = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate() - 2
    );

    const birthdays = await prisma.birthday.findMany({
      where: {
        birthdate: {
          not: undefined,
          lte: upperReference,
          gte: lowerReference,
        },
      },
    });

    const currentBirthdays = birthdays
      .map((birthday) => ({
        userId: birthday.userId,
        hasBirthday: isBirthdayToday(birthday, new Date(), referenceYear),
      }))
      .filter(({ hasBirthday }) => hasBirthday);

    const currentBirthdayRoleUsers = (
      await this.getCurrentBirthdayRoleUsers()
    ).map(({ id }) => id);

    const missing = currentBirthdays
      .filter(({ userId }) => !currentBirthdayRoleUsers.includes(userId))
      .map((u) => u.userId);

    if (missing.length) {
      await textLog(
        `Would apply birthday role to ${missing
          .map((u) => `<@${u}>`)
          .join(", ")}.`
      );
    }

    // const birthdayAssignPromises = missing.map((userId) =>
    //   this.applyRole(userId)
    // );
    // await Promise.all(birthdayAssignPromises);
    //
    // await this.announceBirthdays(missing);
  }

  public async removeBirthdayRoles() {
    const currentBirthdayRoleUsers = await this.getCurrentBirthdayRoleUsers();
    const theirBirthdays = await prisma.birthday.findMany({
      where: {
        userId: {
          in: currentBirthdayRoleUsers.map((u) => u.id),
        },
      },
    });

    const pastBirthdays = theirBirthdays
      .map((birthday) => ({
        userId: birthday.userId,
        hasBirthday: isBirthdayToday(birthday, new Date(), referenceYear),
      }))
      .filter(({ hasBirthday }) => hasBirthday);

    // const birthdayRemovePromises = pastBirthdays.map(({ userId }) =>
    //   this.removeRole(userId)
    // );
    // await Promise.all(birthdayRemovePromises);

    if (pastBirthdays.length) {
      await textLog(
        `Would remove birthday role from ${pastBirthdays
          .map(({ userId }) => `<@${userId}>`)
          .join(", ")}.`
      );
    }
  }
}
