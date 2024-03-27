import type { JestConfigWithTsJest } from 'ts-jest';

export default {
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  transform: {
    '^.+\\.m?[tj]sx?$': ['ts-jest', { useESM: true, isolatedModules: true, diagnostics: false }]
  }
} satisfies JestConfigWithTsJest;
