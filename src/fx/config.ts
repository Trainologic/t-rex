import {enableLogging} from "./logger";
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
    if(newConfig.enableLogging != config.enableLogging) {
        enableLogging(newConfig.enableLogging);
    }

    Object.assign(config, newConfig);
}
