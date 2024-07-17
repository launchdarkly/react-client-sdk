module.exports = {
  reporters: ['default'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
  },
  testRegex: '.*\\.test\\.(ts|tsx)$',
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  setupFilesAfterEnv: ['./setupTests.js'],
  testEnvironment: 'jest-environment-jsdom-global',
};
