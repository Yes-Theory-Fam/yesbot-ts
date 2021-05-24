import { Client } from "discord.js";
import { Bot } from "../bot";

class Template {
  client: Client;

  constructor() {
    this.client = Bot.getInstance().getClient();
  }
}

export default Template;
