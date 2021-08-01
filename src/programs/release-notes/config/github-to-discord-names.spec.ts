import { githubUserToDiscordMention } from "./github-to-discord-names";

describe("github to discord name", () => {
  it("should expect a defined github user to get converted to a discord mention", () => {
    const github_username = "adrian-goe";
    const expected_discord_mention = `<@312297787901607937>`;
    expect(githubUserToDiscordMention(github_username)).toEqual(
      expected_discord_mention
    );
  });

  it("should expect a undefined github user to get converted to a sane placeholder name", () => {
    const github_username = "hunter2";
    const expected_discord_mention = `a GitHub user by the name of @${github_username}`;
    expect(githubUserToDiscordMention(github_username)).toEqual(
      expected_discord_mention
    );
  });
});
