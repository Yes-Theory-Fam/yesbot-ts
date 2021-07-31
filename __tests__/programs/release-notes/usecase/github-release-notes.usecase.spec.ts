import { GithubReleaseNotesUsecase } from "../../../../src/programs/release-notes/usecase/github-release-notes.usecase";
import {
  GithubReleaseRepositoryType,
  Node,
} from "../../../../src/programs/release-notes/types/github-release.types";
import { GithubReleaseNotesAccessor } from "../../../../src/programs/release-notes/acessor/github-release-notes.accessor";
import { Release } from "@yes-theory-fam/database/client";

jest.mock(
  "../../../../src/programs/release-notes/acessor/github-release-notes.accessor"
);

describe("GithubReleaseNotesUsecase", () => {
  let githubReleaseNotesAccessor: GithubReleaseNotesAccessor;
  let githubReleaseNotesUsecase: GithubReleaseNotesUsecase;

  beforeEach(() => {
    const getCommitMessagesResponse = {
      repository: {
        object: {
          history: {
            nodes: [
              {
                messageHeadline:
                  "chore(DOCKERFILE): docker image migrates th database by start",
              },
              {
                messageHeadline:
                  "chore(DOCKERFILE): docker image migrates th database by start",
              },
            ],
          },
        },
      },
    };
    githubReleaseNotesUsecase = new GithubReleaseNotesUsecase();

    githubReleaseNotesAccessor = new GithubReleaseNotesAccessor();
    githubReleaseNotesAccessor.getCommitMessages = jest.fn(() =>
      Promise.resolve(getCommitMessagesResponse)
    );
    githubReleaseNotesUsecase["githubReleaseNotesAccessor"] =
      githubReleaseNotesAccessor;
  });
  it("should sort Releases", () => {
    const input: GithubReleaseRepositoryType = {
      repository: {
        releases: {
          edges: [
            {
              node: {
                publishedAt: "2021-07-01T01:00:00Z",
              } as Node,
            },
            {
              node: {
                publishedAt: "2020-07-01T01:00:00Z",
              } as Node,
            },
          ],
        },
      },
    };

    const result = {
      oldRelease: { node: { publishedAt: "2020-07-01T01:00:00Z" } },
      newRelease: { node: { publishedAt: "2021-07-01T01:00:00Z" } },
    };

    expect(githubReleaseNotesUsecase["sortLatestReleases"](input)).toEqual(
      result
    );
  });

  it("should return git commit message", async () => {
    const release: Release = {
      id: "921332c4-64fb-46f2-8f8c-a6d6741934ed",
      releaseName: "test",
      releaseTime: "2020-07-01T01:00:00Z",
      releaseTag: "1.0.0",
      created: new Date("2020-07-01T01:00:00Z"),
    };

    githubReleaseNotesUsecase["getCommitMessages"](release, "2.0.0").then(
      (result) => {
        expect(result).toMatchSnapshot();
      }
    );
  });

  it("should create release notes", () => {
    const releaseNotes = `> * chore(DOCKERFILE): docker image migrates th database by start
> * chore(DOCKERFILE): docker image migrates th database by start\n`;
    const result =
      githubReleaseNotesUsecase["createReleaseNotes"](releaseNotes);
    expect(result).toMatchSnapshot();
  });
});
