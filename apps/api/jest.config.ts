import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: String.raw`.*\.(spec|e2e-spec)\.ts$`,
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Nest 12 ships ESM: tests run with --experimental-vm-modules so Jest can require(esm).
  // Same SWC settings as the build (decorators + metadata), read from .swcrc
  transform: { [String.raw`^.+\.ts$`]: '@swc/jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: 'coverage',
};

export default config;
