import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  InteractionResponse,
} from "discord.js";

/**
 * Allows you to paginate any amount of embeds created by a Slash Command
 */
export class Paginator {
  private readonly nextId;
  private readonly prevId;

  constructor(
    private pages: EmbedBuilder[],
    private interaction: ChatInputCommandInteraction,
    idPrefix: string
  ) {
    this.nextId = `${idPrefix}-next`;
    this.prevId = `${idPrefix}-prev`;
  }

  async flip(
    page: number,
    clickedButton: ButtonInteraction,
    interactionResponse: InteractionResponse
  ) {
    if (page < 0) page = 0;
    if (page >= this.pages.length) page = this.pages.length - 1;

    await clickedButton.update({ embeds: [this.pages[page]] });
    await this.setupPaging(page, interactionResponse);
  }

  async setupPaging(
    currentPage: number,
    interactionResponse: InteractionResponse
  ) {
    try {
      const clickedButton = await interactionResponse.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (button) =>
          button.user.id === interactionResponse.interaction.user.id,
        time: 60_000,
        idle: 60_000,
        dispose: false,
        interactionResponse,
      });

      if (clickedButton.customId === this.prevId) {
        await this.flip(currentPage - 1, clickedButton, interactionResponse);
      } else if (clickedButton.customId === this.nextId) {
        await this.flip(currentPage + 1, clickedButton, interactionResponse);
      }
    } catch (error) {}
  }

  async paginate() {
    const components = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          customId: this.prevId,
          label: "Previous",
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          customId: this.nextId,
          label: "Next",
          style: ButtonStyle.Primary,
        }),
      ],
    });

    const interactionReply = await this.interaction.reply({
      ephemeral: true,
      embeds: [this.pages[0]],
      components: this.pages.length > 1 ? [components] : undefined,
    });

    await this.setupPaging(0, interactionReply);
  }
}
