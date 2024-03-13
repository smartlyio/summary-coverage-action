import * as fs from 'node:fs/promises';
import {
  CoverageSummary,
  CoverageSummaryData,
  createCoverageMap,
  createCoverageSummary
} from 'istanbul-lib-coverage';
import * as assert from 'node:assert';
import parseLCOV, { LCOVRecord } from 'parse-lcov';
import { XMLParser } from 'fast-xml-parser';

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

function coverageRecordsToSummary(records: LCOVRecord[]): CoverageSummary {
  const flavors = ['branches', 'functions', 'lines'] as const;
  const data: CoverageSummaryData = {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: NaN },
    branches: { total: 0, covered: 0, skipped: 0, pct: NaN },
    functions: { total: 0, covered: 0, skipped: 0, pct: NaN }
  };

  for (const file of records) {
    flavors.forEach(flavor => {
      console.log;
      if (file[flavor]) {
        data[flavor].total += file[flavor].found ?? 0;
        data[flavor].covered += file[flavor].hit ?? 0;
      }
    });
  }

  flavors.forEach(flavor => {
    data[flavor].pct =
      data[flavor].total === 0 ? 100 : (data[flavor].covered / data[flavor].total) * 100;
  });
  return createCoverageSummary(data);
}

export async function loadLCOV(file: string): Promise<CoverageSummary> {
  return coverageRecordsToSummary(parseLCOV(await fs.readFile(file, { encoding: 'utf-8' })));
}

export async function loadCobertura(file: string): Promise<CoverageSummary> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    ignoreDeclaration: true,
    ignorePiTags: true,
    processEntities: false,
    stopNodes: ['sources', 'packages']
  });
  const report = parser.parse(await fs.readFile(file, { encoding: 'utf-8' }));
  const data: CoverageSummaryData = {
    lines: {
      total: Number(report.coverage['@_lines-valid']),
      covered: Number(report.coverage['@_lines-covered']),
      skipped: 0,
      pct: Number(report.coverage['@_line-rate']) * 100
    },
    statements: { total: 0, covered: 0, skipped: 0, pct: NaN },
    branches: {
      total: Number(report.coverage['@_branches-valid']),
      covered: Number(report.coverage['@_branches-covered']),
      skipped: 0,
      pct: Number(report.coverage['@_branch-rate']) * 100
    },
    functions: { total: 0, covered: 0, skipped: 0, pct: NaN }
  };
  return createCoverageSummary(data);
}

export async function loadSummary(file: string): Promise<CoverageSummary> {
  const data = JSON.parse(await fs.readFile(file, { encoding: 'utf-8' }));
  assert(data.total, `Coverage file '${file}' is not a coverage summary file`);
  const summary = createCoverageSummary();
  summary.merge(data.total);
  return summary;
}
