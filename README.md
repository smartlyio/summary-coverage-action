# Summary coverage

Create a gh check with a link to a detailed coverage summary

## Usage

Add following to your steps after the step running your test suite

```
    - uses: smartlyio/summary-coverage-action
      with:
        coverage-file: coverage.json
        report-url: http://example.com/report/index.html
        github-token: ${{secrets.GITHUB_TOKEN}}
```

Where `coverage.json` is path to a report file produced by Jest/Istanbul with `coverageReporter: ['json']`.

You can also pass in a summary report by passing `coverage-mode: summary` and using the following reporter in Jest:

```
coverageReporters: ['json-summary']
```
