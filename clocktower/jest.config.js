// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'], // Add this line
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
