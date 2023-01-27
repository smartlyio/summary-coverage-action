import * as core from '@actions/core';
import * as github from '@actions/github';

const coverageFileArgument = 'coverage-file';
const coverageModeArgument = 'coverage-mode';
const reportUrl = 'report-url';
const ghToken = 'github-token';

async function run() {
  const coverageFile = core.getInput(coverageFileArgument);
  const coverageMode = core.getInput(coverageModeArgument);
  const totals = calculateTotal({
    coverage: coverageFile,
    mode: coverageMode
  });
  await publishCheck({
    detailsUrl: core.getInput(reportUrl),
    totals,
    coverageMode,
    token: core.getInput(ghToken)
  });
}
import * as fs from 'fs';
import * as assert from 'assert';
import * as glob from 'glob';

const coverageTypeSingular = {
  branches: 'branch',
  functions: 'function',
  lines: 'line',
  statements: 'statement'
}

function calculateTotal(opts: { coverage: string, mode: string }) {
  return glob.sync(opts.coverage).reduce(
    (memo, file) => {
      const total = totalFromFile(file, opts.mode);
      return { total: memo.total + total.total, covered: memo.covered + total.covered };
    },
    { total: 0, covered: 0 }
  );
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
    description: `Total ${coverageTypeSingular[opts.coverageMode] || opts.coverageMode} coverage ${totalCoverage.toFixed(2)}%`,
    target_url: opts.detailsUrl
  };
  await octokit.rest.repos.createCommitStatus(output);
}

function totalFromFile(file: string, mode: string) {
  assert(/\.json$/.test(file), `Coverage file '${file}' should be (jest) json formatted`);
  const coverage = JSON.parse(fs.readFileSync(file, 'utf8'));
  const covered = coverage.total[mode]?.covered ?? 0;
  const total = coverage.total[mode]?.total ?? 0;
  return { covered, total };
}

void run();
