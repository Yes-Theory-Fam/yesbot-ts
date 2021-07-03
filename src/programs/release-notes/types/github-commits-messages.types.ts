export interface GitHubCommitMessages {
  repository: Repository;
}

export interface Repository {
  object: Object;
}

export interface Object {
  history: History;
}

export interface History {
  nodes: Node[];
}

export interface Node {
  messageHeadline: string;
}
