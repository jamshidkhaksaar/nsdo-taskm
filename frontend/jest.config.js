module.exports = {
  // The root directory that Jest should scan for tests and modules
  roots: ['<rootDir>/src'],
  
  // A list of paths to directories that Jest should use to search for files in
  moduleDirectories: ['node_modules', 'src'],
  
  // File extensions Jest will look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  
  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  
  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/'],
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // An array of regexp pattern strings that are matched against all source file paths
  // before re-running tests in watch mode
  watchPathIgnorePatterns: ['node_modules'],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Setup files that will be run before each test
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  
  // Transform ignore patterns - this is crucial for handling ES modules
  transformIgnorePatterns: [
    '/node_modules/(?!axios|react-dnd|dnd-core|@react-dnd|react-beautiful-dnd|@babel|@mui|uuid)/'
  ],
  
  // Module name mapper for handling non-JS modules
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^axios$': require.resolve('axios'),
  },
  
  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',
  
  // Timeout for test (in milliseconds)
  testTimeout: 10000,
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: ['text', 'lcov'],
  
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}; 