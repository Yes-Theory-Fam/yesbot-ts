import { GuildMember, User } from "discord.js";
import {
  BuddyProjectEntryRepository,
  BuddyProjectEntry,
} from "../entities/BuddyProjectEntry";
import { Not, getConnection } from "typeorm";
import { BUDDY_PROJECT_MATCHING } from "../const";

export const getMatchText = (match: User, set: number): string => `
Hey there! Thank you for signing up to be a part of the Buddy Project :speech_balloon: . You’ve been paired with <@${
  match.id
}> (${match.username}#${
  match.discriminator
}) If it's unclear on how to contact this person, please ask for help in <#701717612001886228> by copying and pasting this: \`<@${
  match.id
}>\`:grin:. This is where your Buddy Project journey starts! :grin:  First, you’ll have to get in touch with your Buddy. In every pair, one of the two people have been designated to be the “initiator” of the conversation. This responsibility falls on you! Message your buddy to start talking by searching up their username through the find function at the top left-hand corner of your screen, then start the chat! :heart:
Most importantly, here’s your list of questions:

${
  set == 1
    ? `
1. ||If you could experience one of the Yes Theory videos, which would it be, and why?||
3. ||Where are the top three places you want to travel to someday, and why?||
5. ||What are the things in your life that make you feel like yourself? Have you neglected them lately?||
7. ||What would you do if you had one hour left to live?||
9. ||What would your younger self not believe about your life today?||
11. ||What motivates you to keep going when you’re down?||
13. ||How much of you is you, and how much is your parents’ influence?||
15. ||What was the lesson in your most recent painful experience?||
17. ||What do you think you need to do to accomplish/be the ideal version of yourself?||
19. ||When were you last truly proud of yourself?||
21. ||What’s the last act of kindness you’ve done? What’s the last act of kindness someone?||
23. ||What emotion or feeling do you feel the most often?||
25. ||Who makes you feel undeniably loved?||
27. ||Have you ever had to let someone whom you love go, in favour of your own growth?||
29. ||How would you describe me to a stranger?||

You may notice that the questions you’ve received are odd-numbered, that’s because all the even-numbered questions have been sent to the person you’re paired with. So each one of you has a set of questions that you will take turns asking each other, and both answering every time.
`
    : `
2. ||Have you ever been to a Yes Fam meetup? If yes, how was your experience? If no, why not?||
4. ||What is one memory that instantly makes you smile?||
6. ||If you could be anything in the world, no matter qualifications, experience or anything else, what would it be?||
8. ||What’s one dream you had to let go of, and why?||
10. ||How have your priorities changed over time?||
12. ||If you could change anything about the way you were raised, what would it be and why?||
14. ||What’s your biggest insecurity?||
16. ||What would you never want to change about yourself?||
18. ||What is your most toxic trait that you can admit to?||
20. ||What are some of your personal rules that you never break?||
22. ||What’s a crazy story you have?||
24. ||Who’s one person that has changed your life?||
26. ||What do you value most in a friendship?||
28. ||What has this conversation taught about yourself?||
30. ||Make a playlist with songs you think we would both enjoy.||

You may notice that the questions you’ve received are even-numbered, that’s because all the odd-numbered questions have been sent to the person you’re paired with. So each one of you has a set of questions that you will take turns asking each other, and both answering every time. 
`
}



As you can see, the questions are also hidden :eyes:. This way, you can reveal them one after the other without ruining the surprise for yourself! :star_struck:
If you have any questions, feel free to ask them in <#701717612001886228>. Also use that channel to update us on your experience!

Don’t let the questions limit you, let the conversation flow and just get to know each other. Most importantly, don’t forget to enjoy this experience, and turn the stranger you’ve been matched with into a friend! :heart: 

Tip: do this in a video call for an even better experience!  :video_camera:
`;

export const DISCORD_MATCHING: boolean = true;

export async function BuddyProjectSignup(member: GuildMember): Promise<string> {
  const discord_user =
    new Date(member.joinedAt.toDateString()) <
    new Date(new Date().toDateString());
  const dmChannel = await member.createDM();
  const buddyEntries = await BuddyProjectEntryRepository();
  let memberEntry = await buddyEntries.findOne(member.id);
  let output = `New attempted entry from ${member.toString()}: ${
    discord_user ? "**DISCORD USER**" : "**WEBSITE USER**"
  }`;
  const addOutput = (arg: string) => (output = output.concat(`\n${arg}`));

  if (memberEntry) {
    addOutput(
      `${
        memberEntry.matched
          ? `Already matched with <@${memberEntry.buddy_id}>`
          : `Waiting for match.`
      }`
    );
    dmChannel.send(
      memberEntry.matched
        ? `It looks like I already found you a match! Did <@${memberEntry.buddy_id}> stop replying? :grin:`
        : "Hey there, it looks like you just tried to sign up to the Buddy Project again, no need to do that, you're already registered!"
    );
    return output;
  }

  memberEntry = buddyEntries.create({
    user_id: member.id,
    matched: false,
    discord_user: discord_user,
  });
  await buddyEntries.save(memberEntry);

  const bpRole = member.guild.roles.cache.find(
    (r) => r.name === "Buddy Project 2020"
  );
  const badgeRole = member.guild.roles.cache.find(
    (r) => r.id === "602491468795478036"
  );
  if (member.roles.cache.find((r) => r.id === bpRole.id))
    member.roles.add([bpRole, badgeRole]);

  const successMessage = !discord_user
    ? "Yayyy! You just signed up to the Buddy Project :heart: I'll send you another message soon with the name of your Buddy, your set of questions, and more instructions on how to proceed :grin:"
    : "Thanks for signing up to the relaunch! This will work the same as last time, except this time you are guaranteed to get a new member.";

  dmChannel.send(successMessage);
  addOutput("Successfully entered.");

  if (!BUDDY_PROJECT_MATCHING) {
    addOutput("Not currently matching.");
    return output;
  }

  addOutput("Looking for matches of opposite platform.");
  let potentialMatches = await buddyEntries.find({
    where: {
      discord_user: !discord_user,
      matched: false,
      user_id: Not(member.id),
    },
  });

  addOutput(`Found ${potentialMatches.length} members of opposite platform.`);

  if (potentialMatches.length === 0) {
    if (!discord_user || DISCORD_MATCHING) {
      addOutput(
        `Looking for anybody. (Discord on discord matching is set to ${DISCORD_MATCHING})`
      );
      potentialMatches = await buddyEntries.find({
        where: { matched: false, user_id: Not(member.id) },
      });
    }
    if (potentialMatches.length === 0) {
      addOutput(`Didn't find anyone.`);
      return output;
    }
  }

  const match = potentialMatches[0];
  addOutput(`Found <@${match.user_id}>.`);

  let buddy = member.guild.members.cache.find((m) => m.id === match.user_id);

  if (!buddy) {
    addOutput(`Couldn't find member in guild.`);
    return output;
  }

  if (await buddyProjectMatch(member, buddy)) {
    addOutput(`Successfully matched users in database.`);
    if (sendQuestions(member, buddy)) {
      addOutput(`Successfully sent both users questions.`);
      return output;
    } else {
      addOutput(`Couldn't send users questions.`);
      return output;
    }
  } else {
    addOutput(`Error in database matching.`);
    return output;
  }
}

export const sendQuestions = (
  member: GuildMember | User,
  buddy: GuildMember | User
): boolean => {
  buddy
    .createDM()
    .then((dmChannel) =>
      dmChannel.send(getMatchText(member as User, 1), { split: true })
    );
  member
    .createDM()
    .then((dmChannel) =>
      dmChannel.send(getMatchText(buddy as User, 2), { split: true })
    );
  return true;
};

export const buddyProjectMatch = async (
  user1: GuildMember | User,
  user2: GuildMember | User,
  force: boolean = false
): Promise<Boolean> => {
  const buddyEntries = await BuddyProjectEntryRepository();

  const hasBuddy1 = (await buddyEntries.findOne(user1.id)).matched;
  if (hasBuddy1 && !force) return false;
  const hasBuddy2 = (await buddyEntries.findOne(user2.id)).matched;
  if (hasBuddy2 && !force) return false;

  const user1Entry = buddyEntries.create({
    user_id: user1.id,
    matched: true,
    buddy_id: user2.id,
    discord_user: true,
    matchedDate: new Date(),
  });
  const user2Entry = buddyEntries.create({
    user_id: user2.id,
    matched: true,
    buddy_id: user1.id,
    discord_user: true,
    matchedDate: new Date(),
  });
  try {
    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(BuddyProjectEntry)
      .values([user1Entry, user2Entry])
      .orUpdate({
        conflict_target: ["user_id"],
        overwrite: [
          "user_id",
          "matched",
          "buddy_id",
          "discord_user",
          "matched_date",
        ],
      })
      .execute();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getBuddyId = async (
  user: User
): Promise<{ entered: boolean; buddyId: string }> => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const buddyEntry = await buddyEntries.findOne(user.id);
  return { entered: !!buddyEntry, buddyId: buddyEntry?.buddy_id };
};

export const checkEntry = async (user: User): Promise<string> => {
  if (!user) {
    return "Bad user";
  }

  const buddyEntries = await BuddyProjectEntryRepository();
  const userEntry = await buddyEntries.findOne(user.id);
  const output = `__**Entry details for ${user.toString()}:**__
  **Entered**: ${!!userEntry}
  **Matched**: ${userEntry?.matched}
  **Buddy**: <@${userEntry?.buddy_id}>`;
  return output;
};

export const removeEntry = async (user: User): Promise<string> => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const userEntry = await buddyEntries.findOne(user.id);
  let output = `Removing entry for ${user.toString()}.`;
  const addOutput = (arg: string) => (output = output.concat(`\n${arg}`));

  if (!userEntry) {
    addOutput(`User is not entered.`);
    return output;
  }

  if (userEntry.matched) {
    addOutput(`User already has a match - <@${userEntry.buddy_id}>`);
    const buddyEntry = await buddyEntries.findOne(userEntry.buddy_id);
    buddyEntries.remove([userEntry, buddyEntry]);
    addOutput(
      `Successfully removed entries for ${user.toString()} and <@${
        userEntry.buddy_id
      }>`
    );
  } else {
    buddyEntries.remove(userEntry);
    addOutput(`Successfully removed entries for ${user.toString()}.`);
  }
  return output;
};

export const checkEntries = async (): Promise<string> => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const unmatchedEntries = await buddyEntries.findAndCount({
    where: { matched: false },
  });
  let output = `Found ${unmatchedEntries[1]} unmatched members`;
  const unmatchedPeople = unmatchedEntries[0];
  output = output.concat(
    `\nUnmatched users: ${unmatchedPeople
      .map((each) => `<@${each.user_id}>`)
      .join(", ")}`
  );
  return output;
};
