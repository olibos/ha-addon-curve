/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsConfig: "tsconfig.jest.json"
    }]
  },
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/jest.config.js',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ]
};

export default config;