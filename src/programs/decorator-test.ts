// This File is commeted out, so we have a reference fo handler, but they will not launch with the bot
// import {
//   ButtonInteraction,
//   Client,
//   Message,
//   MessageActionRow,
//   MessageButton,
//   MessageReaction,
//   User,
//   VoiceState,
// } from "discord.js";
// import {
//   Command,
//   CommandHandler,
//   DiscordEvent,
//   EventLocation,
//   HandlerRejectedReason,
// } from "../event-distribution";
// import { GuildMemberUpdateArgument } from "../event-distribution/events/guild-member-update";
// import { MemberLeaveArgument } from "../event-distribution/events/member-leave";
// import { VoiceStateChange } from "../event-distribution/events/voice-state-update";
//
// /**
//  * Example of a stateless message handler (stateful: true missing in config).
//  * Each time the command is run, a new instance is created so the counter resets.
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   description: "",
//   trigger: "!test",
//   channelNames: ["permanent-testing"],
// })
// export class DecoratorTest extends CommandHandler<DiscordEvent.MESSAGE> {
//   called: number = 0;
//
//   handle(): void {
//     ++this.called;
//     console.log(`Called handler 1 ${this.called} times`);
//   }
// }
//
// /**
//  * Example of a stateful message handler.
//  * Since this is kept as a singleton, the increasing counter is maintained.
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   description: "",
//   trigger: "!test",
//   stateful: true,
//   channelNames: ["bot-output"],
//   location: EventLocation.ANYWHERE,
//   allowedRoles: ["Support"],
// })
// export class DecoratorTest2 extends CommandHandler<DiscordEvent.MESSAGE> {
//   called: number = 0;
//
//   async handle(message: Message): Promise<void> {
//     ++this.called;
//     console.log(`Called handler 2 ${this.called} times`);
//   }
// }
//
// /**
//  * Example of a DM only message handler.
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   description: "",
//   trigger: "yeet",
//   stateful: true,
//   location: EventLocation.DIRECT_MESSAGE,
//   channelNames: ["bot-output"],
// })
// export class DecoratorTest3 extends CommandHandler<DiscordEvent.MESSAGE> {
//   called: number = 0;
//
//   handle(message: Message): void {
//     ++this.called;
//     console.log(`Called handler 3 ${this.called} times`);
//   }
// }
//
// /**
//  * Example of a ReactionAdd Handler.
//  */
// @Command({
//   event: DiscordEvent.REACTION_ADD,
//   description: "What gives?",
//   stateful: false,
//   emoji: "🤓",
//   channelNames: ["bot-output"],
// })
// export class DecoratorTest4 extends CommandHandler<DiscordEvent.REACTION_ADD> {
//   handle(reaction: MessageReaction, user: User): void {
//     console.log("Called handler 4");
//   }
// }
//
// /**
//  * Example of a MemberUpdate Handler
//  */
// @Command({
//   event: DiscordEvent.GUILD_MEMBER_UPDATE,
//   description: "Weee",
//   roleNamesAdded: ["Yes Theory"],
//   roleNamesRemoved: ["Seek Discomfort"],
// })
// export class DecoratorTest5 extends CommandHandler<DiscordEvent.GUILD_MEMBER_UPDATE> {
//   handle(
//     oldMember: GuildMemberUpdateArgument,
//     newMember: GuildMemberUpdateArgument
//   ): void {
//     console.log("Called handler 5");
//   }
// }
//
// /**
//  * Example of a Ready Handler
//  */
// @Command({
//   event: DiscordEvent.READY,
//   description: "Called when the bot is ready to receive events.",
// })
// export class DecoratorTest6 extends CommandHandler<DiscordEvent.READY> {
//   handle(client: Client): void {
//     console.log("Called handler 6");
//   }
// }
//
// /**
//  * Example of a VoiceStateUpdate Handler on join and switch channel
//  */
// @Command({
//   event: DiscordEvent.VOICE_STATE_UPDATE,
//   changes: [VoiceStateChange.JOINED, VoiceStateChange.SWITCHED_CHANNEL],
//   description: "Called when anyone joins or switches channels",
// })
// export class DecoratorTest7 extends CommandHandler<DiscordEvent.VOICE_STATE_UPDATE> {
//   handle(oldState: VoiceState, newState: VoiceState): void {
//       console.log("Called handler 7");
//   }
// }
//
// /**
//  * Example of a MemberLeave Handler
//  */
// @Command({
//   event: DiscordEvent.MEMBER_LEAVE,
//   description: "Called when a member leaves the server.",
// })
// export class DecoratorTest8 extends CommandHandler<DiscordEvent.MEMBER_LEAVE> {
//   handle(member: MemberLeaveArgument): void {
//     console.log("Called handler 8");
//   }
// }
//
// /**
//  * Example of a Message handler with a subtrigger
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   trigger: "!test",
//   subTrigger: "case",
//   description: "",
// })
// export class DecoratorTest9 extends CommandHandler<DiscordEvent.MESSAGE> {
//   handle(message: Message): void {
//     console.log("Called handler 9");
//   }
// }
//
// /**
//  * Example of a Message handler with whitelisted category names
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   trigger: "!test",
//   channelNames: ["minecraft"],
//   categoryNames: ["Gaming"],
//   description: "",
// })
// export class DecoratorTest10 extends CommandHandler<DiscordEvent.MESSAGE> {
//   handle(message: Message): void {
//     console.log("Called handler 10");
//   }
// }
//
// /**
//  * Example of a Message handler that responds with a role missing error
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   trigger: "!test",
//   allowedRoles: ["Break"],
//   description: "Won't be called if the user doesn't have the break role",
//   errors: {
//     [HandlerRejectedReason.MISSING_ROLE]:
//       "It looks like you don't have the Break role! There can be some extra text here.",
//   },
// })
// export class DecoratorTest11 extends CommandHandler<DiscordEvent.MESSAGE> {
//   handle(message: Message): void {
//     console.log("Called handler 11");
//   }
// }
//
// /**
//  * Example of a Message handler that responds with an error generated during handling
//  */
// @Command({
//   event: DiscordEvent.MESSAGE,
//   trigger: "!poof",
//   description:
//     "Will be called but fails; the error will be communicated to the user.",
//   errors: {
//     "Custom Error": "Some custom error occured during execution :c",
//   },
// })
// export class DecoratorTest12 extends CommandHandler<DiscordEvent.MESSAGE> {
//   handle(message: Message): void {
//     throw new Error("Custom Error");
//   }
// }
//
// @Command({
//   event: DiscordEvent.MESSAGE,
//   trigger: "!button",
//   description: "Creates an example button",
// })
// class DecoratorTest13Helper extends CommandHandler<DiscordEvent.MESSAGE> {
//   async handle(message: Message): Promise<void> {
//     const button = new MessageButton({
//       customId: "example-button",
//       style: "PRIMARY",
//       label: "tadaaa",
//     });
//
//     const actions = new MessageActionRow().addComponents(button);
//     await message.reply({ content: "Tadaaaaa", components: [actions] });
//   }
// }
//
// /**
//  * Example of a button click handler
//  */
// @Command({
//   event: DiscordEvent.BUTTON_CLICKED,
//   customId: "example-button",
// })
// class DecoratorTest13 extends CommandHandler<DiscordEvent.BUTTON_CLICKED> {
//   handle(button: ButtonInteraction): void {
//     console.log("Handler 13 called");
//   }
// }
