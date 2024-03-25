import * as fs from 'node:fs/promises';
import { default as libCoverage } from 'istanbul-lib-coverage';
import assert from 'node:assert';
import parseLCOV, { LCOVRecord } from 'parse-lcov';
import { XMLParser } from 'fast-xml-parser';

export async function generateSummary(file: string): Promise<libCoverage.CoverageSummary> {
  const map = libCoverage.createCoverageMap({});
  const summary = libCoverage.createCoverageSummary();
  map.merge(
    JSON.parse(await fs.readFile(file, { encoding: 'utf-8' })) as libCoverage.CoverageMapData
  );
  map.files().forEach(file => {
    const fileCoverage = map.fileCoverageFor(file);
    const fileSummary = fileCoverage.toSummary();
    summary.merge(fileSummary);
  });

  return summary;
}

function coverageRecordsToSummary(records: LCOVRecord[]): libCoverage.CoverageSummary {
  const flavors = ['branches', 'functions', 'lines'] as const;
  const data: libCoverage.CoverageSummaryData = {
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
  return libCoverage.createCoverageSummary(data);
}

function assertIsCoberturaReport(data: unknown): asserts data is {
  coverage: {
    '@_lines-valid': string;
    '@_lines-covered': string;
    '@_branches-covered': string;
    '@_branches-valid': string;
    '@_line-rate': string;
    '@_branch-rate': string;
  };
} {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { coverage: unknown }).coverage !== 'object'
  ) {
    throw new Error('Invalid cobertura report');
  }
}

function assertCoverageSummary(
  data: unknown,
  file: string
): asserts data is { total: libCoverage.CoverageSummaryData } {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { total: unknown }).total !== 'object'
  ) {
    throw new Error(`Coverage file '${file}' is not a coverage summary file`);
  }
}

export async function loadLCOV(file: string): Promise<libCoverage.CoverageSummary> {
  return coverageRecordsToSummary(parseLCOV(await fs.readFile(file, { encoding: 'utf-8' })));
}

export async function loadCobertura(file: string): Promise<libCoverage.CoverageSummary> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    ignoreDeclaration: true,
    ignorePiTags: true,
    processEntities: false,
    stopNodes: ['sources', 'packages']
  });
  const report = parser.parse(await fs.readFile(file, { encoding: 'utf-8' })) as unknown;
  assertIsCoberturaReport(report);

  const data: libCoverage.CoverageSummaryData = {
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
  return libCoverage.createCoverageSummary(data);
}

export async function loadSummary(file: string): Promise<libCoverage.CoverageSummary> {
  const data = JSON.parse(await fs.readFile(file, { encoding: 'utf-8' })) as unknown;
  assertCoverageSummary(data, file);
  assert(data.total, `Coverage file '${file}' is not a coverage summary file`);
  const summary = libCoverage.createCoverageSummary();
  // @ts-expect-error total is a CoverageSummaryData object, but merge type expects a CoverageSummary
  summary.merge(data.total);
  return summary;
}
