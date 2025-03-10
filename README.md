# Next Client Checker

🚀 **Next Client Checker** is a Visual Studio Code extension crafted for Next.js developers who want to easily check if any of their components require the `'use client'` directive. It automates the tedious task of manually verifying which components need client-side execution.

## **🔧 Installation**

1️⃣ **Install the Extension**  
 Open VS Code, launch the **Command Palette** (**Ctrl+Shift+P** or **Cmd+Shift+P** on macOS), type **"Extensions: Install Extensions"**, and search for **Next Client Check**. Hit install.

2️⃣ **Activation**  
 Once installed, the extension will activate automatically. No extra configuration is required. Just fire up your Next.js project, and you're good to go.

## **🚀 Usage**

1️⃣ After installation, press **Ctrl+Shift+U** (or **Cmd+Shift+U** on macOS) to run the extension.  
Alternatively, you can open the **Command Palette** with **Ctrl+Shift+P** (or **Cmd+Shift+P** on macOS) and type:  
 **`Check use client`**

2️⃣ The extension will scan through your Next.js components and give you a heads-up if it detects any components that need the `'use client'` directive.

3️⃣ If any components are flagged, the extension will notify you at the bottom of the editor, advising you to add the directive to ensure proper client-side execution.

## **🔧 How It Works**

This extension leverages static analysis of your Next.js codebase to determine which components contain client-specific features (like `useState`, `useEffect`, or anything that manipulates the DOM). These components require `'use client'` to function correctly on the client-side. If a component misses it, the extension will notify you so you don't get caught in a hydration mismatch.

- **What does it look for?**  
  It checks for the presence of hooks and browser-specific APIs. If it finds any of these, it knows that component is destined for the client side.
- **How does it suggest?**  
  It simply tells you when and where to add `'use client'`. No heavy-handed refactoring — just a gentle nudge to keep things clean and efficient.

## **💡 Advanced Usage & Considerations**

- This extension works best in Next.js projects following the latest `use client` convention, which is mandatory for components that rely on client-side features.
- It doesn't interfere with server-side components (e.g., data fetching logic), only those components requiring client-side rendering. So, server-side logic is **not** flagged.
- The extension is lightweight, designed not to get in your way but to enhance your workflow.

## **🔒 License**

MIT License. See `LICENSE` for the full details.
