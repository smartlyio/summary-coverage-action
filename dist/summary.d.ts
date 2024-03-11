import { CoverageSummary } from 'istanbul-lib-coverage';
export declare function generateSummary(file: string): Promise<CoverageSummary>;
export declare function loadSummary(file: string): Promise<CoverageSummary>;
