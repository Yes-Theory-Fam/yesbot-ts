export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};

export enum BuddyProjectStatus {
  Matched = "MATCHED",
  NotSignedUp = "NOT_SIGNED_UP",
  SignedUp = "SIGNED_UP",
}

export enum MarkGhostedError {
  AlreadyMarked = "ALREADY_MARKED",
  BuddyMarkedAlready = "BUDDY_MARKED_ALREADY",
  NotMatched = "NOT_MATCHED",
  NotSignedUp = "NOT_SIGNED_UP",
  WaitedTooLittle = "WAITED_TOO_LITTLE",
}
