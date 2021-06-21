import { Message } from "discord.js";
import Tools from "../common/tools";
import prisma from "../prisma";

export const deadchatGroup = async (
  message: Message,
  requestedGroup: string
): Promise<boolean> => {
  const group = await prisma.userGroup.findFirst({
    where: {
      name: {
        equals: requestedGroup,
        mode: "insensitive",
      },
    },
  });

  const deadTime = group.deadtime * 60 * 1000;

  const timeDifference =
    Date.now() -
    (await message.channel.messages.fetch({ limit: 2 })).array()[1]
      .createdTimestamp;

  const timeRemaning = Math.round(
    (deadTime - Math.round(timeDifference)) / 60 / 1000
  );

  const isDead =
    Date.now() -
      (await message.channel.messages.fetch({ limit: 2 })).array()[1]
        .createdTimestamp >
    deadTime;

  if (!isDead) {
    if (timeRemaning === 0) {
      await Tools.handleUserError(
        message,
        `Chat is not dead! You can ping this group in the next few seconds.`
      );
      return false;
    }
    if (timeRemaning === 1) {
      await Tools.handleUserError(
        message,
        `Chat is not dead! You can ping this group in the next minute`
      );
    }
    await Tools.handleUserError(
      message,
      `Chat is not dead! You can ping this group in the next ${timeRemaning} minutes.`
    );
    return false;
  }

  if (isDead) {
    return true;
  }
};

export default deadchatGroup;
