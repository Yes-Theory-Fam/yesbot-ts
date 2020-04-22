import { Message, GuildMember, PartialGuildMember } from "discord.js"
import { MODERATOR_ROLE_NAME } from "../const"

export const isAuthorModerator = (message: Message):boolean => {
   if(message.member.roles.hoist) {
      return message.member.roles.hoist.name === MODERATOR_ROLE_NAME
   }
   else {
      return false;
   }
    
}

export const hasRole = (member: GuildMember | PartialGuildMember, roleName: string): boolean => {
   return !!member.roles.cache.find(r => r.name === roleName)
}

export const isRegistered = (member:GuildMember | PartialGuildMember):boolean => {
   return !!member.roles.cache.find(role => role.name.startsWith("I'm from "))
}