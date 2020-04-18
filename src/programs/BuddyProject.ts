import firebase from "firebase";
import { db } from "..";
import { GuildMember, PartialGuildMember } from "discord.js";

interface BuddyProjectSignup {
  id: string,
  username: string,
  displayName: string
}


export async function BuddyProjectSignup(member:GuildMember | PartialGuildMember) {

  const dmChannel = await member.createDM();

  if (db === null) {
    console.error("The database needs to be initialized first!");
    throw new Error("The database needs to be initialized first!");
  }

  const { displayName } = member;
  const { id, username} = member.user;

  // Let's create a b64 of the discord userid (which won't change)
  // and use that as the identifier in firebase

  const firebaseUserId = Buffer.from(id).toString('base64');
  
  const buddyDoc = await db.store
    .collection("buddyproject")
    .doc(firebaseUserId)
    .get();

  const existsMessage = "Hey there, it looks like you just tried to sign up to the Buddy Project again, no need to do that, you're already registered!";
  const successMessage = "Woo! You just signed up to the buddy project, exciting right? I'll message you again in a week or so with your buddy and what you need to do next!";

  dmChannel.send( buddyDoc.exists? existsMessage : successMessage)
  if(buddyDoc.exists) return;

  const buddy: BuddyProjectSignup = {
    id,
    username,
    displayName,
  };

  db.store.collection("buddyproject").doc(firebaseUserId).set(buddy);
  return true;
}

export async function fetchBuddyProjectSignup(
  discordUserId: string
): Promise<BuddyProjectSignup | null> {
  if (db.store === null) {
    console.error("The database needs to be initialized first!");
    return null;
    // return reject("The database needs to be initialized first!");
  }

  // Let's create a b64 of the discord userid (which won't change)
  // and use that as the identifier in firebase
  const firebaseUserId = btoa(discordUserId);

  const signup = await db.store.collection("buddyproject").doc(firebaseUserId).get();
  if (signup.exists) {
    const data = signup.data();
    if (data !== null && data !== undefined) {
      return data as BuddyProjectSignup;
    }
  }

  return null;
}