import "reflect-metadata";
import { PrismaClient } from "./__generated__/prisma/client.js";
import { createYesBotLogger } from "./log.js";
import { PrismaPg } from "@prisma/adapter-pg";

const logger = createYesBotLogger("db", "init");
logger.debug("Creating PrismaClient instance");
const adapter = new PrismaPg({
  connectionString: process.env.PRISMA_DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
