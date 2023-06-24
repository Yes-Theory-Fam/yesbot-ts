import { CategoryChannel, Guild, TextChannel } from "discord.js";

// Some channels are unlocked by roles; any role permission granting access to a channel fully overrides a role permission
// denying access to a channel. Thus, we need to filter all those channels
export const getRoleAccessedChannels = (guild: Guild) => {
  const countryCategories = [
    "africa",
    "north america",
    "asia",
    "europe",
    "south america",
    "oceania",
  ];

  const countryCategoryChannels = guild.channels.cache.filter(
    (channel): channel is CategoryChannel =>
      channel instanceof CategoryChannel &&
      countryCategories.some((category: string) =>
        channel.name.toLowerCase().endsWith(category)
      )
  );

  const countryChannels = [...countryCategoryChannels.values()]
    .map((category) => [...category.children.cache.values()])
    .flat();

  const roleAccessedChannelNames = [
    "safe-chat",
    "self-development",
    "meditation",
    "pride",
    "pioneer-chat",
    "iceman-chat",
    "iceman-info",
  ];

  const roleAccessedChannels = guild.channels.cache
    .filter(
      (c): c is TextChannel =>
        c instanceof TextChannel && roleAccessedChannelNames.includes(c.name)
    )
    .values();

  return [...countryChannels, ...roleAccessedChannels];
};
