module.exports = {
  reporters: ['default'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '\\.(ts|tsx)$': 'ts-jest',
  },
  testRegex: '.*\\.test\\.(ts|tsx)$',
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  testEnvironment: 'jest-environment-jsdom-global',
};
