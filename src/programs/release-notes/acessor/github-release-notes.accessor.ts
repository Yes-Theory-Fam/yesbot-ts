import { createYesBotLogger } from "../../../log";
import axios from "axios";
import { GithubReleaseRepositoryType } from "../types/github-release.types";
import { GitHubCommitMessages } from "../types/github-commits-messages.types";

export class GithubReleaseNotesAccessor {
  private GITHUB_GRAPHQL_ENDPOINT: string = process.env.GITHUB_GRAPHQL_ENDPOINT;
  private GITHUB_TOKEN: string = process.env.GITHUB_TOKEN;

  public async getLastTwoTags(): Promise<GithubReleaseRepositoryType> {
    const query = `
      {
        repository(owner: "Yes-Theory-Fam", name: "yesbot-ts") {
          releases(last: 2) {
            edges {
              node {
                name
                publishedAt
                tagName
                description
              }
            }
          }
        }
      }`;

    return await this.getResponse(query).then(
      (response): GithubReleaseRepositoryType => response.data.data
    );
  }

  public async getCommitMessages(
    sinceDate: string,
    expression: string = "0.0.4"
  ): Promise<GitHubCommitMessages> {
    const query = `
      {
  repository(owner: "Yes-Theory-Fam", name: "yesbot-ts") {
    object(expression: "${expression}") {
      ... on Commit {
        history(first: 100, since: "${sinceDate}") {
          nodes {
            messageHeadline
          }
        }
      }
    }
  }
}`;
    return await this.getResponse(query).then(
      (response): GitHubCommitMessages => response.data.data
    );
  }

  private async getResponse(query: string) {
    return await axios
      .post(
        this.GITHUB_GRAPHQL_ENDPOINT,
        {
          query,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "token " + this.GITHUB_TOKEN,
          },
        }
      )
      .catch((e) =>
        logger.error("Failed to fetch release data from github", {
          status: e.response.status,
          statusText: e.response.statusText,
          data: e.response.data,
        })
      );
  }
}

const logger = createYesBotLogger("accessor", GithubReleaseNotesAccessor.name);
