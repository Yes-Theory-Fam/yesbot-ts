import { Message, Snowflake } from "discord.js";
import { GameConfig, GameSession, SessionConfig } from "../game-session";
import Tools from "../../common/tools";
import { locations } from "./locations";

interface SpyfallSessionConfig extends SessionConfig {
  spyIds: Snowflake[];
  startTime: Date;
  fullTimeMilliseconds: number;
  remainingMilliseconds: number;
  timeouts: NodeJS.Timeout[];
  activeVote: boolean;
  location: string;

  numberOfSpies: number;
  timeInMinutes: number;
  endOnWrongVote: boolean;
  endAfterFirstSpy: boolean;
  endOnWrongReveal: boolean;
}

const voteTime = 30 * 1000;
const spy = "🕵️";

const rules = `The game is played in voice chat. One or more people (depending on the configuration) are randomly assigned the spy role.
Others are sent this round's location and a role to play at that location (to help with answering questions).
Players ask each other questions to find out who the spy is or - in case of the spy - find out what the location of the round is.
The person who was asked a question decides who they are asking next, however the person they were asked by may not be picked.
A person who was voted out is neither able to start a vote nor cast their vote anymore in case the game continues after the vote.

Votes with more than one spy in the game have to hit at least 50% of the votes to be successful (this also means the spies win when they are 50% of the players remaining).
Votes with only one spy in the game have to be unanimous to be successful!

If the spy guesses the location correctly, they win! If they guess incorrectly, they lose (there is different behaviour configurable when playing with more than one spy).
If the players guess the correct spy, they win! If they guess the incorrect person, they either lose or the person they voted for is not able to play anymore (depending on the configuration).
If the timer runs out and the players haven't caught the spy, the spy wins! 
`;

const howToPlay = `
You can use the following commands to interact with the game:
\`!vote @player\` in this chat to start a vote for a player. Everyone may vote except for the person that's being voted and players previously voted out.
\`!reveal\` in DMs with me to reveal yourself as the spy. You will then have to guess the location in this chat. The command won't work in this channel to not give clues as to whether you are actually the spy or not.
\`!timer\` to see the time remaining in this round (works both in DMs and in this channel).
\`!locations\` to list the possible locations (works both in DMs and in this channel).

Here are the locations: ${locations
  .map((location) => location.location)
  .join(", ")}`;

export class Spyfall extends GameSession<SpyfallSessionConfig> {
  static config: GameConfig<SpyfallSessionConfig> = {
    emoji: spy,
    name: "Spyfall",
    rules,
    howToPlay,
    voiceRequired: true,
    dmsRequired: true,
    minPlayers: 4,
    maxPlayers: 10,
    configuration: {
      timeInMinutes: {
        type: "number",
        options: "range",
        min: 6,
        max: 12,
        defaultValue: 10,
        emoji: "⏱",
        displayName: "Time",
        suffix: " minutes",
      },

      numberOfSpies: {
        type: "number",
        options: "range",
        min: 1,
        max: 3,
        defaultValue: 1,
        emoji: "🕵️",
        displayName: "Number of spies",
      },

      endOnWrongVote: {
        type: "boolean",
        options: "selection",
        defaultValue: true,
        emoji: "🔪",
        displayName: "End on wrong guess",
        description:
          "Ends the game when a vote causes someone who isn't the spy to be indicted.",
      },

      endAfterFirstSpy: {
        type: "boolean",
        options: "selection",
        defaultValue: false,
        emoji: "🗡",
        displayName: "End after first spy",
        description:
          "Ends the game when a vote indicts a spy but the game is played with more than one spy.",
      },

      endOnWrongReveal: {
        type: "boolean",
        options: "selection",
        defaultValue: true,
        emoji: "🏬",
        displayName: "End on wrong location",
        description:
          "Ends the game if one spy guesses the wrong location. If false, the game continues with the wrong spy out of the game.",
      },
    },
  };

  protected sessionConfig: Partial<SpyfallSessionConfig> = {
    activeVote: false,
  };

  async patchConfig(partial: Partial<SpyfallSessionConfig>) {
    const nos = partial.numberOfSpies;
    if (nos && Math.ceil(this.players.length / nos) <= 2) {
      const sensibleDefault = Math.floor(this.players.length / 2) - 1;
      await this.channel.send(
        `Configuration set a value of ${nos} spies which is equal to or more than half the amount of players which automatically wins the spies the game. Setting the number to ${sensibleDefault} to make the game playable.`
      );
      partial.numberOfSpies = sensibleDefault;
    }

    await super.patchConfig(partial);
  }

  async start() {
    super.start();
    // Shallow copy to not throw the spy out of voting entirely.
    const players = [...this.sessionConfig.players];

    const spyIds: Snowflake[] = [];
    while (spyIds.length < this.sessionConfig.numberOfSpies) {
      const spyIndex = Math.floor(Math.random() * players.length);
      const [spy] = players.splice(spyIndex, 1);
      const { id } = spy.user;
      if (!spyIds.includes(id)) {
        spyIds.push(id);
      }

      const message =
        this.sessionConfig.numberOfSpies > 1 ? "one of the spies" : "the spy";
      await spy
        .createDM()
        .then((dm) => dm.send(`**Spyfall:** You are ${message}!`));
    }

    this.sessionConfig.spyIds = spyIds;

    const locationIndex = Math.floor(Math.random() * locations.length);
    const location = locations[locationIndex];
    const roles = Tools.shuffleArray(location.roles);

    players.forEach((player, i) =>
      player
        .createDM()
        .then((dm) =>
          dm.send(
            "**Spyfall:** You are not the spy. This round's location: " +
              location.location +
              "\nHere is the role you play at that location: " +
              roles[i]
          )
        )
    );

    const roundTime = this.sessionConfig.timeInMinutes * 60 * 1000;
    const formattedTime = this.formatMilliseconds(roundTime);
    await this.channel.send(
      `The round has started and so has the timer! You have ${formattedTime} to find the spy or the location (if you are the spy). Have fun!`
    );
    const firstRandomIndex = Math.floor(Math.random() * this.players.length);
    const firstQuestioner = this.players[firstRandomIndex];
    await this.channel.send(
      `<@${firstQuestioner.id}>, you are the first person to ask a question!`
    );

    this.sessionConfig.fullTimeMilliseconds = roundTime;
    this.sessionConfig.remainingMilliseconds = roundTime;
    this.sessionConfig.startTime = new Date();
    const fullGameDurationTimeout = setTimeout(async () => {
      await this.channel.send("The timer ran out!");
      await this.end();
    }, roundTime);

    const halfTime = roundTime / 2;
    const halfGameDurationTimeout = setTimeout(async () => {
      const formattedTime = this.formatMilliseconds(halfTime);
      await this.channel.send(
        `Half the time is over. You have ${formattedTime} left.`
      );
    }, halfTime);

    const oneMinuteRemainingTimeout = setTimeout(async () => {
      await this.channel.send("One minute remaining!");
    }, roundTime - 60 * 1000);

    this.sessionConfig.timeouts = [
      fullGameDurationTimeout,
      halfGameDurationTimeout,
      oneMinuteRemainingTimeout,
    ];
    this.sessionConfig.location = location.location;
  }

  handleInput(message: Message) {
    const command = message.content.split(" ")[0];
    switch (command) {
      case "!vote":
        this.vote(message);
        break;
      case "!reveal":
        this.reveal(message);
        break;
      case "!timer":
        this.showTimer(message);
        break;
      case "!locations":
        this.showLocations(message);
        break;
    }
  }

  async vote(message: Message) {
    if (this.sessionConfig.activeVote) {
      Tools.handleUserError(message, "There is already a vote going on!");
      return;
    }

    if (message.channel.type === "DM") {
      Tools.handleUserError(
        message,
        "Voting must be done in the main channel: <#" + this.channel.id + ">"
      );
      return;
    }

    const voted = message.mentions.members.first();
    if (!voted) {
      Tools.handleUserError(
        message,
        "you have to mention the user you suspect to be the spy"
      );
      return;
    }

    const playerIds = this.sessionConfig.players.map((player) => player.id);

    if (!playerIds.includes(message.author.id)) {
      Tools.handleUserError(
        message,
        "you are not in the game and cannot start a vote!"
      );
      return;
    }

    if (!playerIds.includes(voted.id)) {
      await Tools.handleUserError(message, "that user is not in the game!");
      return;
    }

    this.sessionConfig.activeVote = true;

    const votedIndex = playerIds.indexOf(voted.id);
    if (votedIndex > -1) {
      playerIds.splice(votedIndex, 1);
    }

    const thumbsDown = "👎";
    const thumbsUp = "👍";
    await this.channel.send(`Vote within the next ${voteTime / 1000} seconds!`);
    const voting = await Tools.addUniqueVote(
      message,
      [thumbsUp, thumbsDown],
      playerIds,
      voteTime,
      true
    );

    this.sessionConfig.activeVote = false;

    const upvotes = voting[thumbsUp];
    const isCounted =
      this.sessionConfig.spyIds.length === 1
        ? upvotes.length === playerIds.length
        : upvotes.length >= Math.floor(playerIds.length / 2);

    const isCorrect = this.sessionConfig.spyIds.includes(voted.id);

    if (isCounted) {
      // In either case, the player is indicted and removed from the list of players
      this.sessionConfig.players = this.sessionConfig.players.filter(
        (player) => player.id !== voted.id
      );

      await this.channel.send(
        `You decided! You guess that ${
          voted.displayName
        } is the spy and you were${isCorrect ? "" : " not"} correct!`
      );

      if (
        (!isCorrect && this.sessionConfig.endOnWrongVote) ||
        (isCorrect &&
          (this.sessionConfig.numberOfSpies === 1 ||
            this.sessionConfig.endAfterFirstSpy))
      ) {
        await this.end();
        return;
      }

      if (isCorrect) {
        const spies = this.sessionConfig.spyIds;
        const index = spies.indexOf(voted.id);
        if (index > -1) {
          this.sessionConfig.spyIds.splice(index, 1);
        }

        if (spies.length > 0) {
          await this.channel.send(
            "There are still spies remaining; the game continues."
          );
        } else {
          await this.channel.send("That was the last spy! You win!");
          await this.end();
        }
      } else if (
        this.sessionConfig.players.length / 2 <=
        this.sessionConfig.spyIds.length
      ) {
        await this.channel.send(
          "The spies managed to get the upper hand! The spies win!"
        );
        await this.end();
      }

      return;
    }

    const ignoredReason =
      this.sessionConfig.numberOfSpies === 1
        ? "wasn't unanimous"
        : "didn't reach majority";
    await this.channel.send(
      `Your vote ${ignoredReason}! The game continues...`
    );
  }

  async reveal(message: Message) {
    const { id } = message.author;
    const authorIsSpy = this.sessionConfig.spyIds.includes(id);
    if (message.channel.type !== "DM") {
      const cheeky = Math.random() < 0.05 ? " with me 😏" : "";
      Tools.handleUserError(
        message,
        `The !reveal command must be used in DMs${cheeky}.`
      );
      return;
    }

    if (!authorIsSpy) {
      Tools.handleUserError(
        message,
        "You are not the spy and cannot reveal yourself!"
      );
      return;
    }

    await this.channel.send(
      "The spy revealed themselves!\n<@" +
        id +
        "> send the location you believe this round takes place in. As a help, here is the list:\n" +
        locations.map((l) => l.location).join(", ") +
        ". Please check the spelling, otherwise I cannot know whether you are correct or not."
    );

    const normalize = (input: string) => input.trim().toLowerCase();
    const filter = (filterMessage: Message) =>
      filterMessage.author.id === message.author.id;

    let match;
    do {
      const response = await this.channel.awaitMessages({ filter, max: 1 });
      const responseLocation = response.first().content;

      match = locations
        .map((location) => location.location)
        .map(normalize)
        .find((location) => location === normalize(responseLocation));

      if (!match) {
        await this.channel.send(
          "I couldn't find any location with that name... Please check the spelling and try again."
        );
      }
    } while (!match);

    const correct = match === normalize(this.sessionConfig.location);

    if (correct) {
      const spy = `sp${this.sessionConfig.numberOfSpies > 1 ? "ies" : "y"}`;
      const text = `That's correct, congrats! The ${spy} wins this round!`;
      await this.channel.send(text);
      return this.end();
    }

    if (this.sessionConfig.endOnWrongReveal) {
      const text =
        "That is not correct, sorry! The correct location was " +
        this.sessionConfig.location +
        ". The players win!";
      await this.channel.send(text);
      return this.end();
    }

    this.sessionConfig.players = this.sessionConfig.players.filter(
      (player) => player.id !== message.author.id
    );

    const remainingSpies = this.sessionConfig.players.filter((player) =>
      this.sessionConfig.spyIds.includes(player.id)
    );

    const textBase = `That is not correct, sorry! <@${message.author.id}>, you are out!\n`;

    if (remainingSpies.length > 0) {
      await this.channel.send(`${textBase}The game continues!`);
    } else {
      await this.channel.send(
        `${textBase}That was the last spy, the spies lose!`
      );
      this.end();
    }
  }

  async showTimer(message: Message) {
    const end =
      this.sessionConfig.startTime.getTime() +
      this.sessionConfig.remainingMilliseconds;
    const now = Date.now();
    const remainingMilliseconds = end - now;
    const formattedTime = this.formatMilliseconds(remainingMilliseconds);
    await message.reply("You still have " + formattedTime + " left!");
  }

  async showLocations(message: Message) {
    const locationStrings = locations.map((location) => location.location);
    await message.reply(
      `Here are the locations: ${locationStrings.join(", ")}`
    );
  }

  formatMilliseconds(ms: number): string {
    let seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    const pSeconds = seconds.toString().padStart(2, "0");
    const pMinutes = minutes.toString().padStart(2, "0");

    return minutes > 0
      ? `${pMinutes}:${pSeconds} minute${
          minutes !== 1 && seconds === 0 ? "s" : ""
        }`
      : `${pSeconds} second${seconds !== 1 ? "s" : ""}`;
  }

  async end() {
    const getEndGameSpyMessage = () => {
      const pings = this.sessionConfig.spyIds.map((i) => `<@${i}>`);

      if (this.sessionConfig.numberOfSpies === 1) {
        return `The spy this round was ${pings[0]}`;
      }

      const anded = pings.pop();
      return `The spies this round where ${pings.join(", ")} and ${anded}`;
    };

    await this.channel.send(
      `${getEndGameSpyMessage()}; the location was ${
        this.sessionConfig.location
      }.`
    );

    this.sessionConfig.timeouts.forEach(clearTimeout);
    await super.end();
  }
}
