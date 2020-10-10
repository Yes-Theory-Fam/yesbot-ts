/*
 * This file does not make use of the bot in this repository but is tracked here for documentation and versioning purposes.
 * The code in this file is ran as single scheduled job and is fully self-contained.
 */

import {
  Client,
  PartialGuildMember,
  Guild,
  Snowflake,
  TextChannel,
} from "discord.js";
import { writeFile, readFile } from "fs";
import { get, RequestOptions } from "https";
import { exec } from "child_process";

const [, , guildId, roleId, token, limit] = process.argv;
const bot = new Client({
  ws: { intents: ["GUILD_MEMBERS"] },
  presence: { status: "invisible" },
});

interface StoredInformation {
  lastMaxUserId: string;
}

const infoPath = "./unassignedMigration.json";

const loadStoredInformation = async (): Promise<StoredInformation> => {
  return new Promise((res, rej) => {
    readFile(infoPath, { encoding: "utf8" }, (err, data) => {
      if (err) rej(err);
      else res(JSON.parse(data));
    });
  });
};

const saveStoredInformation = (info: StoredInformation) => {
  writeFile(infoPath, JSON.stringify(info), () =>
    console.log("Completed write!")
  );
};

const stopScheduling = (reason: string) => {
  const guild = bot.guilds.resolve(guildId);
  const output = guild.channels.cache.find((c) => c.name === "bot-output");
  const engineer = guild.roles.cache.find((r) => r.name === "Server Engineer");
  const engPing = `<@${engineer}>`;

  if (!(output instanceof TextChannel)) return;

  const disableCommand =
    "sudo /bin/systemctl disable unassigned-migration.timer";
  const stopCommand = "sudo /bin/systemctl stop unassigned-migration";

  const failureMessage = `Failed to stop scheduling the migration! Please run the following commands in the cloud instance:
  ${disableCommand}
  ${stopCommand}
  ${engPing}`;

  exec(disableCommand, (err) => {
    if (err) {
      output.send(failureMessage);
    } else {
      exec(stopCommand, (err) => {
        if (err) {
          output.send(failureMessage);
        } else {
          output.send(
            `Scheduling was stopped with the reason ${reason}! ${engPing}`
          );
        }
      });
    }
  });
};

const getMembers = async (lastId: String) => {
  const query = `?limit=${limit}&after=${lastId}`;
  const path = `/api/guilds/${guildId}/members${query}`;
  console.log("Loading members from ", path);

  const options: RequestOptions = {
    host: "discord.com",
    path,
    headers: {
      Authorization: "Bot " + token,
    },
  };

  return new Promise((res, rej) => {
    const req = get(options, (response) => {
      let data = "";

      response.on("data", (datum) => (data += datum));
      response.on("end", () => {
        console.log("Request completed with statuscode", response.statusCode);
        if (response.statusCode === 200) return res(JSON.parse(data));
        if (response.statusCode === 429) {
          console.error(data);
          stopScheduling(
            "Received 429! Check logs for backoff time, adjust the timer and re-enable it"
          );
        } else {
          stopScheduling(
            "Received unexpected status code! Check logs for more detail."
          );
        }

        rej({ statusCode: response.statusCode, error: data });
      });
    });

    req.on("error", rej);
  });
};

const getCountryRoles = async (guild: Guild): Promise<Snowflake[]> => {
  const updatedManager = await guild.roles.fetch();
  const prefix = "I'm from ";
  return updatedManager.cache
    .filter((role) => role.name.startsWith(prefix))
    .map((role) => role.id);
};

const main = async () => {
  console.log("Script started...");

  const guild = bot.guilds.resolve(guildId);
  if (guild === null) {
    throw new Error("Couldn't find guild with id " + guildId);
  }

  const countryRoles = await getCountryRoles(guild);
  console.log(`Loaded ${countryRoles.length} country roles`);

  const unassignedRole = guild.roles.resolve(roleId);
  if (!unassignedRole) {
    throw new Error("Couldn't find role with id " + roleId);
  }

  const { lastMaxUserId } = await loadStoredInformation();

  console.log("Loaded lastMaxUserId:", lastMaxUserId);

  try {
    const members = (await getMembers(lastMaxUserId)) as PartialGuildMember[];
    const filteredMembers = members
      .filter((member) =>
        ((member.roles as unknown) as string[]).every(
          (roleId) => !countryRoles.includes(roleId)
        )
      )
      .map((member) => member.user.id);

    const guildMembers = (
      await guild.members.fetch({ user: filteredMembers })
    ).array();

    for (let i = 0; i < guildMembers.length; i++) {
      const m = guildMembers[i];
      if (i % 20 === 0 && i !== 0)
        console.log(`Migrating users... Progress: ${i}/${guildMembers.length}`);
      await m.roles.add(unassignedRole);
    }

    console.log(
      `Loaded ${members.length} members, migrated ${filteredMembers.length}.`
    );

    if (members.length) {
      const maxUserId = members[members.length - 1].user.id;

      saveStoredInformation({
        lastMaxUserId: maxUserId,
      });
    } else {
      stopScheduling("Operation completed!");
    }
  } finally {
    console.log("Closing down bot!");
    setTimeout(() => bot.destroy(), 3000);
  }
};

bot.on("ready", main);
bot.login(token);
