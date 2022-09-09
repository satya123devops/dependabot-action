module.exports = {
  transformIgnorePatterns: ['node_modules/(?!(terminal-link|ansiEscapes)/)'],
  transform: {
    '^.+\\.[t|j]sx?$': 'ts-jest',
  },
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  modulePathIgnorePatterns: ['lib/*'],
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'node',
  verbose: true,
};
