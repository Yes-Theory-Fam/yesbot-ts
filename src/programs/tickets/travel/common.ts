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

const fiveMinutes = 5 * 60 * 1000;
type CancellationToken = { cancelled: boolean };

export const promptAndSendForApproval = async (
  channel: TextChannel,
  userId: Snowflake
) => {
  const ct = { cancelled: false };
  const retryCollector = channel.createMessageCollector(
    (msg) => msg.content.split(" ")[0] === "!retry"
  );
  retryCollector.on("collect", () => {
    retryCollector.stop("Got one!");
    ct.cancelled = true;
  });

  const countries = await getCountries(channel, userId, ct);
  const places = await getString(
    channel,
    userId,
    "Next, which are the places you are traveling to there?",
    ct
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
    dates,
    needsHost,
    activities
  );

  const approvalChannel = channel.guild.channels.cache.find(
    (c) => c.name === ChatNames.TRAVEL_APPROVALS
  ) as TextChannel;
  const approvalMessage = await approvalChannel.send(travelRequest);
  await approvalMessage.react("✅");
  await approvalMessage.react("🚫");

  await channel.send(
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
          "I couldn't find any countries in your message, please try again!"
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

  const mappedRoles = countries.map((c) =>
    CountryRoleFinder.getRoleForCountry(c, channel.guild)
  );
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

  await promptMessage.awaitReactions(filter, { max: 1, time: fiveMinutes });
  await promptMessage.reactions.removeAll();

  const activeRegionReactions = promptMessage.reactions.cache.filter(
    (r) => regions.includes(r.emoji.name) && !!r.users.resolve(userId)
  );

  const activeRegions = activeRegionReactions
    .array()
    .map((e) => emojisToRegionNames[e.emoji.name]);

  return channel.guild.roles.cache
    .filter((r) => activeRegions.some((region) => r.name.includes(region)))
    .array();
}

async function getString(
  channel: TextChannel,
  userId: Snowflake,
  prompt: string,
  ct: CancellationToken
): Promise<string> {
  return await retryUntilSatisfied(
    () => _getString(channel, userId, prompt),
    (s) => Boolean(s?.length),
    ct
  );
}

async function _getString(
  channel: TextChannel,
  userId: Snowflake,
  prompt: string
): Promise<string | undefined> {
  await channel.send(prompt);
  const filter = (message: Message) => message.author.id === userId;
  const response = await channel.awaitMessages(filter, {
    max: 1,
    time: fiveMinutes,
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
  const choice = await promptMessage.awaitReactions(filter, {
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
  time: string,
  host: boolean,
  activities: string
): string {
  const rolePings = countries.map((r) => `<@&${r.id}>`).join(", ");
  return `Hey ${rolePings}!
  
**Who's traveling**: <@${userId}>
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
  let result: T;
  do {
    result = await producer();

    if (ct.cancelled) {
      throw new Error("Cancelled");
    }

    if (satisfiedPredicate(result)) {
      break;
    }

    await onFailure();
  } while (true);

  return result;
};
