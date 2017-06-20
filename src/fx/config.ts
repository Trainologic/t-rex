export interface Config {
    enableLogging?: boolean;
    activityAutoBeginTransaction?: boolean;
    updateAutoBeginTransaction?: boolean;
}

export const config: Config = {
    enableLogging: false,
    activityAutoBeginTransaction: true,
    updateAutoBeginTransaction: false,
};

export function configure(newConfig: Config) {
    Object.assign(config, newConfig);
}
