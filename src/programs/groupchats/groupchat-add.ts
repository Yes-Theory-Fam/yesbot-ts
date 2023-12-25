import {
  Command,
  CommandHandler,
  DiscordEvent,
} from "../../event-distribution";
import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { GroupchatService } from "./services/groupchat-service";
import { Groupchat_Platform_Input } from "../../__generated__/types";

@Command({
  event: DiscordEvent.SLASH_COMMAND,
  root: "groupchat",
  subCommand: "add",
  description: "Add a groupchat to yestheory.family",
  global: true,
  allowDms: true,
  options: [],
})
class GroupchatAdd extends CommandHandler<DiscordEvent.SLASH_COMMAND> {
  public async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    const isInGuild = interaction.inGuild();
    await interaction.deferReply({ ephemeral: isInGuild });

    const userId = interaction.user.id;

    const groupchatService = new GroupchatService();
    const mayCreateGroupchat =
      await groupchatService.mayCreateGroupchat(userId);

    if (!mayCreateGroupchat) {
      await interaction.editReply(
        `You are not allowed to create a groupchat. Make sure that you have access to the [YTF CMS](${process.env.YTF_CMS_URL}).`
      );
      return;
    }

    const platformSelectId = `platform-select-${userId}`;
    const availablePlatforms = Object.entries(Groupchat_Platform_Input).map(
      ([k, v]) => ({ label: k, value: v.toString() })
    );
    const platformSelection = new StringSelectMenuBuilder({
      placeholder: "Platform",
      customId: platformSelectId,
      options: availablePlatforms,
    });
    const platformSelectionComponents =
      new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [platformSelection],
      });
    const platformSelectMessage = await interaction.editReply({
      content:
        "Let's gather some information then. First: What platform is the chat / group on:",
      components: [platformSelectionComponents],
    });
    const platformSelectionInteraction =
      await platformSelectMessage.awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (c) => c.customId === platformSelectId,
      });

    const platform = platformSelectionInteraction
      .values[0] as Groupchat_Platform_Input;

    const informationModalId = `information-modal-${userId}`;
    const components = [
      new TextInputBuilder({
        label: "Name",
        placeholder: "Name",
        customId: "groupchat-name",
        required: true,
        maxLength: 120,
        style: TextInputStyle.Short,
      }),
      new TextInputBuilder({
        label: "Url",
        placeholder: "https://example.com",
        customId: "groupchat-url",
        required: true,
        style: TextInputStyle.Short,
      }),
      new TextInputBuilder({
        label: "Description",
        placeholder: "Description",
        customId: "groupchat-description",
        required: false,
        maxLength: 500,
        style: TextInputStyle.Paragraph,
      }),
    ];
    await platformSelectionInteraction.showModal({
      title: "Other information",
      customId: informationModalId,
      components: components.map(
        (t) => new ActionRowBuilder<TextInputBuilder>({ components: [t] })
      ),
    });

    const modalInteraction =
      await platformSelectionInteraction.awaitModalSubmit({
        filter: (c) => c.customId === informationModalId,
        time: 60 * 60 * 1000,
      });

    await modalInteraction.deferReply({ ephemeral: isInGuild });

    const name = modalInteraction.fields.getTextInputValue("groupchat-name");
    const url = modalInteraction.fields.getTextInputValue("groupchat-url");
    const description = modalInteraction.fields.getTextInputValue(
      "groupchat-description"
    );

    const groupchatData = {
      name,
      url,
      description,
      platform,
    };

    const createdId = await groupchatService.createGroupchat(
      userId,
      groupchatData
    );

    await interaction.deleteReply();

    if (createdId) {
      await modalInteraction.editReply(
        `Groupchat "${name}" created successfully! You can edit it under ${process.env.YTF_CMS_URL}/admin/collections/groupchats/${createdId}`
      );
    } else {
      await modalInteraction.editReply("Failed to create groupchat.");
    }
  }
}
