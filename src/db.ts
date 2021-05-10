// Imported for side-effects. Used by typeorm
import "reflect-metadata";
import { createConnection } from "typeorm";
import { createYesBotLogger } from "./log";

const logger = createYesBotLogger("db", "init");

createConnection().then(async _ => {
    logger.info("Database connection established.");
}).catch(err => {
    logger.error("Database connection failed: ", err);
})
