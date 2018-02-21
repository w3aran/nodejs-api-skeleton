module.exports = {
  verbose: true,
  roots: ["<rootDir>/src"],
  collectCoverageFrom: ["src/**/*.js"],
  coverageReporters: ["json", "lcov", "text", "cobertura"],
  coverageDirectory: "build/reports/jest/coverage",
  testResultsProcessor: "jest-junit"
};
