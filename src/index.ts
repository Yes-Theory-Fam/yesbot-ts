import { createYesBotLogger } from "./log";
import { Bot } from "./bot";


const logger = createYesBotLogger("main", "index");
logger.info("Starting YesBot");

const bot = Bot.getInstance();
export default bot;
module.exports = Bot; // Required for require() when lazy loading.
