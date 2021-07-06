# Event Distribution

The event distribution is the core of YesBot, responsible for loading all commands and event handlers and calling the
relevant ones when a new event comes in from Discord.

When initialized, an instance of the distribution imports all `*.ts` files in the programs directory. Classes decorated
with `@Command` will be registered as event handler in the instance.

## Implementing a new event handler

The basic structure of an event handler is basically set in stone:

```ts
import { Command, CommandHandler, DiscordEvent } from "../event-distribution";

@Command({ /* options */ })
export class SomeEventHandler extends CommandHandler</* DiscordEvent.EVENT_NAME */> {
  handle(/* arguments */): void {
    /* Implementation */
  }
}
```

### Base Options

These options are available for most event handler configurations:

```ts
interface BaseOptions {
  event: DiscordEvent; // Indicates the relevant event
  stateful?: boolean; // If false (default), a new instance of the handler class is created for each event, otherwise an instance is available as singleton for the lifetime of the bot 
  description: string; // A descriptive string of the event handler
  requiredRoles?: string[]; // An array of role names. All roles listed are required to run the handler.
  channelNames?: string[]; // An array of channel names. The handler will only be called when the event occured in one of the channels listed.
  location?: EventLocation; // A location enum setting where events are accepted. The default is EventLocation.SERVER if channelNames or requiredRoles is non-empty, EventLocation.ANYWHERE otherwise.
}
```

### Events

There are a few variables in there which are mostly based on the different events, so let's go over them and their
details first.

#### Message

The bot receives a message event when anyone sends a message in any channel the bot can read in (including DMs).

##### Options

Additionally, to the [BaseOptions](#base-options), the following options are available:

```ts
interface MessageOptions {
  trigger: string; // Defines the trigger for the handler. This MUST NOT contain spaces, since the distribution instance looks up the handler by first word (split by space).
}
```

##### Enum

Use `DiscordEvent.MESSAGE` as event in the decorator's options and generic argument for the `CommandHandler`.

##### Arguments

The handler function is called with the Discord.JS `Message` object received as event.

#### Reaction Add | Reaction Remove

The bot receives an event when a reaction is added or removed in any channel visible to the bot (including DMs).

##### Options

Additionally, to the [BaseOptions](#base-options), the following options are available:

```ts
interface ReactionEventHandlerOptions {
  emoji: string; // Defines the emoji triggering the handler
}
```

##### Enum

Use `DiscordEvent.REACTION_ADD` and `DiscordEvent.REACTION_REMOVE` for the respective events as event in the decorator's
options and generic argument for the `CommandHandler`;

##### Arguments

The handler function is called with the Discord.JS `MessageReaction` and `User` objects received as event.

#### Guild Member Update

The bot receives an event when a guild member is updated. That includes role changes and nickname changes for example.

##### Options

The following options are available:

```ts
interface GuildMemberUpdateEventHandlerOptions {
  roleNamesAdded?: string[]; // When any of these roles are added, the handler is called
  roleNamesRemoved?: string[]; // When any of these roles are removed, the handler is called
}
```

##### Enum

Use `DiscordEvent.GUILD_MEMBER_UPDATE` as event in the decorator's options and generic argument for the `CommandHandler`.

##### Arguments

The handler function is called with two `GuildMember | PartialGuildMember` objects, the first representing the member before the change, the second after the change.

#### Ready

The bot receives an event when it has successfully logged into the Discord Gateway.

##### Options

This event has no additional options besides the event enum.

##### Enum

Use `DiscordEvent.READY` as event in the decorator's options and generic argument for the `CommandHandler`.

##### Arguments

The handler function is called with the `Client` that is now ready.
#### Member Leave

The bot receives an event when a guild member leaves, is kicked or banned.

##### Options

There are no options available for this event.

##### Enum

Use `DiscordEvent.MEMBER_LEAVE` as event in the decorator's options and generic argument for the `CommandHandler`.

##### Arguments

The handler function is called with one `GuildMember | PartialGuildMember` object, which represents the member that left the server.

#### Voice State Update

The bot receives an event when a member's voice state changes. This includes muting, deafening, joining and leaving rooms, etc.

##### Options

The following options are available:

```ts
export interface VoiceStateUpdateEventHandlerOptions {
  changes: [VoiceStateChange, ...VoiceStateChange[]]; // A list of all changes that should trigger the handler
}
```

##### Enum

Use `DiscordEvent.VOICE_STATE_UPDATE` as event in the decorator's options and generic argument for the `CommandHandler`.

##### Arguments

The handler is called with two `VoiceState` objects. The first containing the state before, the second after the change.
