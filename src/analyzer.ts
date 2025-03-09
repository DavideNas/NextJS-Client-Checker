import * as fs from 'fs';
import * as path from 'path';

// Common React hooks that require the 'use client' directive
const HOOKS = ['useState', 'useEffect', 'useContext', 'useReducer'];

// List of global objects that imply client-side rendering
const CLIENT_GLOBALS = ['window', 'document', 'navigator'];

// List of event handlers commonly used in client-side code
const CLIENT_EVENTS = ['onClick', 'onChange', 'onSubmit', 'onMouseEnter', 'onMouseLeave', 'onScroll'];

// Next.js server-side specific functions
const SERVER_FUNCTIONS = ['getServerSideProps', 'getStaticProps', 'getInitialProps'];

// Dynamic Functions which run only on client components
const DYNAMIC_FUNCTIONS = ['Math.random()', 'Date.now()'];

// List of directories to exclude from the search
const EXCLUDED_FOLDERS = ['node_modules', '.next', '.git', 'dist'];

// Funzione per rimuovere i commenti ma escludere quelli con 'use client'
function removeComments(content: string): string {
    // Rimuove i commenti su una singola riga
    content = content.replace(/\/\/.*$/gm, '');
    // Rimuove i commenti multilinea, ma esclude quelli che contengono 'use client'
    content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
        return match.includes('use client') ? match : '';
    });
    return content;
}

// Funzione che filtra espressioni nei commenti che potrebbero sembrare la direttiva
function filterClientDirectivesInComments(content: string): string {
    // Filtro per rimuovere espressioni che potrebbero sembrare 'use client' all'interno dei commenti
    content = content.replace(/\/\*[^*]*\buse client\b[^*]*\*\//g, '');
    return content;
}

// Helper function to check if any React hooks are present
function hasReactHook(content: string): boolean {
    return HOOKS.some(hook => content.includes(hook));
}

// Helper function to check if any client-side globals are used
function hasClientGlobals(content: string): boolean {
    return CLIENT_GLOBALS.some(global => content.includes(global));
}

// Helper function to check if any client-side event handlers are used
function hasClientEvents(content: string): boolean {
    return CLIENT_EVENTS.some(event => content.includes(event));
}

// Helper function to check if any dynamic functions are present
function hasDynamicFunctions(content: string): boolean {
    return DYNAMIC_FUNCTIONS.some(fn => content.includes(fn));
}

// Function that checks if the component needs the 'use client' directive
export function checkForUseClient(filePath: string): string | null {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Normalize the 'use client' check to handle both single and double quotes
    let normalizedContent = content.replace(/['"]use client['"]/g, "'use client'");
    
    // Rimuove i commenti dal contenuto del file
    normalizedContent = removeComments(normalizedContent);

    // Rimuove anche eventuali 'use client' all'interno dei commenti
    normalizedContent = filterClientDirectivesInComments(normalizedContent);

    // If 'use client' is already present, no need for further checks
    if (normalizedContent.includes("'use client'")) {
        return null; // Skip if the directive is already present
    }

    // Check for server-side functions in the file (Next.js specific)
    const isServerComponent = SERVER_FUNCTIONS.some(fn => normalizedContent.includes(fn));

    // If the file contains server-side logic, we skip the check
    if (isServerComponent) {
        return null;
    }

    // Using helper functions for modularity
    if (hasReactHook(normalizedContent) || hasClientGlobals(normalizedContent) || 
        hasClientEvents(normalizedContent) || hasDynamicFunctions(normalizedContent)) {
        // Restituisci il path assoluto del file
        return path.resolve(filePath);  // Usa path.resolve per ottenere il percorso assoluto
    }

    return null;
}

// Function that finds all .tsx files in a directory
export async function findFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (EXCLUDED_FOLDERS.includes(file)) { continue; }

        if (stat.isDirectory()) {
            results = results.concat(await findFiles(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    }

    return results;
}
