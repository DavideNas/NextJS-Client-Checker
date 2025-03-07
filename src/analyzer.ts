import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Common React hooks that require the 'use client' directive
const HOOKS = ['useState', 'useEffect', 'useContext', 'useReducer'];

// List of global objects that imply client-side rendering
const CLIENT_GLOBALS = ['window', 'document', 'navigator'];

// List of event handlers commonly used in client-side code
const CLIENT_EVENTS = ['onClick', 'onChange', 'onSubmit', 'onMouseEnter', 'onMouseLeave', 'onScroll'];

// Next.js server-side specific functions
const SERVER_FUNCTIONS = ['getServerSideProps', 'getStaticProps', 'getInitialProps'];

// List of functions that generate dynamic values (e.g., Math.random(), Date.now())
const DYNAMIC_FUNCTIONS = ['Math.random()', 'Date.now()'];

// Function that checks if the component needs the 'use client' directive
export function checkForUseClient(filePath: string): string | null {
    const content = fs.readFileSync(filePath, 'utf-8');

    // If 'use client' is already present, no need for further checks
    if (content.includes("'use client'")) {
        return null;
    }

    // Check for server-side functions in the file (Next.js specific)
    const isServerComponent = SERVER_FUNCTIONS.some(fn => content.includes(fn));

    // If the file contains server-side logic, we skip the check
    if (isServerComponent) {
        return null;
    }

    // Check if any React hooks are used in the file
    const useReactHook = HOOKS.some(hook => content.includes(hook));

    // Check if any client-side globals are used (e.g., window, document)
    const usesClientGlobals = CLIENT_GLOBALS.some(global => content.includes(global));

    // Check if any client-side event handlers are used (e.g., onClick, onChange)
    const usesClientEvents = CLIENT_EVENTS.some(event => content.includes(event));

    // Check if any dynamic functions (Math.random(), Date.now()) are used
    const usesDynamicFunctions = DYNAMIC_FUNCTIONS.some(fn => content.includes(fn));

    // Check if the file contains a component that might require 'use client' directive
    const containsServerComponent = content.includes('import') && content.includes('getServerSideProps');

    // If the file contains any client-side elements or a server-side component inside, return the file path (indicating it needs 'use client')
    if (useReactHook || usesClientGlobals || usesClientEvents || usesDynamicFunctions || containsServerComponent) {
        return path.relative(process.cwd(), filePath);
    }

    return null;
}

// Function that finds all .tsx files in a directory
export function findFiles(dir: string): string[] {
    let results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        // Ignora le cartelle node_modules e .next
        if (file === 'node_modules' || file === '.next') {
            continue;
        }

        if (stat.isDirectory()) {
            results = results.concat(findFiles(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

// Function to create or append to the log file with the list of files needing 'use client'
export function logToFile(missingUseClient: string[]) {
    const logFilePath = path.join(process.cwd(), 'use-client-check-log.txt');
    
    let logContent = '';
    if (missingUseClient.length > 0) {
        logContent = `⚠️ The following components may need the 'use client' directive:\n${missingUseClient.join('\n')}\n\n`;
    } else {
        logContent = '✔️ All components are correctly configured.\n\n';
    }

    // Append to the log file
    fs.appendFileSync(logFilePath, logContent, 'utf-8');

    // Provide feedback to the user
    vscode.window.showInformationMessage(`Log saved to ${logFilePath}`);
    
    // Optionally log to the console for quick reference
    console.log(`Log saved to ${logFilePath}`);
}
