#! /usr/bin/env node

import packageJson from './package.json';
import { processUploads } from './src/pteropub/pterodactyl';
import { getConfig } from './src/util/config';
import { MessageType, statusMessage } from './src/util/console';

async function main(): Promise<void> {
    // Needed for exit handler
    process.stdin.resume();
    const startTime = Date.now();

    statusMessage(MessageType.Info, `Uploading files with ${packageJson.name} v${packageJson.version}...`);

    const config = await getConfig();

    await processUploads(config);

    const endTime = Date.now();
    statusMessage(MessageType.Completion, `Uploads completed in ${(endTime - startTime) / 1000} seconds`);

    process.exit(0);
}

main();