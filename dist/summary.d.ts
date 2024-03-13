import { CoverageSummary } from 'istanbul-lib-coverage';
export declare function generateSummary(file: string): Promise<CoverageSummary>;
export declare function loadLCOV(file: string): Promise<CoverageSummary>;
export declare function loadCobertura(file: string): Promise<CoverageSummary>;
export declare function loadSummary(file: string): Promise<CoverageSummary>;
