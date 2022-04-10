import {
  CollectorFilter,
  Message,
  MessageMentionOptions,
  MessageReaction,
  User,
} from "discord.js";
import { zonedTimeToUtc } from "date-fns-tz";
import { ChatNames } from "../../../collections/chat-names";

import Tools from "../../../common/tools";
import { isAuthorModerator, textLog } from "../../../common/moderator";
import { createYesBotLogger } from "../../../log";
import prisma from "../../../prisma";
import { Birthday } from "@yes-theory-fam/database/client";
import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../../event-distribution";
import { GetUserBirthdayUseCase } from "../usecase/get-user-birthday.usecase";
import { LetUserPickTimezoneUsecase } from "../usecase/let-user-pick-timezone.usecase";
import { formatBirthday, months, referenceYear } from "../utils/birthday-utils";

const logger = createYesBotLogger("programs", "BirthdayManager");

@Command({
  event: DiscordEvent.MESSAGE,
  trigger: "!birthday",
  channelNames: [ChatNames.BOT_COMMANDS],
  description:
    "This handler is to give the ability of a member server to save his birthday to the DB",
})
class BirthdayManager implements CommandHandler<DiscordEvent.MESSAGE> {
  async handle(message: Message): Promise<void> {
    const words = Tools.stringToWords(message.content);

    if (words.length < 2) {
      await Tools.handleUserError(
        message,
        "Please type !birthday and your birthday. I prefer if you use a name for the month :robot:"
      );
      return;
    }

    const birthdayUser =
      isAuthorModerator(message) && message.mentions.users.size === 1
        ? message.mentions.users.first()
        : message.author;

    const userExistingBirthday =
      await new GetUserBirthdayUseCase().getUserBirthday(birthdayUser.id);

    if (userExistingBirthday !== null) {
      await Tools.handleUserError(
        message,
        `I have already stored your birthday as ${formatBirthday(
          userExistingBirthday
        )} :tada:`
      );
      return;
    }

    const birthdate = getUserBirthdate(message.content);

    if (birthdate === null) {
      await Tools.handleUserError(
        message,
        "I'm unable to understand that date. Could you please specify it in month-date form? Like this: `!birthday december-24`. Thank you!"
      );
      return;
    }

    const birthdayMessage = await message.channel.send(
      `Hi <@${birthdayUser.id}>, I think your birthday is ${formatBirthday(
        birthdate
      )}. If that is correct, please click :+1:.`
    );
    await birthdayMessage.react("👍");
    await birthdayMessage.react("👎");

    const filter: CollectorFilter<[MessageReaction, User]> = (
      reaction,
      user
    ) => {
      return (
        (user.id === birthdayUser.id || user.id === message.author.id) &&
        ["👍", "👎"].includes(reaction.emoji.name)
      );
    };

    let birthdayAccepted;
    try {
      birthdayAccepted = await birthdayMessage.awaitReactions({
        filter,
        max: 1,
        time: 15000,
        errors: ["time"],
      });
    } catch (err) {
      // timeout probably
      return;
    }

    if (birthdayAccepted.first().emoji.name === "👎") {
      await message.channel.send(
        "Okay, please be more specific and try again, or hang around for a Support to help you out! :grin:"
      );
      return;
    }

    // Clean up
    await birthdayMessage.delete();

    let timezone;
    try {
      timezone = await new LetUserPickTimezoneUsecase().getUserTimezone(
        message
      );
    } catch (err) {
      const engineerRole = Tools.getRoleByName(
        process.env.ENGINEER_ROLE_NAME,
        message.guild
      );

      if (
        err instanceof Error &&
        err.message === "Too many available time zones"
      ) {
        await message.delete();
        const allowedMentions: MessageMentionOptions = {
          roles: [engineerRole.id],
          users: [message.author.id],
        };
        await message.reply({
          content:
            "Ouch, it seems like you have an extreme amounts of timezones available!" +
            "\nPlease wait while I call for my masters. :grin:" +
            `\nBeep boop ${engineerRole.toString()}? :telephone:`,
          allowedMentions,
        });
      } else if (err instanceof Error && err.message === "time expired") {
        await message.react("⏰");
      } else if (err instanceof Error && err.message === "No timezone found") {
        await message.reply(
          `Whoops! We couldn't figure out potential timezones for you. Calling for help :telephone: ${engineerRole.toString()}`
        );
      } else {
        logger.error(
          "An unknown error has occurred awaiting the users timezone: ",
          { err }
        );
        await message.channel.send(
          "Hmm, something went wrong. Please contact my engineers if this seems unreasonable. :nerd:"
        );
      }
      return;
    }

    await message.channel.send(
      `Okay, I'll store your birthday as ${formatBirthday(
        birthdate
      )} in the timezone ${timezone}.`
    );

    const birthday = createBirthday(birthdayUser.id, birthdate, timezone);
    await prisma.birthday.create({ data: birthday });
  }
}

export function createBirthday(
  id: string,
  birthdate: Date,
  timezone: string
): Birthday {
  return {
    userId: id,
    birthdate: zonedTimeToUtc(birthdate, timezone),
    timezone,
  };
}

export function getUserBirthdate(message: string): Date | null {
  const words = message.split(/[\s,-\/.]\s?/);

  const monthNameMatches = months.find((month) =>
    words.find((word) => word.toLowerCase().includes(month))
  );

  let monthNumMatch = -1;
  if (monthNameMatches === undefined) {
    // This will brute force by taking the first word that's a pure number..
    const matches = words.filter((word) => {
      if (word.length > 2) {
        return false;
      }
      const n = parseInt(word);
      if (isNaN(n)) {
        return false;
      }
      return n > 0 && n <= 12;
    });

    if (matches.length > 1 && matches[0] !== matches[1]) {
      // Maybe a bit harsh, but we abort early if we find >= 2 numbers in the message
      // where both of them are numbers <= 12 but not the same.
      return null;
    }
    monthNumMatch = parseInt(matches[0]);
  }

  let messageWithoutMonthNumber = message;
  if (monthNameMatches === undefined) {
    const pre = message.substr(0, message.indexOf(monthNumMatch.toString()));
    const post = message.substr(pre.length + monthNumMatch.toString().length);
    messageWithoutMonthNumber = pre + post;
  }

  const dayMatches = messageWithoutMonthNumber.match(
    /(0[1-9]|[1-3]0|[1-9]+)(st|nd|rd|th)?/
  );

  if (!dayMatches || dayMatches.length < 2) {
    logger.error(`Couldn't find a match for a day in ${message}`);
    return null;
  }

  // First one is the JS direct match, 2nd one is first capture group (\d+), which is the actual date
  const day = parseInt(dayMatches[1]);

  if (isNaN(day)) {
    logger.error(`Failed to parse ${dayMatches[1]} as an int`);
    return null;
  }

  const month =
    monthNameMatches !== undefined
      ? months.indexOf(monthNameMatches)
      : monthNumMatch - 1;

  if (
    monthNameMatches === undefined &&
    monthNumMatch !== day &&
    monthNumMatch <= 12 &&
    day <= 12
  ) {
    // Cannot find out since I don't know which is month and which is date
    return null;
  }

  return new Date(referenceYear, month, day);
}
