declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL?: string;
    PORT?: string;
    PWD: string;
    BOT_TOKEN: string;
    GUILD_ID: string;
    OUTPUT_CHANNEL_ID: string;
    MAP_LINK?: string;
    MAP_ADD_DM_USER_ID?: string;
    MODERATOR_ROLE_NAME?: string;
    ENGINEER_ROLE_NAME?: string;
    MEMBER_ROLE_ID?: string;
    GITHUB_TOKEN?: string;
    GITHUB_GRAPHQL_ENDPOINT?: string;
    GOOGLE_API_KEY?: string;
    ACTIVITY_TIME?: string;
  }
}
