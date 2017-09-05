import {forArea, ILoggerArea} from "complog";

export const appLogger: ILoggerArea = forArea("t-rex");
appLogger.enable(false);