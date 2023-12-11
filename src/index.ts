import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs/promises';
import { CoverageSummary, createCoverageMap, createCoverageSummary } from 'istanbul-lib-coverage';
import * as assert from 'assert';

const coverageFileArgument = 'coverage-file';
const coverageModeArgument = 'coverage-mode';
const reportUrl = 'report-url';
const ghToken = 'github-token';

function assertCoverageMode(
  mode: string
): asserts mode is 'statements' | 'branches' | 'functions' | 'lines' {
  if (!['statements', 'branches', 'functions', 'lines'].includes(mode)) {
    throw new Error(`Invalid coverage mode '${mode}'`);
  }
}

async function generateSummary(file: string): Promise<CoverageSummary> {
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

async function loadSummary(file: string): Promise<CoverageSummary> {
  const summary = JSON.parse(await fs.readFile(file, { encoding: 'utf-8' }));
  assert(summary.total, `Coverage file '${file}' is not a coverage summary file`);
  return createCoverageSummary(summary.total);
}

async function run() {
  const coverageFile = core.getInput(coverageFileArgument);
  const coverageFormat = core.getInput(coverageFileArgument);
  const coverageMode = core.getInput(coverageModeArgument);

  assertCoverageMode(coverageMode);

  let summary: CoverageSummary;
  if (coverageFormat === 'summary') {
    summary = await loadSummary(coverageFile);
  } else {
    summary = await generateSummary(coverageFile);
  }

  const totals = coverageTotals(summary, coverageMode);
  await publishCheck({
    detailsUrl: core.getInput(reportUrl),
    totals,
    coverageMode,
    token: core.getInput(ghToken)
  });
}

async function publishCheck(opts: {
  detailsUrl: string;
  totals: { covered: number; total: number };
  token: string;
  coverageMode: string;
}) {
  const sha = github.context.payload.pull_request?.head?.sha || github.context.sha;
  const octokit = github.getOctokit(opts.token);

  const totalCoverage = (opts.totals.covered / opts.totals.total) * 100;
  const output = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    context: 'Coverage',
    sha,
    state: 'success' as const,
    description: `${totalCoverage.toFixed(2)}% of ${opts.coverageMode} covered by tests`,
    target_url: opts.detailsUrl
  };
  await octokit.rest.repos.createCommitStatus(output);
}

function coverageTotals(
  coverage: CoverageSummary,
  mode: 'statements' | 'branches' | 'functions' | 'lines'
) {
  const covered = coverage[mode]?.covered ?? 0;
  const total = coverage[mode]?.total ?? 0;
  return { covered, total };
}

void run();
