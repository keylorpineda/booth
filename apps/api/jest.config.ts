import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: String.raw`.*\.(spec|e2e-spec)\.ts$`,
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Nest 12 ships ESM: tests run with --experimental-vm-modules so Jest can require(esm).
  // Same SWC settings as the build (decorators + metadata), read from .swcrc
  transform: { [String.raw`^.+\.ts$`]: '@swc/jest' },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/seed/cli.ts',
    '!src/**/*.module.ts',
    '!src/generated/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 85,
      lines: 85,
      functions: 85,
      branches: 50,
    },
  },
  setupFiles: ['<rootDir>/test/setup/env.ts'],
  globalSetup: '<rootDir>/test/setup/global-setup.ts',
  // Suites share one test database: run them one at a time.
  maxWorkers: 1,
  testTimeout: 15_000,
};

export default config;
