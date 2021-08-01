export function githubUserToDiscordMention(username: string): string {
  const trimmedUsername = username.replace("@", "");
  const discordId = githubUsers[trimmedUsername];
  if (discordId === undefined) {
    return `a GitHub user by the name of @${trimmedUsername}`;
  }
  return `<@${discordId}>`;
}

const githubUsers: { [name: string]: string } = {
  "adrian-goe": "312297787901607937",
};
