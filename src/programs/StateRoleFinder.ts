import Discord from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME } from '../const';


export default async function StateRoleFinder(pMessage: Discord.Message) {

    //! This comes to us in the format of "!state [stateName]"

    const args = <string[]>pMessage.content.split(" ");
    args.shift();
    const [stateRequest] = args
    if (!stateRequest) {
        pMessage.reply("Incorrect syntax. Please try again using \`!state statename\`, with no spaces in the name of the state.");
        return;
    }
    const stateRoles = await Tools.resolveFile("stateRoles");
    let found = false;
    let supportRole = pMessage.guild.roles.cache.find(r => r.name == MODERATOR_ROLE_NAME)
    if (pMessage.member.roles.cache.has(supportRole.id)) {
        stateRoles.forEach((stateRole: any) => {
            const { state, role } = stateRole;
                if (state.toLowerCase() === stateRequest.toLowerCase()) {
                    pMessage.delete();
                    pMessage.reply(role)
                    found = true;
                }
        })
        if (!found) pMessage.reply("I couldn't find that state, please try again using \`!state statename\`, with no spaces in the name of the state.")

    }
}

