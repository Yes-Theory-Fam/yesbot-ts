import { User, Guild, DMChannel } from "discord.js";
import {
  BuddyProjectEntryRepository,
  BuddyProjectEntry,
} from "../entities/BuddyProjectEntry";
import { BuddyProjectSignup } from "./BuddyProject";

export default async function BuddyProjectGhost(
  user: User,
  guild: Guild
): Promise<{ success: boolean; message: string }> {
  const repo = await BuddyProjectEntryRepository();
  const entry = await repo.findOne(user.id);
  const userDm = await user.createDM();
  let result = {
    success: false,
    message: `${user.toString()} has reported that they have been ghosted.`,
  };
  const addOutput = (arg: string) =>
    (result.message = result.message.concat(`\n${arg}`));

  if (!entry) {
    userDm.send(
      "You reported that your buddy hasn't replied yet, however you haven't signed up to the buddy project! You can do so by clicking on the speech bubble icon in channel buddy-project on the Yes Theory Fam server."
    );
    addOutput(`User hasn't entered.`);
    return result;
  }

  if (!entry.matched) {
    userDm.send(
      "You reported that your buddy hasn't replied yet, but you don't have a match yet! Please have a little patience in waiting for your buddy :grin:"
    );
    addOutput(`User has no match.`);
    return result;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (entry.matchedDate > sevenDaysAgo) {
    userDm.send(
      "Have some patience :wink: It's not even been one week since you have been matched!"
    );
    addOutput(`User has not waited 7 days since match.`);
    return result;
  }

  if (!entry.reportedGhostDate) {
    userDm.send(
      "I will send your buddy a message as well and they will have one week to respond to it (yes I know it's another week of waiting but we want to make sure they get their fair chance). If they didn't respond within the next 7 days, you can click the ghost again to get your new buddy :blush:"
    );
    addOutput(`Recording ${new Date().toISOString()} as reported ghost date.`);

    markAsGhosted(userDm, guild, user, entry, addOutput);

    return result;
  }

  if (entry.reportedGhostDate > sevenDaysAgo) {
    const timeRemaining =
      entry.reportedGhostDate.getTime() - sevenDaysAgo.getTime();
    const hoursRemaining = timeRemaining / 1000 / 60 / 60;
    const daysRemaining = hoursRemaining / 24;

    const remainingText =
      daysRemaining > 0
        ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
        : `${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}`;

    userDm.send(
      `You have already reported being ghosted. Please have some patience :grin: You still have to wait around ${remainingText}; in the meantime try reaching out to your buddy a few more times, maybe you can catch them!`
    );
    addOutput(
      `User has already reported being ghosted. Time remaining: around ${remainingText}`
    );
    return result;
  }

  // At this point the user is ghosted for more than seven days (I hope)
  userDm.send(
    "It's me again! I unfortunately got no reply from your Buddy :pensive: So I'm going to match you with someone else. I'll send you a message with the questions and the name of your new Buddy soon! Also, if you type !buddy in #buddy-project-chat, the name of your new Buddy will pop up once that's happened :grin:"
  );
  await repo.delete(entry.buddy_id);
  addOutput("Deleted buddy entry.");
  await repo.delete(entry.user_id);
  addOutput("Deleted user entry.");
  BuddyProjectSignup(guild.member(entry.user_id), false);
  addOutput(`Signed up ${user} to the Buddy Project again`);

  return result;
}

const markAsGhosted = async (
  userDm: DMChannel,
  guild: Guild,
  user: User,
  entry: BuddyProjectEntry,
  addOutput: (arg: string) => void
) => {
  const repo = await BuddyProjectEntryRepository();
  const buddy = guild.member(entry.buddy_id);

  if (!buddy) {
    userDm.send(
      "Huh... Looks like I couldn't find your buddy! I reported that to the support team and have them check it. Expect them to get back to you in a bit!"
    );
    addOutput(
      `Couldn't find buddy: <@${entry.buddy_id}>. Please contact them.`
    );
    return;
  }

  const buddyDm = await buddy.createDM();
  await buddyDm.send(
    `Hey there! You signed up to the buddy project and got matched with <@${user.id}> (${user.tag}) but never responded to them. Please let them know what's going on! :grin:`
  );

  entry.reportedGhostDate = new Date();
  await repo.save(entry);
  addOutput(`Reported user as being ghosted.`);

  userDm.send(
    "Hey there, sorry to hear that you couldn't reach out to your buddy! I contacted them with a message asking them to contact you. If they didn't get back to you after a week, click the ghost again to get a new buddy!"
  );
};
