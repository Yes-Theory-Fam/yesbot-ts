import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Message,
} from "discord.js";
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "translate",
  description: "Translate something you didn't understand",
  options: [
    {
      name: "message",
      type: ApplicationCommandOptionType.String,
      description: "The message you want to translate",
      required: true,
    },
  ],
})
class AbuseMeCommand implements CommandHandler<DiscordEvent.SLASH_COMMAND> {
  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const replies = [
      'You are as useless as the "ueue" in "Queue".',
      "As an outsider, what do you think of the human race?",
      "Brains aren't everything. In your case they're nothing.",
      "Do you think before you speak or is thinking a rare event in your life?",
      "I don't engage in mental combat with the unarmed.",
      "I don't think you are stupid. You just have a bad luck when thinking.",
      "I would love to insult you... but that would be beyond the level of your intelligence.",
      "I'd agree with you but then we'd both be wrong",
      "I'd like to see things from your point of view but I can't seem to get my head that far up my butt.",
      "I'm jealous of all the people that haven't met you!",
      "If I had a dollar for everytime you said something smart, I'd be broke.",
      "Is your a$$ jealous of the amount of sh!t that just came out of your mouth?",
      "It's better to let someone think you are an Idiot than to open your mouth and prove it.",
      "Maybe you need to be on timeout",
      "Ordinarily people live and learn. You just live.",
      "Stupidity is not a crime so you are free to go.",
      "Support bacteria - they're the only culture some people have.",
      "The last thing I want to do is hurt you. But it's still on the list.",
      "Two wrongs don't make a right, take your parents as an example.",
      "Yesbot does not love you specifically",
      "You are a bitch",
      "You sound reasonable. It must be time to up my medication!",
    ];

    const message = interaction.options.getString("message")!;

    const replyIndex = Math.floor(Math.random() * replies.length);
    const translation = replies[replyIndex];

    await interaction.reply(
      `"*${message}"* translated to English means "${translation}".`
    );
  }
}
