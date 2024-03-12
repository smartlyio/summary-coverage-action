import { generateSummary, loadLCOV } from './summary';

describe('generateSummary', () => {
  it('generates json summary from Istanbul coverage', async () => {
    const summary = await generateSummary('src/fixtures/coverage-final.json');
    expect(summary.toJSON()).toEqual({
      branches: { covered: 26, pct: 100, skipped: 0, total: 26 },
      branchesTrue: { covered: 0, pct: 'Unknown', skipped: 0, total: 0 },
      functions: { covered: 10, pct: 100, skipped: 0, total: 10 },
      lines: { covered: 42, pct: 100, skipped: 0, total: 42 },
      statements: { covered: 47, pct: 100, skipped: 0, total: 47 }
    });
  });
});

describe('lcovSummary', () => {
  it('generates json summary from Istanbul coverage', async () => {
    const summary = await loadLCOV('src/fixtures/lcov.info');
    expect(summary.toJSON()).toEqual({
      branches: { covered: 0, pct: 100, skipped: 0, total: 0 },
      functions: { covered: 2, pct: (2 / 3) * 100, skipped: 0, total: 3 },
      lines: { covered: 13, pct: 81.25, skipped: 0, total: 16 },
      statements: { covered: 0, pct: NaN, skipped: 0, total: 0 }
    });
  });
});
