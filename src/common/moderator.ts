import { Message } from "discord.js"
import { MODERATOR_ROLE_NAME } from "../const"

export const isAuthorModerator = (message: Message):boolean => {
    return !!message.member.roles.cache.find(r => r.name === MODERATOR_ROLE_NAME)
} 