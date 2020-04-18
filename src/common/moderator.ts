import { Message } from "discord.js"
import { MODERATOR_ROLE_NAME } from "../const"

export const isAuthorModerator = (message: Message):boolean => {
   if(message.member.roles.hoist) {
      return message.member.roles.hoist.name === MODERATOR_ROLE_NAME
   }
   else {
      return false;
   }
    
} 