import Discord from 'discord.js';
import Tools from '../common/tools';


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
    let supportRole = pMessage.guild.roles.find(r => r.name == "Support")
    if (pMessage.member.roles.has(supportRole.id)) {
        stateRoles.forEach((stateRole: any) => {
            const { state, role } = stateRole;
                if (state.toLowerCase() === stateRequest.toLowerCase()) {
                    pMessage.reply(role)
                    found = true;
                }
        })
        if (!found) pMessage.reply("I couldn't find that state, please try again using \`!state statename\`, with no spaces in the name of the state.")

    }
}

