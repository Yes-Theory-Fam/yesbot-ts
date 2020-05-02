import { Message, GuildMember, PartialGuildMember, TextChannel, Client } from "discord.js"
import { MODERATOR_ROLE_NAME, OUTPUT_CHANNEL_ID, GUILD_ID } from "../const"

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

export const textLog = (text:string): Promise<Message> => {
   const bot = require('..') as Client;
   const outputChannel = <TextChannel>bot.channels.resolve(OUTPUT_CHANNEL_ID)
   return outputChannel.send(text)
}

export const getMember = (userId:string): GuildMember => {
   const bot = require('..') as Client;
   return bot.guilds.resolve(GUILD_ID).members.resolve(userId)
}
