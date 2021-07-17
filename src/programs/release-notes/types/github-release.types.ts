export interface GithubReleaseRepositoryType {
  repository: Repository;
}

export interface Repository {
  releases: Releases;
}

export interface Releases {
  edges: Edge[];
}

export interface Edge {
  node: Node;
}

export interface Node {
  name: string;
  publishedAt: string;
  tagName: string;
  isLatest: boolean;
  isPrerelease: boolean;
  description: string;
}
