# Summary coverage

Create a gh check with a link to a detailed coverage summary

## Usage

add following to your steps after the step running your test suite

```
    - uses: smartlyio/summary-coverage-action
      with:
        coverage-file: packages/*/coverage/coverage.json
        reportUrl: http://example.com/report/index.html
        github-token: ${{secrets.GITHUB_TOKEN}}
```

Where `packages/coverage/*/coverage.json` is  a wildcard path to files that have been produced by jest
(if you can produce a similar file without jest that is fine also)
with option. 

```
coverageReporters: ['json-summary']
```

