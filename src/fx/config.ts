import {Logger} from "./logger";

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
        if(newConfig.enableLogging) {
            Logger.root.enable();
        }
        else {
            Logger.root.disable();
        }
    }

    Object.assign(config, newConfig);
}
