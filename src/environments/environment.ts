import { IAppEnvironment } from "../shared/models/app-environment.model";

export const environment: IAppEnvironment = {
    production: false,
    storageType: 'local' // 'local' | 'firebase'
};