import { GuildMember, PartialGuildMember } from "discord.js";
import {
  BirthdayRepository,
  BuddyProjectEntryRepository,
  GroupMember,
  UserGroupRepository,
} from "../entities";
import { textLog } from "../common/moderator";
import { ILike } from "../lib/typeormILIKE";

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
    const birthdayEntries = await BirthdayRepository();
    const foundUser = await birthdayEntries.findOne({
      userid: memberId,
    });
    if (foundUser) {
      birthdayEntries.remove(foundUser);
    }
  } catch (e) {
    textLog(
      `(MemberLeave) -> There was an error removing member from Birthday DB: ${memberId}`
    );
  }
};

const RemoveFromGroups = async (memberId: string) => {
  try {
    const groupRepository = await UserGroupRepository();
    const groups = await groupRepository
      .createQueryBuilder("usergroup")
      .leftJoinAndSelect("usergroup.members", "groupmember")
      .where("groupmember.id = :id", { id: memberId })
      .getMany();
    groups.forEach((groups) => {
      const updatedMemberList = groups.members.filter(
        (m: GroupMember) => m.id !== memberId
      );
      groupRepository.save({
        ...groups,
        members: updatedMemberList,
      });
    });
  } catch (e) {
    textLog(
      `(MemberLeave) There was an error removing member from Birthday DB: ${memberId}`
    );
  }
};
