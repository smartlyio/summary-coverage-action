import * as core from '@actions/core';
import * as github from '@actions/github';

const coverageFileArgument = 'coverage-file';
const reportUrl = 'report-url';
const ghToken = 'github-token';

async function run() {
  const coverageFile = core.getInput(coverageFileArgument);
  const totals = calculateTotal({
    coverage: coverageFile
  });
  await publishCheck({
    detailsUrl: core.getInput(reportUrl),
    totals,
    token: core.getInput(ghToken)
  });
}
import * as fs from 'fs';
import * as assert from 'assert';
import * as glob from 'glob';

function calculateTotal(opts: { coverage: string }) {
  return glob.sync(opts.coverage).reduce(
    (memo, file) => {
      const total = totalFromFile(file);
      return { total: memo.total + total.total, covered: memo.covered + total.covered };
    },
    { total: 0, covered: 0 }
  );
}

async function publishCheck(opts: {
  detailsUrl: string;
  totals: { covered: number; total: number };
  token: string;
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
    description: `Total branch coverage ${totalCoverage.toFixed(2)}%`,
    target_url: opts.detailsUrl
  };
  console.log(output);
  await octokit.rest.repos.createCommitStatus(output);
}

function totalFromFile(file: string) {
  assert(/\.json$/.test(file), `Coverage file '${file}' should be (jest) json formatted`);
  const coverage = JSON.parse(fs.readFileSync(file, 'utf8'));
  const covered = coverage.total.branches?.covered ?? 0;
  const total = coverage.total.branches?.total ?? 0;
  return { covered, total };
}

void run();
