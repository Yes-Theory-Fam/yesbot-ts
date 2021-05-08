import { GuildMember, PartialGuildMember } from "discord.js";
import {
  Birthday,
  BuddyProjectEntryRepository,
  GroupMember,
  UserGroupMembershipRepository,
} from "../entities";
import { textLog } from "../common/moderator";

export class MemberLeave {
  constructor(member: GuildMember | PartialGuildMember) {
    if (member.roles.cache.find((r) => r.name === "Buddy Project 2020")) {
      RemoveFromBuddyProject(member.id);
    }

    RemoveFromBirthdays(member.id);
    RemoveFromGroups(member.id);
  }
}

const RemoveFromBuddyProject = async (memberId: string) => {
  try {
    const buddyEntries = await BuddyProjectEntryRepository();
    const foundUser = await buddyEntries.findOne({
      user_id: memberId,
    });
    if (foundUser) {
      if (foundUser?.matched) {
        const buddyEntry = await buddyEntries.findOne(foundUser.buddy_id);
        buddyEntries.remove([foundUser, buddyEntry]);
      } else {
        buddyEntries.remove(foundUser);
      }
    }
  } catch (err) {
    textLog(
      `(MemberLeave) -> There was an error removing member from Buddy Project DB: ${memberId}`
    );
  }
};

const RemoveFromBirthdays = async (memberId: string) => {
  try {
    const foundUser = await Birthday.findOne({
      userid: memberId,
    });
    if (foundUser) {
      await Birthday.remove(foundUser);
    }
  } catch (e) {
    textLog(
      `(MemberLeave) -> There was an error removing member from Birthday DB: ${memberId}`
    );
  }
};

const RemoveFromGroups = async (memberId: string) => {
  try {
    const groupMemberRepository = await UserGroupMembershipRepository();
    await groupMemberRepository.remove({ id: memberId });
  } catch (e) {
    textLog(
      `(MemberLeave) There was an error removing member from the group DB: ${memberId}`
    );
  }
};
