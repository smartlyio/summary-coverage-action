declare const _default: {
    extensionsToTreatAsEsm: string[];
    transform: {
        '^.+\\.m?[tj]sx?$': ["ts-jest", {
            useESM: true;
            isolatedModules: true;
            diagnostics: false;
        }];
    };
};
export default _default;
