import {
  TextChannel,
  Guild,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { ChatNames } from "../../../../collections/chat-names.js";
import eventDistribution from "../../../../event-distribution/index.js";
import { buddyProjectSignUpButtonId } from "../../sign-up/buddy-project-signup.js";

export const buddyProjectInfoSetup = async (guild: Guild) => {
  const channel = guild.channels.cache.find(
    (c): c is TextChannel =>
      c.type === ChannelType.GuildText &&
      c.name === ChatNames.BUDDY_PROJECT_INFO
  );

  if (!channel) {
    throw new Error(
      `Could not find channel ${ChatNames.BUDDY_PROJECT_INFO} setting up the info text!`
    );
  }

  const messages = await channel.messages.fetch({ limit: 1, cache: true });
  if (messages.size) {
    throw new Error(
      "Refusing to add more messages! Encountered when setting up info!"
    );
  }

  const button = new ButtonBuilder({
    style: ButtonStyle.Primary,
    emoji: "🚀",
    label: "Sign up",
    custom_id: buddyProjectSignUpButtonId,
  });

  const components = new ActionRowBuilder<ButtonBuilder>({
    components: [button],
  });

  await channel.send({
    content: `# Welcome to this year's Buddy Project!

After many, many months we are finally back! This channel aims to address your most pressing questions:

**What is the Buddy Project?** 

The Buddy Project is a (somewhat) regular event to make new friends arranged by the Yes Theory Fam.

The concept of The Buddy Project is simple, you sign up, get connected with a stranger who also signs up. Each of you will get your own set of 15 questions each, you take turns asking the questions to each other, but both of you will answer them. Now you know each other so well that you have become buddies. 

**How do I sign up for The Buddy Project?** 

It is as simple as it can be. Just press the "Sign up"-Button and you’ll be on your way!
`,
    components: [components],
  });

  const bpCommandId = eventDistribution.getIdForCommandName("buddy-project");
  await channel.send(`
**When will I get matched?**

After an initial sign-up phase of about a week, matching will start. Due to some limitations, not all people will be matched immediately so you might have to wait for a couple hours. You should not have to wait for more than two days (*significantly* less depending on the number of people who signed up). 
  
**Who is my buddy?**

When getting matched, YesBot will send you a DM containing a ping to your buddy. Due to some odd Discord quirks this might just show up as a bunch of symbols and numbers. You can try out </buddy-project find-buddy:${bpCommandId}> or </buddy-project rescue:${bpCommandId}> for (hopefully) a better result. You will also find the Discord username and tag at [our website](${process.env.YTF_FRONTEND_URL}/buddyproject).`);
};
