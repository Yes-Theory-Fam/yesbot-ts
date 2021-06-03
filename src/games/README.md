# Games Documentation

<!-- toc -->

- [`GameSession<T extends SessionConfig>`](#gamesessiont-extends-sessionconfig)
- [`SessionConfig`](#sessionconfig)
- [Configuration](#configuration)
    * [`NodeProperties`](#nodeproperties)
    * [`ConfigurationKeyBase<T>`](#configurationkeybaset)
    * [`BooleanConfigurationKey`](#booleanconfigurationkey)
    * [`StringConfigurationKey` & `EmojiConfigurationKey`](#stringconfigurationkey--emojiconfigurationkey)
        + [`SelectionConfigurationKey<string>`](#selectionconfigurationkeystring)
        + [`InputConfigurationKey<string>`](#inputconfigurationkeystring)
    * [`NumberConfigurationKey`](#numberconfigurationkey)
        + [`SelectionConfigurationKey<number>`](#selectionconfigurationkeynumber)
        + [`InputConfigurationKey<number>`](#inputconfigurationkeynumber)
        + [`NumberRangeConfigurationKey`](#numberrangeconfigurationkey)
        + [`Affixable`](#affixable)
    * [Nested configurations](#nested-configurations)
- [Registering the game](#registering-the-game)

<!-- tocstop -->

When developing a game for YesBot, make sure to create a new directory under `src/games` with the name of your game
which contains all files needed for your game.

To actually implement the game using the helpers provided by the GameHub class, you need to create one interface and one
class, extending existing types. One is the `SessionConfig` for your game that holds all information about an ongoing
game. The other is the actual `GameSession` itself:

```ts
import { GameSession, SessionConfig } from "../game-session";

interface ExampleSessionConfig extends SessionConfig {
  example: string;
}

export class ExampleGame extends GameSession<ExampleSessionConfig> {

}
```

Now implement the game following the documentation below.

Once you have your game in place, you can [register it](#registering-the-game) with the bot.

After your bot has restarted, you should see your game in the list of games displayed when running `!game`

To see your bot in YesBot running on [the server](https://discord.gg/yestheory), feel free to open a Pull Request!

## `GameSession<T extends SessionConfig>`

This is the class your game should extend when implementing your own game, following are the properties in order of use
in the code.

- `static config: GameConfig<T>` - (required) An object containing details about your game containing the following
  values:
    - `emoji: string` - (required) An emoji that is displayed in the game list and used for the sign up message
    - `name: string` - (required) The name of the game
    - `rules: string` - (required) A string containing the rules of the game, explaining how it works in general.
    - `howToPlay: string` - (required) A string containing information on how to play the game with the bot (are there
      commands that need to be used for example)
    - `configuration?: object` - An object containing configuration options for configurable values in your game. This
      takes a little more explanation so head to [the configuration section]() for that
    - `minPlayers?: number` - The minimum number of players your game needs. If not enough people are pinged or sign up,
      the bot won't start a new game
    - `maxPlayers?: number` - The maximum number of players your game can be played with. If too many members are
      pinged, the bot won't start a new game. With open sign ups, the game will start once the maximum number of players
      have joined.
    - `voiceRequired?: boolean` - If this is `true`, the bot will create a voice channel in addition to the text channel
      and mention that there is a voice channel to join.
- `protected sessionConfig: Partial<T>` - (required) The current session's configuration
- `public async signUp(): Promise<GuildMember[]>` - This function is called by the GameHub when an open signup happens.
  It's not recommended to override this function (especially not to introduce side effects) but it might be useful for
  you. The default behaviour should suffice for most games however. If you override this, you may not assume that the
  players returned are all going to be in the session when it starts since a player may already play another game.
- `public async patchConfig(partial: Partial<T>, channel: TextChannel, players: GuildMember[], leaderId: Snowflake, voiceChannel: VoiceChannel | undefined): Promise<void>`
    - This function allows you to update the configuration after the game leader has configured the game. *You only need
      this if you need to make changes to the values configured in the menu!* Spyfall uses this to lower the number of
      spies if it's too high for example. If you override this config, be sure to call the super function.
        - `partial` - The values set from the configuration menu
        - `channel` - The text channel that was created for this session
        - `players` - The guild members that are in the game
        - `leaderId` - The Discord.js Snowflake (ID) of the game leader
        - `voiceChannel` - The voice channel created for this session or undefined if `config#voiceRequired` is falsy
- `public start(): void` - (required) Called when the game session is started. This is where your game's logic goes!
  When implementing, call `super.start()` as the first line in the function to automatically send `config#howToPlay`
  and `config#rules`
- `public handleInput(message: Message): void` - Called when any message is sent in either the session's text channel or
  any of the player's DMs. *You must not use any of the following commands in your game as they are already used:*
    - `*!menu*`
    - `!rules`
    - `!howtoplay`
    - `!end`
- `public async end(): Promise<void>` - This is called to indicate the game has ended. It may be called from the GameHub
  when the game leader used `!end`. You may override this function to clean up remaining resources (like timeouts or
  intervals for example). *You must call `super.end()` at the end of the override!*

## `SessionConfig`

SessionConfig is the base interface used for all game session's configurations. The values of these four properties here
are generally handled by the bot, and you shouldn't have to assign them anywhere.

- `channel: TextChannel` - The text channel of the session
- `leaderId: Snowflake` - The Discord.js Snowflake (ID) of the game leader
- `players: GuildMember[]` - The guild members that are in the game
- `voiceChannel?: VoiceChannel` - The voice channel created for this session or undefined if `config#voiceRequired` is
  falsy

## Configuration

The bot allows you to make your game configurable by providing an object of configuration options in the static `config`
field. This section details how to use it.

You have the option to provide different types of options for different types of values but all keys share the following
properties:

### `NodeProperties`

- `emoji: string` - (required) The emoji displayed in the menu and used to select configuring that item. While currently
  possible, *you must not use the same emoji twice in your configuration!*
- `displayName: string` - (required) The displayed name of the configuration item to make it easier for the players to
  understand what they are configuring
- `description?: string` - A short description of the configurable option(s)

and

### `ConfigurationKeyBase<T>`

- `defaultValue: T` - (required) The default value of this configuration option. For configuration keys that allow
  selection from a range of options, the default value must be part of that selection or range
- `type: TypeToKeyType<T>` - (required) This value *must* match the correct value type of the generic parameter `T`:
    - `T extends boolean` - `"boolean"`
    - `T extends string` - `"string" | "emoji"`
    - `T extends number` - `"number"`

### `BooleanConfigurationKey`

To configure a boolean selection, you have to provide an object of the following form:

```ts
const example = {
  type: "boolean",
  options: "selection",
  defaultValue: bool,
  emoji: string,
  displayName: string,
}
```

### `StringConfigurationKey` & `EmojiConfigurationKey`

To configure string configuration options, you can configure emojis and "normal" strings. They are handled differently
by the configurator (additional validation for emojis and a nicer display). This is done by setting the `type`
accordingly to either `"string"` or `"emoji"`.

#### `SelectionConfigurationKey<string>`

To allow your users to pick a value (either from a set of strings or a set of emojis), use a configuration like this:

```ts
const example = {
  type: "string" | "emoji",
  options: "selection",
  selection: string[],
  defaultValue: string,
  emoji: string,
  displayName: string,
}
```

- `selection` - (required) An array of at least two, at max twenty strings. If `type` is `"emoji"`, all of them have to be an
  emoji.

#### `InputConfigurationKey<string>`

To allow your users to input a value, use a configuration like this:

```ts
const example = {
  type: "string" | "emoji",
  options: "input",
  defaultValue: string,
  emoji: string,
  displayName: string,
}
```

### `NumberConfigurationKey`

To configure number configuration options, the same two variants exist as for strings, as well as a third one to allow
picking from a number range.

#### `SelectionConfigurationKey<number>`

To allow your users to pick a value from a specific set of numbers, use a configuration like this:

```ts
const example = {
  type: "number",
  options: "selection",
  selection: number[],
  defaultValue: number,
  emoji: string,
  displayName: string,
}
```

- `selection` - (required) An array of at least two, at max twenty numbers.

#### `InputConfigurationKey<number>`

To allow your users to input a value, use a configuration like this:

```ts
const example = {
  type: "number",
  options: "input",
  defaultValue: number,
  emoji: string,
  displayName: string,
}
```

#### `NumberRangeConfigurationKey`

To allow your users to select a number from a range from min - max, use a configuration like this:

```ts
const example = {
  type: "number",
  options: "range",
  defaultValue: number,
  min: number,
  max: number,
  emoji: string,
  displayName: string,
}
```

- `min` - (required) The lowest selectable value
- `max` - (required) The highest selectable value (inclusive)

#### `Affixable`

`NumberRangeConfigurationKey` and the `SelectionConfigurationKey<number>` allow additional configuration to add strings
before and after each values by extending the `Affixable` interface:

- `prefix?: string` - String to add before each value in the configuration display
- `suffix?: string` - String to add after each value in the configuration display

### Nested configurations

If the type of your session's config contains nested keys, they are supported too. Given the following:

```ts
interface ExampleSessionConfig extends SessionConfig {
  nested: {
    numberInput: number;
    stringInput: string;
  }
}
```

You can create a configuration like this:

```ts
const configuration = {
  nested: {
    properties: {
      emoji: string,
      displayName: string,
      description?: string,
    },
    numberInput: /* Your number configuration */,
    stringInput: /* Your number configuration */,
  }
}
```

## Registering the game

For the bot to pick up your game, you have to register it to the GameHub:

1. Make sure your game class is exported from your file
2. Re-export it from `src/games/index.ts` (you can see how it's done with Spyfall and other games). Add your game, so
   the exports are in alphabetical order
3. Add your game to the imports in `src/programs/game.ts`. Again, maintain alphabetical order of the imports
4. Add a line inside the `initGameHub` function containing `hub.registerGame(YourGame)`. One last time, you guessed it,
   in alphabetical order; that makes things easier to read and maintain
5. Done! When you start the bot now and run `!game` in #bot-games, your game should show up!

**Note:** When starting, the bot will validate the configurations of all games added to make sure there are no issues
like duplicate emojis, too many (or too little) selection options, etc. The bot won't be able to start with
configuration issues in any of the registered games. Make sure to read the log output if this happens and correct your
game's configuration accordingly.

The bot doesn't detect all possible issues with the configuration yet but probably most common ones. 
