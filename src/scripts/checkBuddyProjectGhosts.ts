// Generally the idea is to run this file as daily cron job, however exporting the function for use within the running bot is possible as well (I just wouldn't know where that would reasonably go).
/*
  Steps taken are:
   - Get all entries marked as ghosted more than seven days ago
   - For each entry, message the buddy and the user who reported the ghosting
   - Remove both entries from the database
   - Call BuddyProjectSignup with the user who was ghosted
*/

import bot from '../index';

import { BuddyProjectEntryRepository, BuddyProjectEntry } from '../entities/BuddyProjectEntry';
import { MoreThan } from "typeorm";
import { GuildMember } from 'discord.js';
import { textLog } from '../common/moderator';

import { GUILD_ID } from '../const';
import { BuddyProjectSignup } from '../programs/BuddyProject';

const GUILD = bot.guilds.resolve(GUILD_ID);

const checkBuddyProjectGhosts = async () => {
  const repo = await BuddyProjectEntryRepository();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const ghosted = await repo.find({
    where: {
      reportedGhostDate: MoreThan(sevenDaysAgo)
    }
  });

  for (let i = 0; i < ghosted.length; i++) {
    const entry = ghosted[i];

    let buddy: GuildMember;
    let user: GuildMember;

    try {
      ({ buddy, user } = resolveUsers(entry));
    } catch (e) {
      textLog(e);
      continue;
    }

    const buddyDm = await buddy.createDM();
    buddyDm.send("Hey there! Unfortunately you didn't click the reaction within the last 7 days and thus I expect you to be a very infrequent Discord user. Hence I unmatched you from your buddy to allow them to get a new match. To enter again, go to the Yes Theory Fam server, to the buddy-project check and click the speech bubble twice and be sure to stick around so you don't miss your buddy again :)");

    const userDm = await buddy.createDM();
    await userDm.send("Hey there! Your buddy didn't respond to my message either so I unmatched you! I will also start matching you again in just a second so you get another shot!");

    // Clear both entries, then start signup with the ghosted user again.
    await repo.delete({ user_id: entry.user_id });
    await repo.delete({ user_id: entry.buddy_id });

    BuddyProjectSignup(user);
  }
};

const resolveUser = (id: string, type: "ghosted" | "buddy") => {
  const user = GUILD.member(id);
  if (!user) throw `I couldn't find the user <@${id}> while trying to sort out ghosting! (this would have been the ${type} user)`;

  return user;
}

const resolveUsers = (entry: BuddyProjectEntry): { buddy: GuildMember, user: GuildMember } => {
  const buddy = resolveUser(entry.buddy_id, "buddy");
  const user = resolveUser(entry.user_id, "ghosted");
  return { buddy, user };
};

checkBuddyProjectGhosts().then((count) => console.log(`Done, handled ${count} ghosted people.`));
