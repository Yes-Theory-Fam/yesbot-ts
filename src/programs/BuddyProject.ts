import { db } from "..";
import { GuildMember, PartialGuildMember } from "discord.js";
import { BuddyProjectEntryRepository, BuddyProjectEntry } from "../entities/BuddyProjectEntry";
import { Repository } from "typeorm";


const updateDatabseWithQuery = (BE: Repository<BuddyProjectEntry>, memberId: string, buddyId: string, BuddyEntry: BuddyProjectEntry) => {
  BE.createQueryBuilder()
    .update(BuddyEntry)
    .set({ matched: true, buddy_id: buddyId })
    .where("used_id = :member_id", { member_id: memberId })
    .execute();
  BE.createQueryBuilder()
    .update(BuddyEntry)
    .set({ matched: true, buddy_id: memberId })
    .where("used_id = :member_id", { member_id: buddyId })
    .execute();
}


export async function BuddyProjectSignup(member: GuildMember | PartialGuildMember): Promise<null> {

  const discord_user = new Date(member.joinedAt.toDateString()) < new Date(new Date().toDateString());
  const dmChannel = await member.createDM();
  const buddyEntries = await BuddyProjectEntryRepository();
  const hasEntered = await buddyEntries.findOne(member.id);

  if (hasEntered) {
    dmChannel.send(hasEntered.matched ?
      `It looks like I already found you a match! Did <@${hasEntered.buddy_id}> stopped replying? :grin:` :
      "Hey there, it looks like you just tried to sign up to the Buddy Project again, no need to do that, you're already registered!"
    )
  }
  else {

    const BuddyEntry = new BuddyProjectEntry();
    const newBuddy = buddyEntries.create({
      user_id: member.id,
      matched: false,
      discord_user: discord_user,
    });
    await buddyEntries.save(newBuddy);

    const successMessage = "Woo! You just signed up to the buddy project, exciting right? I'll message you again momentarily with your buddy and what you need to do next!";
    dmChannel.send(successMessage);

    if (new Date().getDate() >= 15) {
      // Find matches of the opposite group (aka newsletter group if user is of discord group)
      const potentialMatches = await buddyEntries.find({ where: { discord_user: !discord_user, matched: false } });
      if (potentialMatches.length > 0) {
        await buddyEntries.findOne({ where: { discord_user: !discord_user } }).then((res) => {
          updateDatabseWithQuery(buddyEntries, member.id, res.user_id, BuddyEntry);
          dmChannel.send("Here is your match:" + res.user_id);
        });
        return null;
      }

      // If the opposite group didn't have any matches, find one from own group
      await buddyEntries.findOne({ where: { discord_user: discord_user, matched: false } }).then((res) => {
        updateDatabseWithQuery(buddyEntries, member.id, res.user_id, BuddyEntry);
        dmChannel.send("Here is your match:" + res.user_id);
      });
    }
  }

  return null;
}

