declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT?: string;
    PWD: string;
    BOT_TOKEN: string;
    GUILD_ID: string;
    OUTPUT_CHANNEL_ID: string;
    MAP_LINK?: string;
    MAP_ADD_DM_USER_ID?: string;
    MODERATOR_ROLE_NAME?: string;
    ENGINEER_ROLE_NAME?: string;
    COORDINATOR_ROLE_NAME?: string;
    BUDDY_PROJECT_MATCHING?: string;
  }
}
