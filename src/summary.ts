import * as fs from 'node:fs/promises';
import {
  CoverageSummary,
  CoverageSummaryData,
  createCoverageMap,
  createCoverageSummary
} from 'istanbul-lib-coverage';
import * as assert from 'node:assert';
import parseLCOV from 'parse-lcov';

export async function generateSummary(file: string): Promise<CoverageSummary> {
  const map = createCoverageMap({});
  const summary = createCoverageSummary();
  map.merge(JSON.parse(await fs.readFile(file, { encoding: 'utf-8' })));
  map.files().forEach(file => {
    const fileCoverage = map.fileCoverageFor(file);
    const fileSummary = fileCoverage.toSummary();
    summary.merge(fileSummary);
  });

  return summary;
}

export async function loadLCOV(file: string): Promise<CoverageSummary> {
  const flavors = ['branches', 'functions', 'lines'] as const;
  const map = parseLCOV(await fs.readFile(file, { encoding: 'utf-8' }));

  const data: CoverageSummaryData = {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: NaN },
    branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
    functions: { total: 0, covered: 0, skipped: 0, pct: 0 }
  };

  for (const file of map) {
    flavors.forEach(flavor => {
      data[flavor].total += file[flavor].found ?? 0;
      data[flavor].covered += file[flavor].hit ?? 0;
    });
  }

  flavors.forEach(flavor => {
    data[flavor].pct =
      data[flavor].total === 0 ? 100 : (data[flavor].covered / data[flavor].total) * 100;
  });
  return createCoverageSummary(data);
}

export async function loadSummary(file: string): Promise<CoverageSummary> {
  const summary = JSON.parse(await fs.readFile(file, { encoding: 'utf-8' }));
  assert(summary.total, `Coverage file '${file}' is not a coverage summary file`);
  return createCoverageSummary(summary.total);
}
