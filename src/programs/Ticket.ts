import Discord, { OverwriteResolvable, SnowflakeUtil, TextChannel } from 'discord.js';
import Tools from '../common/tools';
import { ENGINEER_ROLE_NAME, COORDINATOR_ROLE_NAME } from '../const';



export default async function Ticket(pMessage: Discord.Message, type:string) {
    
    const TICKET_LOG_CHANNEL = `${type}-logs`;
    const FIYESTA_CATEGORY_ID = "668435952623943680";
    const SHOUTOUT_CATEGORY_ID = "668435954670895114";
    let moderatorRoleName: string;
    let categoryId: string;
    

    switch (type) {
        case "fiyesta":
            moderatorRoleName = ENGINEER_ROLE_NAME;
            categoryId = FIYESTA_CATEGORY_ID
            break;
        case "shoutout":
            moderatorRoleName = COORDINATOR_ROLE_NAME;
            categoryId = SHOUTOUT_CATEGORY_ID;
            break;

        default:
            break;
    }

    //! This comes to us in the format of "![fiyesta|shoutout] [close|logs]?"
    const args = pMessage.cleanContent.split(" ")
    if(args[1] && !(args[1] == "close" || args[1] == "logs")) {
        //some code here
    }
    let channelName = `${type}-${(pMessage.author.username+pMessage.author.discriminator).toLowerCase()}`;
    const isClose = pMessage.cleanContent.split(" ")[1] == "close";
    const supportRole = pMessage.guild.roles.find(r => r.name == moderatorRoleName);

    if(pMessage.cleanContent.split(" ")[1] == "logs") {
        pMessage.channel.send("You will receive a DM with the logs of this conversation after it has ended.")
        pMessage.react('✔️');
        return;
    }

    if(isClose){
        const ticketChannel = <Discord.TextChannel>pMessage.channel;
        if(ticketChannel.name.startsWith(type)) {
            if(pMessage.member.roles.has(supportRole.id)) closeTicket(ticketChannel, pMessage.member, TICKET_LOG_CHANNEL)
            else ticketChannel.send("You are not allowed to close this ticket.")
        }
    }
    else {
        pMessage.delete()
        const channelOptions:TextChannelOptions = {
            topic:"Support ticket for " + pMessage.member.user.username,
            type:"text",
            permissionOverwrites: [
                {
                    id: pMessage.guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: pMessage.author.id,
                    allow: ['VIEW_CHANNEL','SEND_MESSAGES','READ_MESSAGE_HISTORY','ATTACH_FILES'],
                }

            ],
            parent:categoryId
        }
        console.log(channelName);
        channelName = channelName.replace(/\s+/g, '-').toLowerCase();
        console.log(channelName);
        if(pMessage.guild.channels.find(c => c.name == channelName)) {
            pMessage.author.createDM().then(channel => {
                channel.send("You already have a ticket open, please close that one first before opening another.")
            })
            return;
        }
        else {
            const ticketChannel = await pMessage.guild.channels.create(channelName,channelOptions);

            ticketChannel.send(`Hi ${pMessage.member.toString()}, please detail your problem below and a ${supportRole.toString()} will be with you as soon as possible. If you would like to receive logs for this conversation after it has ended, please type \`!ticket logs\``)
        
        }

    }

    
}

async function closeTicket(c:Discord.TextChannel,m:Discord.GuildMember,lc:string) {
    let text:string = "**Ticket Log below for <@" + m.id + ">**\n";
    let lastDate = ""
    const output = (await c.messages.fetch()).map(message => {
        let [year, month, date, hour, min, sec] = timeConverter(message.createdTimestamp);
        if(lastDate != `**____________${date} ${month} ${year}____________**`) {
            text = text + `______${date} ${month} ${year}______\n`
            lastDate = `______${date} ${month} ${year}______`
        }
        year = year.toString().length == 1 ? `0${year}` : year
        min = min.toString().length == 1 ? `0${min}` : min
        return `*[${hour}:${min}]* **${message.author.username}**: ${message.cleanContent}`
    }).reverse().forEach(line => text = text + line + "\n");
    const logChannel = <TextChannel>c.guild.channels.find(c => c.name.startsWith(lc))
    const requestLogMessage = c.messages.find(m => m.cleanContent == "!ticket logs");
    if(!!requestLogMessage) {
        requestLogMessage.author.createDM().then(channel => {
            channel.send(text)
        })
    }
    logChannel.send(text)
    c.delete("Closed Ticket");
}

function timeConverter(UNIX_timestamp:number){

    
    var a = new Date(UNIX_timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return [year, month, date, hour, min, sec];
  }

  interface TextChannelOptions {
      topic?: string,
      nsfw?: boolean,
      type?:'text',
      parent?:Discord.ChannelResolvable,
      permissionOverwrites?: Array<OverwriteResolvable>,
      options? : number,
      reason?: string

  }