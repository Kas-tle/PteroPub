import { MessageType, statusMessage } from './console';
import { getErrorMessage } from './error';
import * as files from './files';

export interface Config {
    uploads: Upload[];
}

export interface Upload {
    token: string;
    panelUrl: string;
    serverId: string;
    restartServer?: boolean;
    task?: string;
    delayToNext?: number;
    files: File[];
}

export interface File {
    localFile: string;
    uploadDir: string;
}

let cachedConfig: Config | null = null;

export async function getConfig(): Promise<Config> {
    if (cachedConfig) {
        return cachedConfig;
    }
    try {

        let config: Config;
        if (process.env['PTEROPUB_CONFIG'] != '' && process.env['PTEROPUB_CONFIG'] != undefined) {
            config = JSON.parse(process.env['PTEROPUB_CONFIG']);
        } else if (!files.fileExists(files.absolutePath('pteropub.json'))) {
            throw new Error('No pteropub.json found');
        } else {
            config = await files.parseJsonFile<Config>(files.absolutePath('pteropub.json'));
        }

        if (!config.uploads || config.uploads.length === 0) {
            throw new Error('No uploads found in pteropub.json');
        }

        for (let i = 0; i < config.uploads.length; i++) {
            const upload = config.uploads[i];

            if (!upload.token) {
                throw new Error(`Upload index ${i} is missing .token`);
            }

            if (!upload.panelUrl) {
                throw new Error(`Upload index ${i} is missing .panelUrl`);
            }

            if (!upload.serverId) {
                throw new Error(`Upload index ${i} is missing .serverId`);
            }

            for (let j = 0; j < upload.files.length; j++) {
                const file = upload.files[j];

                if (!file.localFile) {
                    throw new Error(`Upload index ${i} file index ${j} is missing .localFile`);
                }

                if (!file.uploadDir) {
                    throw new Error(`Upload index ${i} file index ${j} is missing .uploadDir`);
                }
            }
        }

        cachedConfig = config;
        return config;
    } catch (err) {
        statusMessage(
            MessageType.Info, 
            "Error loading pteropub.json:",
            getErrorMessage(err),
            "If you need help, please visit https://github.com/Kas-tle/PteroPub"
        );
        statusMessage(MessageType.Plain, "");
        process.exit(1);
    }
};