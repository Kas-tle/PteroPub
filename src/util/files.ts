import fs from 'fs';
import path from 'path';

export function parseJsonFile<T>(filepath: string): Promise<T> {
    return JSON.parse(fs.readFileSync(filepath).toString());
}

export function absolutePath(filepath: string): string {
    return path.join(process.cwd(), filepath);
}

export function fileExists(filename: string): boolean {
    return fs.existsSync(filename);
}
