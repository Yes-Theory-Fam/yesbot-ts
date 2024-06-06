import { CodegenConfig } from "@graphql-codegen/cli";
import { readFile, writeFile } from "fs/promises";
import { format } from "prettier";

const formatFile = async (path: string) => {
  const content = await readFile(path, "utf-8");
  const formatted = await format(content, { parser: "typescript" });
  await writeFile(path, formatted, "utf-8");
};

const endpoint =
  process.env.YTF_GRAPHQL_SCHEMA_ENDPOINT ??
  "https://staging.yestheory.family/_yesbot-schema";

const config: CodegenConfig = {
  overwrite: true,
  schema: endpoint,
  documents: "./**/*.graphql",
  hooks: {
    afterAllFileWrite: async (...filePaths: string[]) => {
      await Promise.all(filePaths.map(formatFile));
    },
  },
  emitLegacyCommonJSImports: false,
  generates: {
    "src/__generated__/types.ts": {
      plugins: ["@atmina/only-enum-types"],
      config: {
        scalars: { DateTime: "string" },
      },
    },
    "./": {
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "./src/__generated__/types.ts",
      },
      plugins: [
        "@atmina/local-typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        preResolveTypes: true,
        gqlImport: "graphql-request#gql",
      },
    },
  },
};

export default config;
