export interface Config {
    enableLogging?: boolean;
    activityAutoBeginTransaction?: boolean;
    updateAutoBeginTransaction?: boolean;
    allowConcurrencyErrors?: boolean;
}

export const config: Config = {
    enableLogging: false,
    activityAutoBeginTransaction: false,
    updateAutoBeginTransaction: true,
    allowConcurrencyErrors: true,
};

export function configure(newConfig: Config) {
    if(newConfig.enableLogging != config.enableLogging) {
        if(newConfig.enableLogging) {
            //Logger.root.enable();
        }
        else {
            //Logger.root.disable();
        }
    }

    Object.assign(config, newConfig);
}
