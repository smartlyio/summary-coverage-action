import * as core from '@actions/core';
import * as github from '@actions/github';
import { CoverageSummary } from 'istanbul-lib-coverage';
import { generateSummary, loadLCOV, loadSummary } from './summary';

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

async function run() {
  const coverageFile = core.getInput(coverageFileArgument);
  const coverageFormat = core.getInput(coverageFileArgument);
  const coverageMode = core.getInput(coverageModeArgument);

  assertCoverageMode(coverageMode);

  let summary: CoverageSummary;
  if (coverageFormat === 'summary') {
    summary = await loadSummary(coverageFile);
  } else if (coverageFormat === 'lcov') {
    summary = await loadLCOV(coverageFile);
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
