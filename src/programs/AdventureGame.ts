import {
  TextChannel,
  GuildCreateChannelOptions,
  User,
  Guild,
  Client,
  GuildMember,
  MessageAttachment,
} from "discord.js";

export default async function AdventureGame(
  user: User,
  guild: Guild,
  client: Client
) {
  //Step 1: Create new channel for the user

  const channelName = `game-session-${user.username}`
    .replace(/\s+/g, "-")
    .toLowerCase();
  const channelOptions = createChannelOptions(user, client, guild);
  const attemptedFindChannel = guild.channels.cache.find(
    (c) => c.name == channelName
  );
  const playingRole = guild.roles.cache.find((r) =>
    r.name.toLowerCase().includes("playing")
  );
  const guildMember = guild.members.cache.find((m) => m.id === user.id);

  if (
    guildMember.roles.cache.has("I lost the game :(") ||
    guildMember.roles.cache.has("Lodiestan! 🏳️") ||
    guildMember.roles.cache.has("The Doravolution! 🏴")
  ) {
    return;
  }

  if (attemptedFindChannel) {
    user.createDM().then((channel) => {
      channel.send(
        `You already have an active game session! Go play it here: <#${attemptedFindChannel.id}>`
      );
    });
    return;
  }

  const channel = <TextChannel>(
    await guild.channels.create(channelName, channelOptions)
  );
  channel.send(`<@${user.id}>`);
  guildMember.roles.add(playingRole);

  guild.roles.cache.find((r) => r.name.toLowerCase() === "playing");
  const firstMessage = await channel.send(intro);
  firstMessage.react("🧗").then((reaction) => firstMessage.react("🧘"));

  firstMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      switch (reaction.emoji.toString()) {
        case "🧗":
          userClimb(channel);
          break;
        case "🧘":
          userDied(channel);
          break;

        default:
          break;
      }
    });
}

const userClimb = async (channel: TextChannel) => {
  const emergeMessage = await channel.send(climb);
  emergeMessage.react("🐱").then((r) => emergeMessage.react("🐶"));
  emergeMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      catsdogs(channel);
    });
};

const catsdogs = async (channel: TextChannel) => {
  const firstMessage = await channel.send(pet);
  const catsDogsMessage = await channel.send(pets2);
  catsDogsMessage.react("🏳️").then((r) => catsDogsMessage.react("🏴"));
  catsDogsMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      switch (reaction.emoji.toString()) {
        case "🏳️":
          lode(channel);
          break;
        case "🏴":
          dora(channel);
          break;

        default:
          break;
      }
    });
};

const lode = async (channel: TextChannel) => {
  const firstMessage = await channel.send(lodiestan);
  firstMessage.react("👨‍⚕️").then((r) => firstMessage.react("☠️"));
  firstMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      switch (reaction.emoji.toString()) {
        case "👨‍⚕️":
          lodeWin(channel);
          break;
        case "☠️":
          lodeLose(channel);
          break;

        default:
          break;
      }
    });
};
const dora = async (channel: TextChannel) => {
  const firstMessage = await channel.send(doravolution);
  firstMessage.react("⏰").then((r) => firstMessage.react("🤫"));
  firstMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      switch (reaction.emoji.toString()) {
        case "⏰":
          const user = reaction.users.cache.array()[1];
          doraWin(channel, user);
          break;
        case "🤫":
          doraLose(channel);
          break;

        default:
          break;
      }
    });
};

const userDied = async (channel: TextChannel) => {
  const deathmessage = await channel.send(die);
  deathmessage.react("🐉");
  deathmessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      const user = reaction.users.cache.array()[1];
      const role = channel.guild.roles.cache.find(
        (r) => r.name == "I lost the game :("
      );
      const m = channel.guild.members.cache.find((m) => m.id == user.id);
      m.roles.add(role);
      removePlaying(m);
      channel.delete("Finished the game");
    });
};
const removePlaying = (m: GuildMember) => {
  const role = m.guild.roles.cache.find((r) =>
    r.name.toLowerCase().includes("playing")
  );
  m.roles.remove(role);
};

const createChannelOptions = (
  user: User,
  client: Client,
  guild: Guild
): GuildCreateChannelOptions => {
  const categoryId =
    guild.name == "Yes Theory Fam"
      ? "684064840800534568"
      : "694687161085067385";
  const playingRoleId =
    guild.name == "Yes Theory Fam"
      ? "694897668547149924"
      : "694900489015394344";
  return {
    topic: "Game session for " + user.username,
    type: "text",
    permissionOverwrites: [
      {
        id: guild.id,
        deny: ["VIEW_CHANNEL"],
      },
      {
        id: user.id,
        allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"],
        deny: ["SEND_MESSAGES", "ADD_REACTIONS"],
      },
      {
        id: client.user.id,
        allow: ["VIEW_CHANNEL"],
      },
    ],
    parent: categoryId,
  };
};

const lodeWin = async (channel: TextChannel) => {
  const firstMessage = await channel.send(lode_win);
  const attachment = new MessageAttachment(
    "https://cdn.discordapp.com/attachments/550445682050334749/694846338482831410/unknown.png"
  );
  // Send the attachment in the message channel
  channel.send(attachment);
  channel.send("You can use this profile picture to show your allegiance!");
  firstMessage.react("🐉");
  firstMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      const user = reaction.users.cache.array()[1];
      const role = channel.guild.roles.cache.find(
        (r) => r.id == "694614416553017435"
      );
      const m = channel.guild.members.cache.find((m) => m.id == user.id);
      m.roles.add(role);
      removePlaying(m);
      channel.delete("Finished the game");
      const winnerchannel = <TextChannel>(
        channel.guild.channels.cache.find(
          (c) => c.name.toLowerCase() === "lodiestan-plotting"
        )
      );
      winnerchannel.send(`<@${user.id}> has joined our ranks!`);
    });
};

const lodeLose = async (channel: TextChannel) => {
  const deathmessage = await channel.send(lode_lose);
  deathmessage.react("🐉");
  deathmessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      const user = reaction.users.cache.array()[1];
      const role = channel.guild.roles.cache.find(
        (r) => r.name == "I lost the game :("
      );
      const m = channel.guild.members.cache.find((m) => m.id == user.id);
      m.roles.add(role);
      removePlaying(m);
      channel.delete("Finished the game");
    });
};

const doraWin = async (channel: TextChannel, user: User) => {
  const firstMessage = await channel.send(dora_win);
  const attachment = new MessageAttachment(
    "https://cdn.discordapp.com/attachments/550445682050334749/694846283080400916/unknown.png"
  );
  // Send the attachment in the message channel
  channel.send(attachment);
  channel.send("You can use this profile picture to show your allegiance!");
  firstMessage.react("🐉");
  firstMessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      const user = reaction.users.cache.array()[1];
      const role = channel.guild.roles.cache.find(
        (r) => r.id == "694666400765182002"
      );
      const m = channel.guild.members.cache.find((m) => m.id == user.id);
      m.roles.add(role);
      removePlaying(m);
      channel.delete("Finished the game");
      const winnerchannel = <TextChannel>(
        channel.guild.channels.cache.find(
          (c) => c.name.toLowerCase() === "doravolution-plotting"
        )
      );
      winnerchannel.send(`<@${user.id}> has joined our ranks!`);
    });
};

const doraLose = async (channel: TextChannel) => {
  const deathmessage = await channel.send(dora_lose);
  deathmessage.react("🐉");
  deathmessage
    .awaitReactions(
      (reaction: any, user: User) => {
        return !user.bot;
      },
      { max: 1, time: 6000000, errors: ["time"] }
    )
    .then((collected) => {
      const reaction = collected.first();
      const user = reaction.users.cache.array()[1];
      const role = channel.guild.roles.cache.find(
        (r) => r.name == "I lost the game :("
      );
      const m = channel.guild.members.cache.find((m) => m.id == user.id);
      m.roles.add(role);
      removePlaying(m);
      channel.delete("Finished the game");
    });
};

const intro = `**====================**\n\nYou wake up in a pit of ruins close to your house.\nYour ears are ringing, there's fire and debris everywhere.\nYou can hear the angry chants of people running through the streets.\n"This must be the rebellion!" you think to yourself. You remember what your father once told you.\n\n*"Son, in a time of great need, make the right choices. This is very important because these choices will come back for you and matter someday. No seriously, they will."*\n\nYou find the strength to get up and deliberate your options:\n\nDo you :person_climbing:__**climb out of the pit**__ or do you miserably :person_in_lotus_position:__**sit, stay and die**__ ?`;
const climb = `**====================**\n\nYou emerge from the ashes and find yourself in between a crowd of people marching towards a huge castle. They're all screaming "Burn the mods!" and "Downfall of the dictator!" and something with chicken nuggets that you don't really understand.\n\nOne of the people marching stumbles into you. He immediately apologizes, sticks out his hand and introduces himself to you.\n\n"Hi, my name is Jack" he says, and stares you dead into the face for multiple seconds because you don't say anything. He then goes ahead and asks "Tell me my friend, if I were to ask you what you prefer, would it be :cat:__**Cats**__ or :dog:__**Dogs**__?"\n\nWhat is he gonna do with this information??`;
const die = `**====================**\n\nWell, that's unfortunate.\nYou didn't help out any party.\nYou didn't even get to join one at all.\nSeems like this war will be decided without you.\nThanks for considering to help, then deciding not to.\n\nClick the :dragon: __**Dragon**__ to end your adventure.`;
const pet = `**====================**\n\n"That's a fantastic answer that I'm surely gonna remember!" he says.\nYou grab a nearby pitchfork and some fireworks and join in on the "parade" as they call it. It does feel like that a little bit indeed, once you try to fade out the propaganda banners and the armed Zeppelins flying across the sky everywhere.\n\nA moment later, everyone suddenly stops due to a huge boulder right in front of you. Out of nowhere, fanfares start playing and a man dressed in a white robe steps up. \n\n"It's him!! It's the almighty dictator!" you hear people saying next to you. "I want to birth his children!" somebody else says. "I wanna have his hairline!" is not to be heard anywhere.\n\nThe __Lodiestan Dictator__ starts to speak: "Dear people, don't let this tomfoolery fool you. 10 year old girls might be fun but they're not fit to lead. Join me, the supremest leader of them all. Together we will bring back the glory that this place was once known for! Lodiestan forever!\n\nThe people are chanting. "LODIESTAN FOREVER!!" It's amazing.\n\nThen, out of nowhere, *BOOM! KABOOM! KABOOMBABOOZLE! OH MAN, IT'S A ZEPPELIN! AND IT JUST CRASHED INTO THE BOULDER THIS LOVELY MAN WAS PREACHING ON! WHAT'S GOING ON?*`;
const pets2 = `Out of the burning wreckage, a dark figure emerges. __Dora the Destroyer__ stands on top of the flaming zeppelin, grabs a mic out of nowhere and starts speaking to the people as well.\n\n"We must know when to say enough is enough! We won't bear this dictatorship, we want freedom! As leader of this revolution, I hope to inspire to break loose of this non sense brainwashing and instead join me to finally be free. So, what are you waiting for? Join us, for the Doravolution and we will make a difference together."\n\n"Wow! Amazing charisma!" you think, then you turn back towards the boulder. The man isn't on top of it anymore, you can see him and his white robe laying next to it on the ground.\n\nHe seems like he needs help. She seems like she's the strongest of them all. What are you gonna do?\n\n:flag_white: __**Help the man in white**__ or :flag_black: __**Join the woman in black**__`;
const lodiestan = `**====================**\n\nSlowly you approach the man on the ground. His entire body is covered by the white robe, so you're not sure how much damage he's already taken from this attack.\n\nHis followers scream in agony as they gather around his body. "RESTORE THE MASTER!!" they're crying out.\n\nLucky for you, you've just finished your CPR training last week and are totally up to the task. \n\nAs you are just about to step forward and calm them all down with your knowledge, you start to think. He's right there in front of you, on the ground, unconscious, helpless. If there's any time to end this civil war, it's now.\n\nVoices start appearing in your head.\n\n"You've got the world in your hands." -this random girl from last week at the pub\n\n"Son, in a time of great need, make the right choices." -your dad\n\n"With great power comes great responsibility." -uncle ben\n\n"Hey! Do you like cats or dogs?" -jack\n\nWhatever you'll choose, you realize how much weight is attached to this very decision.\n\nWill you :man_health_worker: __**Save him**__ or :skull_crossbones: __**Kill him**__?`;
const doravolution = `**====================**\n\nYou run over to the woman, still amazed by her power and strength. This is the leader you wanna follow through the storm!\n\n"Hey! YOU!" She points at you and out of nowhere, lots of followers gather around you, staring you down.\n\n"Whose side are you on, individual?" she shouts.\n\n"I.. I'd like to be part of your rebellion!" you stutter.\n\n"Good. We need loyal men and women to get this movement going. You are loyal, aren't you?" she says, raising an eyebrow.\n\nJust in that moment, you see that white robe again. Behind her. Moving. Fast. The Lodiestan Dictator is back for revenge.
You shortly make eye contact with him and you realize, this is your call. No matter your opinion, this might be the chance to finally end this civil war.\n\nVoices start appearing in your head.\n\n"You've got the world in your hands." -this random girl from last week at the pub \n\n"Son, in a time of great need, make the right choices." -your dad\n\n"With great power comes great responsibility." -uncle ben\n\n"Hey! Do you like cats or dogs?" -jack\n\nWhatever you'll choose, you realize how much weight is attached to this very decision.\n\nWill you :alarm_clock: __**Alarm her**__ or :shushing_face: __**Stay quiet**__?`;
const dora_win = `**====================**\n\n"W A T C H  Y O U R  B A C K ! ! !" you shout in slow motion. Dora the Destroyer turns around, as she sees the Lodiestan Dictator jumping straight at her.\nYou lock eyes with him once more and see all the hatred towards you. You're gonna regret this.\nYou witness a very skilled kick from Dora the Destroyer's boots straight into the Lodiestan Dictators face, who then fliiiiiieeees off into the sky with a huge bang.\n\nThe dust settles.\n\nDora the Destroyer just claimed another victim.\n\nOr did she?\n\n"This war isn't over yet. He's gonna come back. That's why I need YOU! You all can make a change! You all can help me overthrow the system! And ***YOU!***" she's pointing straight at you again. "YOU are a loyal part of this army now. Friends, let's move to war."\n\nHeroic music queues in and everyone starts cheering.\n__Congratulations, you've successfully joined__ <@&694666400765182002>\n\nClick the :dragon: __**Dragon**__ to end your game and claim your prize.`;
const dora_lose = `**====================**\n\nYou try your best to act as normal as possible.\n\nNothing is happening, there's just this man jumping straight at this woman which you're not gonna recognise. \n\nWith a BANG he kicks her off the Zeppelin and starts fighting the Doravolutioners.\n\nAs you stand right in the middle of them, eventually he fights you too.\n\nThe last thing you see is Dora the Destroyer fleeing the scene to regather her strength before fighting back.\n\nThen, the Lodiestan Dictator picks you up with one hand, holds you in the air, looks you dead in the eye and goes "*Pathetic*".\n\nYou're being slammed to the ground and lose conciousness.\n\nClick the :dragon: __**Dragon**__ to end your adventure.`;
const lode_win = `**====================**\n\nYou walk up towards the white robe on the ground, ready to save a man's life.\n\nBut as you push the robe aside to reveal the body, you realize:\n\nThere's nothing underneath.\n\n"I shall thank you for wanting to help me" a mighty voice says from behind you, somewhere among the crowd.\n\n"Now I am gonna help you too." The Lodiestan Dictator steps out of the crowd, as if he just pulled off a magic trick.\n(Which he kinda did tbf)\n\n"How did you do this??" you ask him.\n\n"Not how. Why is the question you shall seek the answers to. I was busy kicking Dora the Destroyers butt over at the Zeppelin when you were contemplating on saving me. She's gone, for now. We claimed this land. But she will be back."\n\n"Oh, ok, I will settle for this odd explanation then." you say submissively.\n\nHe speaks up again even louder than before: "You have shown true loyalty to my faction. You shall be rewarded for that. Lodiestan will have a fine place for you, once this war is over."\n\nThe crowd starts to sing and chant. **Lodiestan! Lodiestan! Lodiestan!**\n\n__Congratulations, you've successfully joined__<@&694614416553017435>\n\nClick the :dragon: __**Dragon**__ to end your game and claim your prize.`;
const lode_lose = `**====================**\n\nThis is your destiny. If he was as strong and mighty as they say, he wouldn't be laying on the floor like that! It's pathetic.\n\nYou grab your pitchfork and walk towards him, determined to end this war once and for all.\n\nA few people try to block your way, but they can't hold you back from destiny's work. This is a huge moment.\n\nYou release a cry of war, lift up your pitchfork and ***slam*** it down into the robe.\n\nBut it's just that.\n\nA robe.\n\nYou feel a tap on your shoulder.\n\n"I wouldn'tve done that if I were you". The Lodiestan Dictator suddenly stands right behind you.\n\n"I, I, I uhh, I am sorry! I was just.." you poke up the white robe with your pitchfork and wave it through the air like a flag.\n\n"Lodiestan forever???" you say desparately. \n\nThe last thing you feel is a kick to the nuts before you pass out.\n\n__**GAME OVER**__\n\nClick the :dragon: __**Dragon**__ to end your adventure.`;
