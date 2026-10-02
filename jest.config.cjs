module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.routes.ts'],
  coverageDirectory: 'coverage',
};
