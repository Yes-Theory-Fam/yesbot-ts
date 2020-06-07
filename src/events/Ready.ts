import Discord from 'discord.js';
import bot from "../index"
import { GUILD_ID, OUTPUT_CHANNEL_ID } from '../const';
import { BuddyProjectEntryRepository } from '../entities/BuddyProjectEntry';
import { Not, IsNull } from 'typeorm';

class Ready {
  bot: Discord.Client;

  constructor(bot: Discord.Client) {
    this.bot = bot;
    console.log(`${bot.user.tag} - Online`)
    const guild = this.bot.guilds.resolve(GUILD_ID)
    if (OUTPUT_CHANNEL_ID) {
      const outputChannel = <Discord.TextChannel>(
        guild.channels.resolve(OUTPUT_CHANNEL_ID)
      );
      outputChannel.send(`${bot.user.tag} - Online`)
    }

    this.cacheBuddyDmChannels().then((count) => console.log(`Cached ${count} DM channels of ghosting buddies`));
  }

  /*
      We need this to be able to catch reactions in DMChannels.
      As seen here: https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=channels, DMChannels are not initially cached, however 
      here: https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=messageReactionAdd it states that a message has to be cached
      to cause messageReactionAdd events.

      Thus, to make this work, we need to at least cache the DMs of the buddies of buddy_project_entry where reportedGhostDate is not null.
  */
  async cacheBuddyDmChannels(): Promise<number> {
    const repo = await BuddyProjectEntryRepository();
    const ghosted = await repo.find({
      where: {
        reportedGhostDate: Not(IsNull()),
      }
    });

    let count = 0;

    for (let i = 0; i < ghosted.length; i++) {
      const entry = ghosted[i];
      const buddyId = entry.buddy_id;
      const buddy = bot.users.resolve(buddyId);
      if (!buddy) {
        console.log(`Tried to resolve ${buddyId} but failed to do so`);
        continue;
      }
      (await buddy.createDM()).fetch();
      count++;
    }

    return count;
  }
}


export default Ready;
