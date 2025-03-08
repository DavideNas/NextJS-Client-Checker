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

    // Check if any React hooks are used in the file
    const useReactHook = HOOKS.some(hook => normalizedContent.includes(hook));

    // Check if any client-side globals are used (e.g., window, document)
    const usesClientGlobals = CLIENT_GLOBALS.some(global => normalizedContent.includes(global));

    // Check if any client-side event handlers are used (e.g., onClick, onChange)
    const usesClientEvents = CLIENT_EVENTS.some(event => normalizedContent.includes(event));

    // Check if the file contains dynamic functions that need 'use client' directive
    const usesDynamicFunctions = DYNAMIC_FUNCTIONS.some(fn => normalizedContent.includes(fn));

    // Check for a pure component (no hooks or client-side logic)
    const isPureComponent = normalizedContent.includes('export default') && 
                            !useReactHook && 
                            !usesClientGlobals && 
                            !usesClientEvents && 
                            !usesDynamicFunctions;

    // If it is a pure component, return null (it doesn't need 'use client')
    if (isPureComponent) {
        return null;
    }

    // If the file contains any client-side elements or dynamic functions, return the optimized file path
    if (useReactHook || usesClientGlobals || usesClientEvents || usesDynamicFunctions) {
        return '\\' + path.relative(process.cwd(), filePath).replace(/\\/g, '/');
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
