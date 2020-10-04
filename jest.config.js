module.exports = {
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['<rootDir>/tests/unit/*.test.js?(x)'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    './modules.js'
  ],
  coverageReporters: [
    'json-summary', 
    'text',
    'lcov'
  ],
  testTimeout: 60000
};
