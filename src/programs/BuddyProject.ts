import { db } from "..";
import { GuildMember, PartialGuildMember } from "discord.js";
import { BuddyProjectEntryRepository, BuddyProjectEntry } from "../entities/BuddyProjectEntry";



export async function BuddyProjectSignup(member:GuildMember | PartialGuildMember):Promise<null> {
  
  const discord_user = new Date(member.joinedAt.toDateString()) < new Date(new Date().toDateString());

  const dmChannel = await member.createDM();

  const buddyEntries = await BuddyProjectEntryRepository();

  const hasEntered = await buddyEntries.findOne(member.id);

  if(hasEntered) {
    if(hasEntered.matched) {

    }
    else {

    }
    dmChannel.send(hasEntered.matched ?
      `It looks like I already found you a match! Did <@${hasEntered.buddy_id}> stopped replying? :grin:`:
      "Hey there, it looks like you just tried to sign up to the Buddy Project again, no need to do that, you're already registered!" 
      )
  }
  else {

    const buddyEntry = await buddyEntries.save({
      "user_id":member.id,
      "matched":false,
      discord_user,
    })

    const successMessage = "Woo! You just signed up to the buddy project, exciting right? I'll message you again momentarily with your buddy and what you need to do next!";
    dmChannel.send(successMessage)
   
    const potentialMatch = await buddyEntries.findOne({where: { discord_user: !discord_user}})

    if(potentialMatch) {
      dmChannel.send("Here is your match:" + potentialMatch.user_id);

    }
    
  }
  
  
  return null;
}