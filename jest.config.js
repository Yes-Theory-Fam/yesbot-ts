module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/__tests__/mocks"],
  collectCoverageFrom: [
    "src/**/*.{ts}",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/.github/**",
    "!**/.idea/**",
    "!**/.vscode/**",
    "!**/.coverage/**",
  ],
  verbose: true,
  clearMocks: true,
};
