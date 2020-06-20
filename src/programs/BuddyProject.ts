import { db } from "..";
import bot from "../index";
import {
  GuildMember,
  PartialGuildMember,
  User,
  TextChannel,
  Guild,
  MessageEmbed,
} from "discord.js";
import {
  BuddyProjectEntryRepository,
  BuddyProjectEntry,
} from "../entities/BuddyProjectEntry";
import { Repository } from "typeorm";
import { BUDDY_PROJECT_MATCHING } from "../const";
import Tools from "../common/tools";

const updateDatabaseWithQuery = (
  BuddyEntryRepo: Repository<BuddyProjectEntry>,
  memberId: string,
  buddyId: string,
  BuddyEntry: BuddyProjectEntry
) => {
  BuddyEntryRepo.createQueryBuilder()
    .update(BuddyEntry)
    .set({ matched: true, buddy_id: buddyId })
    .where("user_id = :member_id", { member_id: memberId })
    .execute()
    .catch((err) =>
      console.log("There was an error updating member entry: ", err)
    );
  BuddyEntryRepo.createQueryBuilder()
    .update(BuddyEntry)
    .set({ matched: true, buddy_id: memberId })
    .where("user_id = :member_id", { member_id: buddyId })
    .execute()
    .catch((err) =>
      console.log("There was an error updating buddy entry: ", err)
    );
};

export const getMatchText = (match: User, set: number): string => `
Hey there! Thank you for signing up to be a part of the Buddy Project :speech_balloon: . You’ve been paired with ${match.toString()} - {${
  match.username + "#" + match.discriminator
}} (If this is just a long number for you, copy and paste this in <#701717612001886228> to get who it is :grin:). This is where your Buddy Project journey starts! :grin:  First, you’ll have to get in touch with your Buddy. In every pair, one of the two people have been designated to be the “initiator” of the conversation. This responsibility falls on you! Message your buddy to start talking by searching up their username through the find function at the top left-hand corner of your screen, then start the chat! :heart:
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

export async function BuddyProjectSignup(
  member: GuildMember | PartialGuildMember
): Promise<null> {
  const discord_user =
    new Date(member.joinedAt.toDateString()) <
    new Date(new Date().toDateString());
  const dmChannel = await member.createDM();
  const buddyEntries = await BuddyProjectEntryRepository();
  const hasEntered = await buddyEntries.findOne(member.id);
  const outputChannel = member.guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  let buddy: User = null;

  let outputText = `New entry from ${member.toString()}`;

  if (hasEntered) {
    outputText = outputText.concat(
      " - Already entered - Matched: " + hasEntered.matched
    );
    dmChannel.send(
      hasEntered.matched
        ? `It looks like I already found you a match! Did <@${hasEntered.buddy_id}> stopped replying? :grin:`
        : "Hey there, it looks like you just tried to sign up to the Buddy Project again, no need to do that, you're already registered!"
    );
  } else {
    const BuddyEntry = new BuddyProjectEntry();
    const newBuddy = buddyEntries.create({
      user_id: member.id,
      matched: false,
      discord_user: discord_user,
    });
    await buddyEntries.save(newBuddy);

    const successMessage =
      "Woo! You just signed up to the buddy project, exciting right? I'll message you again momentarily with your buddy and what you need to do next!";
    dmChannel.send(successMessage);

    outputText = outputText.concat(" - Successfully entered.");

    if (BUDDY_PROJECT_MATCHING) {
      outputText = outputText.concat(" - Looking for match.");

      //? Find matches of the opposite group (aka newsletter group if user is of discord group)
      const potentialMatches = await buddyEntries.find({
        where: { discord_user: !discord_user, matched: false },
      });

      outputText = outputText.concat(
        ` - Found ${potentialMatches.length} members of opposite platform.`
      );

      if (potentialMatches.length > 0) {
        try {
          const match = potentialMatches[0];
          updateDatabaseWithQuery(
            buddyEntries,
            member.id,
            match.user_id,
            BuddyEntry
          );

          //! Found a buddy
          buddy = member.guild.members.resolve(match.user_id).user;
        } catch (err) {
          console.log(
            "There was an error finding matches for opposite group: ",
            err
          );
        }
      } else {
        outputText = outputText.concat(` - Looking for only **new** members.`);

        const finalMatches = await buddyEntries.find({
          where: { matched: false },
        });

        const potentialMatches = finalMatches.filter(
          (el) => el.user_id !== member.id
        );
        outputText = outputText.concat(
          ` - Found ${potentialMatches.length} potential matches.`
        );

        if (potentialMatches.length > 0) {
          try {
            const finalMatch = potentialMatches[0];
            updateDatabaseWithQuery(
              buddyEntries,
              member.id,
              finalMatch.user_id,
              BuddyEntry
            );

            //! Found a buddy
            buddy = member.guild.members.resolve(finalMatch.user_id).user;
          } catch (err) {
            console.log(
              "There was an error finding matches for opposite group: ",
              err
            );
          }

          //? Did we find a buddy?
        }
      }
    }
  }

  if (buddy && buddy.id != member.id) {
    outputText = outputText.concat(
      ` - Found a match with  ${buddy.toString()}!`
    );
    buddy
      .createDM()
      .then((dmChannel) =>
        dmChannel.send(getMatchText(member.user, 1), { split: true })
      );
    member
      .createDM()
      .then((dmChannel) =>
        dmChannel.send(getMatchText(buddy, 2), { split: true })
      );
  } else {
    outputText = outputText.concat(" - Didn't find valid match.");
    if (buddy && buddy.id == member.id)
      outputText = outputText.concat(" - Matched with myself.");
  }

  outputChannel.send(outputText);
  return null;
}

export const forceMatch = async (
  user1: User,
  user2: User,
  guild: Guild
): Promise<Boolean> => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const user1Entry = await buddyEntries.findOne(user1.id);
  const user2Entry = await buddyEntries.findOne(user2.id);
  const outputChannel = guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  let outputText = `Trying to force match between ${user1.toString()} and ${user2.toString()}`;

  if (user1Entry) {
    outputText = outputText.concat(
      `\n${user1.toString()} has already entered.`
    );
    if (!user1Entry.buddy_id) {
      outputText = outputText.concat(
        `\n${user1.toString()} has not found a match yet.`
      );
      user1Entry.buddy_id = user2.id;
      user1Entry.matched = true;
      await buddyEntries.save(user1Entry);
    } else {
      outputText = outputText.concat(
        `\n${user1.toString()} already has a match with <@${
          user1Entry.buddy_id
        }>, changing match to <@${user2.id}>`
      );
    }
  } else {
    const createdUser1Entry = buddyEntries.create({
      user_id: user1.id,
      matched: true,
      discord_user: true,
      buddy_id: user2.id,
    });
    await buddyEntries.save(createdUser1Entry);
  }

  if (user2Entry) {
    outputText = outputText.concat(
      `\n${user2.toString()} has already entered.`
    );
    if (!user2Entry.buddy_id) {
      outputText = outputText.concat(
        `\n${user2.toString()} has not found a match yet.`
      );
      user2Entry.buddy_id = user1.id;
      user2Entry.matched = true;
      await buddyEntries.save(user2Entry);
    } else {
      outputText = outputText.concat(
        `\n${user2.toString()} already has a match with <@${
          user2Entry.buddy_id
        }>, changing match to <@${user1.id}>`
      );
    }
  } else {
    const createdUser2Entry = buddyEntries.create({
      user_id: user2.id,
      matched: true,
      discord_user: true,
      buddy_id: user1.id,
    });
    await buddyEntries.save(createdUser2Entry);
  }

  const matched =
    (await buddyEntries.findOne(user1.id)).buddy_id === user2.id &&
    (await buddyEntries.findOne(user2.id)).buddy_id === user1.id;

  if (matched) {
    outputText = outputText.concat(
      `\nSuccessfully matched ${user1.toString()} with ${user2.toString()}`
    );
    user1
      .createDM()
      .then((dmChannel) =>
        dmChannel.send(getMatchText(user2, 1), { split: true })
      );
    user2
      .createDM()
      .then((dmChannel) =>
        dmChannel.send(getMatchText(user1, 2), { split: true })
      );
    outputChannel.send(outputText);
    return true;
  } else {
    outputText = outputText.concat(
      `\nSomething went wrong. Please tag an engineer to take a look.`
    );
    return false;
  }
};

export const checkEntry = async (user: User, guild: Guild) => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const userEntry = await buddyEntries.findOne(user.id);
  const outputChannel = guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  let outputText = `__**Entry details for ${user.toString()}:**__
  **Entered**: ${!!userEntry}
  **Matched**: ${userEntry?.matched}
  **Buddy**: <@${userEntry?.buddy_id}>`;
  outputChannel.send(outputText);
};

export const removeEntry = async (user: User, guild: Guild) => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const userEntry = await buddyEntries.findOne(user.id);
  const outputChannel = guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  let outputText = `Removing entry for ${user.toString()}.`;

  if (!userEntry) outputText = outputText.concat(`\nUser is not entered.`);

  if (userEntry.matched) {
    outputText = outputText.concat(
      `\nUser already has a match - <@${userEntry.buddy_id}>`
    );
    const buddyEntry = await buddyEntries.findOne(userEntry.buddy_id);
    buddyEntries.remove([userEntry, buddyEntry]);
    outputText = outputText.concat(
      `\nSuccessfully removed entries for ${user.toString()} and <@${
        userEntry.buddy_id
      }>`
    );
  } else {
    buddyEntries.remove(userEntry);
    outputText = outputText.concat(
      `\nSuccessfully removed entries for ${user.toString()}.`
    );
  }

  outputChannel.send(outputText);
};

export const cleanEntries = async (guild: Guild, matches?: number) => {
  const buddyEntries = await BuddyProjectEntryRepository();
  const unmatchedEntries = await buddyEntries.find({
    where: { matched: false },
  });
  const outputChannel = guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  let outputText = `Found ${unmatchedEntries.length} unmatched members`;

  const maxMatches = Math.floor(unmatchedEntries.length / 2);
  if (maxMatches < 1) {
    outputText += "\nMatching failed (not enough unmatched members available)";
    outputChannel.send(outputText);
    return;
  }
  const matchCount = matches ? Math.min(matches, maxMatches) : maxMatches;
  const matching = unmatchedEntries.splice(0, matchCount);
  // Strictly not as random as keeping them all together but this makes things easier and is probably just as good.

  // Half is either the same length or has one entry less, using its length avoids an IndexError opposed to using unmatchedEntries
  for (let i = 0; i < matching.length; i++) {
    const current = matching[i];

    const matchIndex = Math.floor(Math.random() * unmatchedEntries.length);
    const match = unmatchedEntries[matchIndex];

    updateDatabaseWithQuery(buddyEntries, current.user_id, match.user_id, matching[i]);

    const user1 = guild.client.users.resolve(current.user_id);
    const user2 = guild.client.users.resolve(match.user_id);

    user1
      .createDM()
      .then((dmChannel) =>
        dmChannel.send(getMatchText(user2, 1), { split: true })
      );

    user2
      .createDM()
      .then((dmChannel) =>
        dmChannel.send(getMatchText(user1, 2), { split: true })
      );

    outputText += `\nMatched <@${current.user_id}> with <@${match.user_id}>!`;

    unmatchedEntries.splice(matchIndex, 1);
  }
  outputText += `\n\nDone matching! List of matches is above; ${unmatchedEntries.length} unmatched members (${Math.floor(unmatchedEntries.length / 2)} matches) remaining!`;

  outputChannel.send(outputText, { split: true });
};

export const checkAllEntries = async (guild: Guild) => {
  const entries = await BuddyProjectEntryRepository();
  const all = await entries.find({ where: { matched: false } });

  const outputChannel = guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  const returnString = all.map((each) => each.user_id).join(", ");
  let outputText = `All unmatched members: ${returnString}`;
  outputChannel.send(outputText, { split: true });
};

export const beginGame = async (guild: Guild) => {
  const buddyEntries = await BuddyProjectEntryRepository();

  const unmatchedEntries = await buddyEntries.find({
    where: { matched: false },
  });
  for (var i = unmatchedEntries.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = unmatchedEntries[i];
    unmatchedEntries[i] = unmatchedEntries[j];
    unmatchedEntries[j] = temp;
  }

  const random6 = unmatchedEntries.slice(0, 6);
  const outputChannel = guild.channels.cache.find(
    (c) => c.name == "buddy-project-matches"
  ) as TextChannel;
  const nominee: User = guild.members.cache.find(
    (u) => u.id === random6[0].user_id
  )?.user;
  console.log(nominee);
  const gameStartMessage = await outputChannel.send(
    `Find a match for <@${nominee?.id}>?`
  );

  const applicantMap = [
    {
      user: guild.members.cache.find((u) => u.id === random6[1].user_id)?.user,
      emoji: "1️⃣",
    },
    {
      user: guild.members.cache.find((u) => u.id === random6[2].user_id)?.user,
      emoji: "2️⃣",
    },
    {
      user: guild.members.cache.find((u) => u.id === random6[3].user_id)?.user,
      emoji: "3️⃣",
    },
    {
      user: guild.members.cache.find((u) => u.id === random6[4].user_id)?.user,
      emoji: "4️⃣",
    },
    {
      user: guild.members.cache.find((u) => u.id === random6[5].user_id)?.user,
      emoji: "5️⃣",
    },
  ];
  gameStartMessage.react("👍").then((reaction) => gameStartMessage.react("👎"));

  const gameStartMessageReaction = await Tools.getFirstReaction(
    gameStartMessage
  );
  switch (gameStartMessageReaction) {
    case "👍":
      const matchEmbed = new MessageEmbed({
        title: `Pick a match for <@${nominee?.id}>`,
      }).setColor(`#a02222`);
      applicantMap.forEach((applicant) => {
        matchEmbed.addField(applicant.emoji, `<@${applicant.user.id}>`);
      });
      const embedMessage = await outputChannel.send(matchEmbed);
      Tools.addNumberReactions(5, embedMessage);
      const reaction = await Tools.getFirstReaction(embedMessage);
      switch (reaction) {
        case "1️⃣":
          forceMatch(nominee, applicantMap[0].user, guild);
          break;
        case "2️⃣":
          forceMatch(nominee, applicantMap[0].user, guild);
          break;
        case "3️⃣":
          forceMatch(nominee, applicantMap[0].user, guild);
          break;
        case "4️⃣":
          forceMatch(nominee, applicantMap[0].user, guild);
          break;
        case "5️⃣":
          forceMatch(nominee, applicantMap[0].user, guild);
          break;
        default:
          break;
      }
  }
};
