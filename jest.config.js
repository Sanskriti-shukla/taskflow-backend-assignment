module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/api-docs/**',
    '!src/migrations/**',
    '!src/seed/**',
    '!src/scripts/**'
  ]
};
