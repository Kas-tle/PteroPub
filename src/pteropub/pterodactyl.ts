import { MessageType, statusMessage } from "../util/console";
import { Config } from "../util/config";
import fs from 'fs';
import path from 'path';

export async function processUploads(config: Config): Promise<void> {
    for (const upload of config.uploads) {
        const { token, panelUrl, serverId, restartServer, task, files, delayToNext } = upload;

        await uploadFiles({ panelUrl, token, serverId, uploads: files });

        if (task) {
            await executeTasks({ panelUrl, token, serverId, task });
        }

        if (restartServer) {
            await executeRestart({ panelUrl, token, serverId });
        }

        if (delayToNext) {
            statusMessage(MessageType.Process, `Waiting ${delayToNext}ms before next upload...`);
            await new Promise((resolve) => setTimeout(resolve, delayToNext));
        }
    }
}

async function executeRestart(input: { panelUrl: string, token: string, serverId: string }): Promise<void> {
    const { panelUrl, token, serverId } = input;

    await fetch(new URL(`/api/client/servers/${serverId}/power`, panelUrl), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ signal: 'restart' }),
    });

    statusMessage(MessageType.Process, `Restarted server ${serverId}`);
}

async function getTaskIds(input: { panelUrl: string, token: string, serverId: string, task: string }): Promise<string[]> {
    const { panelUrl, token, serverId, task } = input;

    const response = await fetch(new URL(`/api/client/servers/${serverId}/schedules`, panelUrl), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch tasks for server ${serverId}`);
    }
    
    const tasks = await response.json();

    if (!tasks || !tasks.data) {
        throw new Error(`No tasks found on server ${serverId}`);
    }

    const taskIds: string[] = [];
    for (const t of tasks.data) {
        if (t.attributes.name === task) {
            taskIds.push(t.attributes.id);
        }
    }

    if (taskIds.length > 0) {
        return taskIds;
    }

    throw new Error(`Task "${task}" not found on server ${serverId}`);
}

async function executeTask(input: { panelUrl: string, token: string, serverId: string, taskId: string }): Promise<void> {
    const { panelUrl, token, serverId, taskId } = input;

    await fetch(new URL(`/api/client/servers/${serverId}/schedules/${taskId}/execute`, panelUrl), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });
}

async function executeTasks(input: { panelUrl: string, token: string, serverId: string, task: string }): Promise<void> {
    const taskIds = await getTaskIds(input);

    for (const taskId of taskIds) {
        await executeTask({ ...input, taskId });
    }

    statusMessage(MessageType.Process, `Executed task "${input.task}" on ${input.serverId}`);
}

async function getUploadUrl(input: { panelUrl: string, token: string, serverId: string }): Promise<string> {
    const { panelUrl, token, serverId } = input;

    const response = await fetch(new URL(`/api/client/servers/${serverId}/files/upload`, panelUrl), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });

    const json = await response.json();

    return json.attributes.url;
}

async function uploadFiles(input: { panelUrl: string, token: string, serverId: string, uploads: { localFile: string, uploadDir: string}[] }): Promise<void> {
    const { panelUrl, token, serverId, uploads} = input;

    // combine uploads with the same uploadDir
    const uploadMap = new Map<string, string[]>();
    for (const upload of uploads) {
        if (uploadMap.has(upload.uploadDir)) {
            uploadMap.get(upload.uploadDir)!.push(upload.localFile);
        } else {
            uploadMap.set(upload.uploadDir, [upload.localFile]);
        }
    }
    
    for (const [uploadDir, localFiles] of uploadMap) {
        const url = await getUploadUrl({ panelUrl, token, serverId });

        const formData = new FormData();
        for (const localFile of localFiles) {
            formData.append('files', new Blob([fs.readFileSync(localFile)]), path.basename(localFile));
        }

        await fetch(`${url}&directory=${uploadDir}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });
    }

    statusMessage(MessageType.Process, `Uploaded ${uploads.length} files to server ${serverId}`);
}