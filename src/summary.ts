import * as fs from 'node:fs/promises';
import { CoverageSummary, createCoverageMap, createCoverageSummary } from 'istanbul-lib-coverage';
import * as assert from 'node:assert';

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

export async function loadSummary(file: string): Promise<CoverageSummary> {
  const summary = JSON.parse(await fs.readFile(file, { encoding: 'utf-8' }));
  assert(summary.total, `Coverage file '${file}' is not a coverage summary file`);
  return createCoverageSummary(summary.total);
}
