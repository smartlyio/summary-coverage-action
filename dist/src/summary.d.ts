import { default as libCoverage } from 'istanbul-lib-coverage';
export declare function generateSummary(file: string): Promise<libCoverage.CoverageSummary>;
export declare function loadLCOV(file: string): Promise<libCoverage.CoverageSummary>;
export declare function loadCobertura(file: string): Promise<libCoverage.CoverageSummary>;
export declare function loadSummary(file: string): Promise<libCoverage.CoverageSummary>;
