import { addToTree } from "../../src/event-distribution/helper";
import {
  HIOC,
  StringIndexedHIOCTree,
} from "../../src/event-distribution/types/hioc";
import { DiscordEvent } from "../../src/event-distribution";

describe("Event Distribution helper", () => {
  it("Adds a single key event to the tree", () => {
    const hioc = {} as HIOC<DiscordEvent.READY>;
    const tree = {} as StringIndexedHIOCTree<DiscordEvent.READY>;

    addToTree([""], hioc, tree);

    expect(tree[""]).toStrictEqual([hioc]);
  });

  it("Adds a two key event to the tree", () => {
    const hioc = {} as HIOC<DiscordEvent.REACTION_ADD>;
    const tree = {} as StringIndexedHIOCTree<DiscordEvent.REACTION_ADD>;

    addToTree(["first", "second"], hioc, tree);

    expect(tree).toMatchSnapshot();
  });

  it("Adds a three key event to the tree", () => {
    const hioc = {} as HIOC<DiscordEvent.MESSAGE>;
    const tree = {} as StringIndexedHIOCTree<DiscordEvent.MESSAGE>;

    addToTree(["channel", "trigger", "subTrigger"], hioc, tree);

    expect(tree).toMatchSnapshot();
  });

  it("Converts an existing array to an object", () => {
    const hioc = {} as HIOC<DiscordEvent.MESSAGE>;
    const tree = {} as StringIndexedHIOCTree<DiscordEvent.MESSAGE>;

    addToTree(["first"], hioc, tree);

    expect(tree["first"]).toStrictEqual([hioc]);

    addToTree(["first", "second"], hioc, tree);
    expect(Array.isArray(tree["first"])).toBe(false);

    const firstTree = tree[
      "first"
    ] as StringIndexedHIOCTree<DiscordEvent.MESSAGE>;

    expect(firstTree[""]).toBeTruthy();
    expect(firstTree["second"]).toBeTruthy();
  });

  it("Works with a bunch of combinations", () => {
    const hioc = {} as HIOC<DiscordEvent.MESSAGE>;
    const tree = {} as StringIndexedHIOCTree<DiscordEvent.MESSAGE>;

    addToTree(["first"], hioc, tree);
    addToTree(["second"], hioc, tree);
    addToTree(["third", "example", "sub"], hioc, tree);
    addToTree(["first", "second"], hioc, tree);
    addToTree(["first", "third"], hioc, tree);
    addToTree(["first", "third"], hioc, tree);

    expect(tree).toMatchSnapshot();
  });
});
