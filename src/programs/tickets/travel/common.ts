import {
  Message,
  MessageReaction,
  Role,
  Snowflake,
  TextChannel,
  User,
} from "discord.js";
import { CountryRoleFinder } from "../../../utils/country-role-finder";
import { ChatNames } from "../../../collections/chat-names";
import { createYesBotLogger } from "../../../log";

const fiveMinutes = 5 * 60 * 1000;
type CancellationToken = { cancelled: boolean };

enum TravelErrors {
  CANCELLED = "CANCELLED",
  TOO_MANY_RETRIES = "TOO_MANY_RETRIES",
}

export const promptAndSendForApproval = async (
  channel: TextChannel,
  userId: Snowflake
) => {
  try {
    await _promptAndSendForApproval(channel, userId);
  } catch (e) {
    if (e instanceof Error && e.message === TravelErrors.TOO_MANY_RETRIES) {
      await channel.send(
        `Oops, I didn't get a good answer after 5 attempts <@${userId}>; if you want to start over again, please use \`!retry\`.`
      );
      return;
    }

    if (e instanceof Error && e.message === TravelErrors.CANCELLED) return;

    const logger = createYesBotLogger("travel", "promptAndSendForApproval");
    logger.error("Error occurred while collecting information: ", e);
  }
};

const _promptAndSendForApproval = async (
  channel: TextChannel,
  userId: Snowflake
) => {
  const ct = { cancelled: false };
  const retryCollector = channel.createMessageCollector({
    filter: (msg) => msg.content.split(" ")[0] === "!retry",
  });
  retryCollector.on("collect", () => {
    retryCollector.stop("Got one!");
    ct.cancelled = true;
  });

  await channel.send(
    "Hey there! Let's collect the information needed for a travel shoutout! If you mistyped anything, don't worry, you can always use `!retry` to start over."
  );
  const countries = await getCountries(channel, userId, ct);
  const places = await getString(
    channel,
    userId,
    "Next, which are the places you are traveling to there?",
    ct
  );
  const alone = await getBool(channel, userId, "Are you traveling alone?", ct);
  const travelPartners = alone
    ? ""
    : await getString(
        channel,
        userId,
        "Nice! Who are you traveling with? *If you want to ping members, that can be a little tricky down here thanks to how Discord allows mentions. You can start writing a message in another channel and then copy that over here.*",
        ct,
        fiveMinutes * 2
      );
  const dates = await getString(
    channel,
    userId,
    "Sweet! When will you be there?",
    ct
  );
  const needsHost = await getBool(channel, userId, "Do you need a host?", ct);
  const activities = await getString(
    channel,
    userId,
    "Lastly, what are you planning to do there?",
    ct
  );
  retryCollector.stop("All information collected!");

  const travelRequest = formatMessage(
    userId,
    countries,
    places,
    travelPartners,
    dates,
    needsHost,
    activities
  );

  const userConfirmed = await getBool(
    channel,
    userId,
    `Alright! This is what I would send to the mods for review:\n\n${travelRequest}\n\nDoes that all look good to you?`,
    ct
  );

  if (!userConfirmed) {
    await channel.send(
      "No worries, we can go through everything one more time :)"
    );
    await _promptAndSendForApproval(channel, userId);
    return;
  }

  await sendForSupportConfirmation(travelRequest, channel);
};

const sendForSupportConfirmation = async (
  formattedRequest: string,
  originChannel: TextChannel
) => {
  const approvalChannel = originChannel.guild.channels.cache.find(
    (c) => c.name === ChatNames.TRAVEL_APPROVALS
  ) as TextChannel;
  const approvalMessage = await approvalChannel.send(formattedRequest);
  await approvalMessage.react("✅");
  await approvalMessage.react("🚫");

  await originChannel.send(
    "I sent all the information to the Supports, please have some patience while they are taking a look at it."
  );
};

const getCountries = async (
  channel: TextChannel,
  userId: Snowflake,
  ct: CancellationToken
): Promise<Role[]> =>
  await retryUntilSatisfied(
    () => _getCountries(channel, userId),
    (countries) => Boolean(countries?.length),
    ct,
    async () =>
      channel
        .send(
          "I couldn't find any countries that we have roles for in your message, please try again!"
        )
        .then((m) => setTimeout(() => m.delete(), 10000))
  );

async function _getCountries(
  channel: TextChannel,
  userId: Snowflake
): Promise<Role[] | undefined> {
  const prompt =
    "First, please send a message with all countries you are planning to travel to. That can be both the country names or their flags as emojis.";

  const content = (await _getString(channel, userId, prompt)) || "";
  const countries = CountryRoleFinder.getCountriesFromString(content);
  const usaIndex = countries.findIndex((c) => c.name === "USA");
  const hasUsa = usaIndex > -1;
  if (hasUsa) {
    countries.splice(usaIndex, 1);
  }

  const mappedRoles = countries
    .map((c) => CountryRoleFinder.getRoleForCountry(c, channel.guild))
    .filter(Boolean);
  const usaRoles = hasUsa ? await _getUSARegions(channel, userId) : [];

  return [...mappedRoles, ...usaRoles];
}

async function _getUSARegions(
  channel: TextChannel,
  userId: Snowflake
): Promise<Role[]> {
  const emojisToRegionNames: Record<string, string> = {
    "🇼": "(West)",
    "🇲": "(Midwest)",
    "🇸": "(Southwest)",
    "🇪": "(Southeast)",
    "🇳": "(Northeast)",
  };

  const regions = Object.keys(emojisToRegionNames);
  const confirm = "✅";

  const prompt = `Hey, looks like you are traveling in the US! We have a few regions there so please select the ones applicable for your trip and confirm by clicking the checkmark:
🇼 - West
🇲 - Mid West
🇸 - South West
🇪 - South East
🇳 - North East

Here is a map of the regions: https://cdn.discordapp.com/attachments/603399775173476403/613072439500341291/unknown.png`;

  const promptMessage = await channel.send(prompt);
  for (const region of regions) {
    await promptMessage.react(region);
  }
  await promptMessage.react(confirm);

  const filter = (reaction: MessageReaction, user: User) =>
    user.id === userId && reaction.emoji.name === confirm;

  await promptMessage.awaitReactions({ filter, max: 1, time: fiveMinutes });

  const reactionUserPromises = promptMessage.reactions.cache
    .filter((r) => regions.includes(r.emoji.name))
    .map(async (r) => {
      return { reaction: r, fetchedUsers: await r.users.fetch() };
    });
  const reactionUserTuples = await Promise.all(reactionUserPromises);
  const activeRegionReactions = reactionUserTuples
    .filter(({ fetchedUsers }) => !!fetchedUsers.get(userId))
    .map(({ reaction }) => reaction);

  await promptMessage.reactions.removeAll();

  const activeRegions = activeRegionReactions.map(
    (e) => emojisToRegionNames[e.emoji.name]
  );

  const pickedRoles = channel.guild.roles.cache
    .filter((r) => activeRegions.some((region) => r.name.includes(region)))
    .values();
  return [...pickedRoles];
}

async function getString(
  channel: TextChannel,
  userId: Snowflake,
  prompt: string,
  ct: CancellationToken,
  timeout?: number
): Promise<string> {
  return await retryUntilSatisfied(
    () => _getString(channel, userId, prompt, timeout),
    (s) => Boolean(s?.length),
    ct
  );
}

async function _getString(
  channel: TextChannel,
  userId: Snowflake,
  prompt: string,
  timeout?: number
): Promise<string | undefined> {
  await channel.send(prompt);
  const filter = (message: Message) => message.author.id === userId;
  const response = await channel.awaitMessages({
    filter,
    max: 1,
    time: timeout ?? fiveMinutes,
  });

  const message = response.first();
  if (!message) {
    return undefined;
  }

  return message.content;
}

async function getBool(
  channel: TextChannel,
  user: Snowflake,
  prompt: string,
  ct: CancellationToken
): Promise<boolean> {
  return await retryUntilSatisfied(
    () => _getBool(channel, user, prompt),
    (result) => result !== undefined,
    ct
  );
}

async function _getBool(
  channel: TextChannel,
  userId: Snowflake,
  prompt: string
): Promise<boolean | undefined> {
  const promptMessage = await channel.send(prompt);
  const positive = "✅";
  const negative = "🚫";
  const choices = [positive, negative];

  for (const c of choices) {
    await promptMessage.react(c);
  }

  const filter = (reaction: MessageReaction, user: User) =>
    choices.includes(reaction.emoji.name) && user.id === userId;
  const choice = await promptMessage.awaitReactions({
    filter,
    max: 1,
    time: fiveMinutes,
  });

  const pick = choice.first();
  if (!pick) {
    return undefined;
  }

  return pick.emoji.name === positive;
}

function formatMessage(
  userId: Snowflake,
  countries: Role[],
  places: string,
  travelPartners: string,
  time: string,
  host: boolean,
  activities: string
): string {
  const rolePings = countries.map((r) => `<@&${r.id}>`).join(", ");
  return `Hey ${rolePings}!

**Who's traveling**: <@${userId}>${
    travelPartners !== "" ? `and ${travelPartners}` : ""
  }
**Where**: ${places}
**When**: ${time}
**Looking for a host**: ${host ? "Yes" : "No"}
**Activities**: ${activities}

Click on the thread right below this line if you're interested to join the chat and talk about it 🙂`;
}

/**
 * Calls the producer until the predicate returns true when called with the produced result. Allows for responding to failures with an optional argument.
 *
 * @param producer Function that produces some result.
 * @param satisfiedPredicate Function that checks whether a produced result satisfied some criteria.
 * @param ct If ct.cancelled = true, this function throws.
 * @param onFailure Function called in case a produced result did not satisfy the predicates' criteria.
 */
const retryUntilSatisfied = async <T>(
  producer: () => T | Promise<T>,
  satisfiedPredicate: (t: T) => boolean,
  ct: CancellationToken,
  onFailure?: () => unknown | Promise<unknown>
): Promise<T> => {
  let retryCount = 5;

  let result: T;
  do {
    result = await producer();

    if (ct.cancelled) {
      throw new Error(TravelErrors.CANCELLED);
    }

    if (satisfiedPredicate(result)) {
      break;
    }

    await onFailure?.();

    retryCount -= 1;
    if (!retryCount) {
      throw new Error(TravelErrors.TOO_MANY_RETRIES);
    }
  } while (true);

  return result;
};
