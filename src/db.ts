// Imported for side-effects. Used by typeorm
import "reflect-metadata";
import { createConnection } from "typeorm";

createConnection().then(async conn => {
    console.info("Database connection established.");
}).catch(err => {
    console.error("Database connection failed: ", err);
})
