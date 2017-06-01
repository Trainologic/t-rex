export interface Config {
    enableLogging?: boolean;
    activityAutoBeginTransaction?: boolean;
}

export const config: Config = {
    enableLogging: false,
    activityAutoBeginTransaction: true,
};

export function configure(newConfig: Config) {
    Object.assign(config, newConfig);
}
