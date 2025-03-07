import * as fs from 'fs';
import * as path from 'path';

const HOOKS = ['useState', 'useEffect', 'useContext', 'useReducer'];

export function checkForUseClient(filePath: string): string | null {
    const content = fs.readFileSync(filePath, 'utf-8');

    if (content.includes("'use client'")) {
        return null; // già presente
    }

    // Controlla se usa hook di react 
    const useReactHook = HOOKS.some(hook => content.includes(hook));

    return useReactHook ? filePath : null;
}

export function findFiles(dir: string): string[] {
    let results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if(stat.isDirectory()) {
            results = results.concat(findFiles(fullPath));
        } else if (fullPath.endsWith('.txt')) {
            results.push(fullPath);
        }
    }

    return results;
}

