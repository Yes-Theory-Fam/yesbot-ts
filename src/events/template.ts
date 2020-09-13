import { Client } from "discord.js";
import bot from "../index";

class Template {
  bot: Client;

  constructor() {
    this.bot = bot;
  }
}

export default Template;
