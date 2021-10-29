import { GithubReleaseNotesAccessor } from "../acessor/github-release-notes.accessor";
import {
  Edge,
  GithubReleaseRepositoryType,
} from "../types/github-release.types";
import prisma from "../../../prisma";
import { Release } from "@yes-theory-fam/database/client";

interface ResponseType {
  releaseNotes: string;
  tagMessage: string;
}

export class GithubReleaseNotesUsecase {
  private githubReleaseNotesAccessor;

  constructor() {
    this.githubReleaseNotesAccessor = new GithubReleaseNotesAccessor();
  }

  public async handle(): Promise<ResponseType> {
    const { oldRelease, newRelease } =
      await this.fetchLatestReleasesFormGitHub();
    const latestRelease = await prisma.release.findFirst({
      where: { releaseTime: newRelease.node.publishedAt },
      orderBy: { releaseTime: "desc" },
    });
    let tagMessage = !!newRelease.node.description
      ? newRelease.node.description
      : "";
    if (!!latestRelease) {
      return {
        tagMessage: "",
        releaseNotes: "",
      };
    }
    const lastRelease = await this.findLastRelease(oldRelease);
    const releaseNotes = await this.getCommitMessages(
      lastRelease,
      newRelease.node.tagName
    );
    await this.saveRelease(newRelease);

    const isPatchRelease = GithubReleaseNotesUsecase.isPatchRelease(
      newRelease.node.tagName
    );
    const releaseNoteMessage = this.createReleaseNotes(releaseNotes);
    if (isPatchRelease) {
      return { tagMessage: "", releaseNotes: releaseNoteMessage };
    }

    tagMessage = `**${newRelease.node.name}**\n${tagMessage}`;
    return { tagMessage, releaseNotes: releaseNoteMessage };
  }

  private static isPatchRelease(tagName: string): boolean {
    const split = tagName.split(".");
    if (split.length !== 3) return false;

    return Number(split[2]) !== 0;
  }

  private async fetchLatestReleasesFormGitHub() {
    const { oldRelease, newRelease } = await this.githubReleaseNotesAccessor
      .getLastTwoTags()
      .then((data) => {
        return this.sortLatestReleases(data);
      });
    return { oldRelease, newRelease };
  }

  private sortLatestReleases(data: GithubReleaseRepositoryType) {
    const edges = data.repository.releases.edges;
    const sortedData = edges.sort((a, b) => {
      return (
        new Date(a.node.publishedAt).getTime() -
        new Date(b.node.publishedAt).getTime()
      );
    });
    const oldRelease = sortedData[0];
    const newRelease = sortedData[1];
    return { oldRelease, newRelease };
  }

  private async getCommitMessages(lastRelease: Release, tagName: string) {
    const response = await this.githubReleaseNotesAccessor.getCommitMessages(
      lastRelease.releaseTime,
      tagName
    );
    let releaseNotes: string = "";
    response.repository.object.history.nodes.forEach((value) => {
      releaseNotes += `> * ${value.messageHeadline}\n`;
    });
    return releaseNotes;
  }

  private async findLastRelease(oldRelease: Edge) {
    let result = await prisma.release.findFirst({
      where: { releaseTime: oldRelease.node.publishedAt },
    });

    if (!result) {
      result = await this.saveRelease(oldRelease);
    }
    return result;
  }

  private async saveRelease(release: Edge) {
    return await prisma.release.create({
      data: {
        releaseName: release.node.name,
        releaseTime: release.node.publishedAt,
        releaseTag: release.node.tagName,
      },
    });
  }

  private createReleaseNotes(releaseNotes: string) {
    return `Hello everyone :wave: I'm back after a short break :sleeping:
During this time I have been worked on a lot. Here is a small overview:

${releaseNotes}
So now back to work :tools:     
`;
  }
}
