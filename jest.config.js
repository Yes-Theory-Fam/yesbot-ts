module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/__tests__/mocks", "<rootDir>/src", "<rootDir>/node_modules", "<rootDir>/build", "<rootDir>/coverage"],
  collectCoverageFrom: [
    "src/**/*.{ts}",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/.github/**",
    "!**/.idea/**",
    "!**/.vscode/**",
    "!**/.coverage/**",
    "!**/.build/**",
  ],
  verbose: true,
  clearMocks: true,
  prettierPath: "./node_modules/@yestheoryfam/prettier-config/index.js",
};
