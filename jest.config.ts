import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  },
  testPathPattern: 'src/__tests__',
  collectCoverageFrom: ['src/**/*.ts', '!src/app/**', '!src/**/*.d.ts'],
};

export default config;
