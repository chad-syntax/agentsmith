/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(p-queue|eventemitter3|p-timeout)/)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': ['babel-jest', { configFile: './babel-jest.config.js' }],
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest.setup.ts'],
};
