export const buddyProjectRoleName = `Buddy Project ${new Date().getFullYear()}`;

export const enum BuddyProjectError {
  NOT_SIGNED_UP = "NOT_SIGNED_UP",
  NOT_MATCHED = "NOT_MATCHED",
}

export const commonMessages: Record<BuddyProjectError, string> = {
  [BuddyProjectError.NOT_SIGNED_UP]: `It seems you have not signed up to this year's iteration of the buddy project! You can join at ${process.env.YTF_FRONTEND_URL}/buddyproject !`,
  [BuddyProjectError.NOT_MATCHED]:
    "It seems you haven't been matched yet! Have some patience, I will message you with your buddy and questions once you are matched, pinky promise!",
};
