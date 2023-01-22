import { ChatInputCommandInteraction } from "discord.js";

export enum VoiceOnDemandErrors {
  ALREADY_HAS_ROOM = "ALREADY_HAS_ROOM",
  HAS_NO_ROOM = "HAS_NO_ROOM",
  MISSING_YES_THEORY_ROLE = "MISSING_YES_THEORY_ROLE",
}

export const minMembers = 2;
export const maxMembers = 10;

export const permissionErrors = {
  [VoiceOnDemandErrors.MISSING_YES_THEORY_ROLE]: `You need the Yes Theory role to use |/voice| commands! You can get it by hopping in voice chats with other members.`,
};

export const editErrors = {
  [VoiceOnDemandErrors.HAS_NO_ROOM]:
    "You don't have a voice channel. You can create one using |/voice create|!",
};

export const ensureHasYesTheory = (
  interaction: ChatInputCommandInteraction
) => {
  let roleNames = interaction.member?.roles ?? [];
  if (!Array.isArray(roleNames)) {
    roleNames = roleNames.cache.map((r) => r.name);
  }

  const hasYesTheory = roleNames.includes("Yes Theory");

  if (!hasYesTheory) {
    throw new Error(VoiceOnDemandErrors.MISSING_YES_THEORY_ROLE);
  }
};
