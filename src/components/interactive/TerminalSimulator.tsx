import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
interface FSNode {
  type: 'file' | 'dir';
  name: string;
  content?: string;
  permissions?: string;
  children?: Record<string, FSNode>;
}

interface HistoryEntry {
  command: string;
  output: string;
  isError?: boolean;
}

interface TutorialStep {
  instruction: string;
  hint: string;
  validate: (cmd: string, output: string) => boolean;
}

/* ─── Hook ─── */
function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [breakpoint]);
  return mobile;
}

/* ─── Initial Filesystem ─── */
function createInitialFS(): FSNode {
  return {
    type: 'dir', name: '/', permissions: 'drwxr-xr-x',
    children: {
      home: {
        type: 'dir', name: 'home', permissions: 'drwxr-xr-x',
        children: {
          user: {
            type: 'dir', name: 'user', permissions: 'drwxr-xr-x',
            children: {
              'README.md': { type: 'file', name: 'README.md', permissions: '-rw-r--r--', content: '# Welcome to the Terminal Simulator\n\nThis is a simulated Linux terminal for learning.\nTry running `help` to see available commands.' },
              'notes.txt': { type: 'file', name: 'notes.txt', permissions: '-rw-r--r--', content: 'Remember to study:\n- File permissions\n- Directory navigation\n- File manipulation commands' },
              'hello.sh': { type: 'file', name: 'hello.sh', permissions: '-rwxr-xr-x', content: '#!/bin/bash\necho "Hello, World!"' },
              projects: {
                type: 'dir', name: 'projects', permissions: 'drwxr-xr-x',
                children: {
                  'app.js': { type: 'file', name: 'app.js', permissions: '-rw-r--r--', content: 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.send("Hello!"));\napp.listen(3000);' },
                  'index.html': { type: 'file', name: 'index.html', permissions: '-rw-r--r--', content: '<!DOCTYPE html>\n<html>\n<head><title>My Page</title></head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>' },
                  'style.css': { type: 'file', name: 'style.css', permissions: '-rw-r--r--', content: 'body {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}' },
                },
              },
              documents: {
                type: 'dir', name: 'documents', permissions: 'drwxr-xr-x',
                children: {
                  'report.txt': { type: 'file', name: 'report.txt', permissions: '-rw-r--r--', content: 'Quarterly Report Q4 2024\n\nRevenue: $1.2M\nExpenses: $800K\nProfit: $400K' },
                  'todo.txt': { type: 'file', name: 'todo.txt', permissions: '-rw-r--r--', content: '1. Learn terminal commands\n2. Practice file navigation\n3. Understand permissions\n4. Master grep and pipes' },
                },
              },
            },
          },
        },
      },
      etc: {
        type: 'dir', name: 'etc', permissions: 'drwxr-xr-x',
        children: {
          'hostname': { type: 'file', name: 'hostname', permissions: '-rw-r--r--', content: 'learn-terminal' },
          'passwd': { type: 'file', name: 'passwd', permissions: '-rw-r--r--', content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash' },
        },
      },
      tmp: {
        type: 'dir', name: 'tmp', permissions: 'drwxrwxrwt',
        children: {},
      },
      var: {
        type: 'dir', name: 'var', permissions: 'drwxr-xr-x',
        children: {
          log: {
            type: 'dir', name: 'log', permissions: 'drwxr-xr-x',
            children: {
              'syslog': { type: 'file', name: 'syslog', permissions: '-rw-r-----', content: 'Jan  1 00:00:01 learn-terminal systemd[1]: Started Session.\nJan  1 00:00:02 learn-terminal kernel: [0.000000] Linux version 5.15.0' },
            },
          },
        },
      },
    },
  };
}

/* ─── Tutorial Steps ─── */
const TUTORIAL_STEPS: TutorialStep[] = [
  { instruction: 'Print the current working directory using `pwd`', hint: 'Type: pwd', validate: (cmd) => cmd.trim() === 'pwd' },
  { instruction: 'List files in the current directory using `ls`', hint: 'Type: ls', validate: (cmd) => cmd.trim().startsWith('ls') },
  { instruction: 'Read the contents of README.md using `cat`', hint: 'Type: cat README.md', validate: (cmd) => cmd.trim().startsWith('cat') && cmd.includes('README') },
  { instruction: 'Create a new directory called `myproject`', hint: 'Type: mkdir myproject', validate: (cmd) => cmd.trim().startsWith('mkdir') },
  { instruction: 'Change into the `projects` directory', hint: 'Type: cd projects', validate: (cmd) => cmd.trim().startsWith('cd') && cmd.includes('projects') },
  { instruction: 'List files in the projects directory to see what is there', hint: 'Type: ls', validate: (cmd) => cmd.trim().startsWith('ls') },
  { instruction: 'Create a new file called `server.py` using `touch`', hint: 'Type: touch server.py', validate: (cmd) => cmd.trim().startsWith('touch') },
  { instruction: 'Go back to the parent directory using `cd ..`', hint: 'Type: cd ..', validate: (cmd) => cmd.trim() === 'cd ..' },
  { instruction: 'Search for the word "Hello" in all files using `grep`', hint: 'Type: grep Hello *', validate: (cmd) => cmd.trim().startsWith('grep') },
  { instruction: 'Display your username with `whoami`', hint: 'Type: whoami', validate: (cmd) => cmd.trim() === 'whoami' },
];

/* ─── Component ─── */
export default function TerminalSimulator() {
  const isMobile = useIsMobile();
  const [fs, setFs] = useState<FSNode>(createInitialFS);
  const [cwd, setCwd] = useState('/home/user');
  const [history, setHistory] = useState<HistoryEntry[]>([
    { command: '', output: 'Welcome to the Terminal Simulator! Type `help` to see available commands.\n' },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [tutorialMode, setTutorialMode] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Navigate filesystem
  const resolvePath = useCallback((path: string, currentDir: string): string => {
    if (path.startsWith('/')) {
      // Absolute path
      const parts = path.split('/').filter(Boolean);
      return '/' + parts.join('/');
    }
    // Relative path
    const base = currentDir.split('/').filter(Boolean);
    const parts = path.split('/').filter(Boolean);
    for (const part of parts) {
      if (part === '..') {
        base.pop();
      } else if (part !== '.') {
        base.push(part);
      }
    }
    return '/' + base.join('/');
  }, []);

  const getNode = useCallback((path: string, root: FSNode): FSNode | null => {
    if (path === '/') return root;
    const parts = path.split('/').filter(Boolean);
    let current: FSNode = root;
    for (const part of parts) {
      if (current.type !== 'dir' || !current.children?.[part]) return null;
      current = current.children[part];
    }
    return current;
  }, []);

  const getParentAndName = useCallback((path: string, root: FSNode): { parent: FSNode; name: string } | null => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const name = parts.pop()!;
    const parentPath = '/' + parts.join('/');
    const parent = getNode(parentPath, root);
    if (!parent || parent.type !== 'dir') return null;
    return { parent, name };
  }, [getNode]);

  const deepClone = useCallback((node: FSNode): FSNode => {
    const clone: FSNode = { ...node };
    if (node.children) {
      clone.children = {};
      for (const [key, child] of Object.entries(node.children)) {
        clone.children[key] = deepClone(child);
      }
    }
    return clone;
  }, []);

  // Execute commands
  const executeCommand = useCallback((cmd: string): { output: string; isError?: boolean } => {
    const trimmed = cmd.trim();
    if (!trimmed) return { output: '' };

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'help': {
        return {
          output: `Available commands:
  ls [dir]       - List directory contents
  cd <dir>       - Change directory
  pwd            - Print working directory
  cat <file>     - Display file contents
  mkdir <dir>    - Create directory
  touch <file>   - Create empty file
  rm <file/dir>  - Remove file or directory
  cp <src> <dst> - Copy file
  mv <src> <dst> - Move/rename file
  echo <text>    - Print text
  grep <pat> <f> - Search for pattern in file(s)
  chmod <m> <f>  - Change file permissions (simulated)
  whoami         - Print current user
  clear          - Clear terminal
  help           - Show this help message
  tree [dir]     - Show directory tree

Shortcuts:
  Tab            - Autocomplete filenames
  Up/Down        - Command history
  ~              - Home directory (/home/user)`,
        };
      }

      case 'pwd': {
        return { output: cwd };
      }

      case 'whoami': {
        return { output: 'user' };
      }

      case 'clear': {
        setHistory([]);
        return { output: '' };
      }

      case 'ls': {
        const target = args[0] ? resolvePath(args[0].replace('~', '/home/user'), cwd) : cwd;
        const node = getNode(target, fs);
        if (!node) return { output: `ls: cannot access '${args[0] || target}': No such file or directory`, isError: true };
        if (node.type === 'file') return { output: node.name };
        if (!node.children || Object.keys(node.children).length === 0) return { output: '' };

        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');

        let entries = Object.values(node.children);
        if (showAll) {
          entries = [
            { type: 'dir', name: '.', permissions: node.permissions } as FSNode,
            { type: 'dir', name: '..', permissions: 'drwxr-xr-x' } as FSNode,
            ...entries,
          ];
        }

        if (longFormat) {
          const lines = entries.map((e) => {
            const perm = e.permissions || (e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
            const size = e.type === 'file' && e.content ? e.content.length.toString().padStart(5) : '  4096';
            return `${perm}  1 user user ${size} Jan  1 00:00 ${e.type === 'dir' ? `\x1b[1;34m${e.name}/\x1b[0m` : e.name}`;
          });
          return { output: `total ${entries.length}\n${lines.join('\n')}` };
        }

        const items = entries.map((e) => e.type === 'dir' ? `${e.name}/` : e.name);
        return { output: items.join('  ') };
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          setCwd('/home/user');
          return { output: '' };
        }
        const target = resolvePath(args[0].replace('~', '/home/user'), cwd);
        const node = getNode(target, fs);
        if (!node) return { output: `cd: no such file or directory: ${args[0]}`, isError: true };
        if (node.type !== 'dir') return { output: `cd: not a directory: ${args[0]}`, isError: true };
        setCwd(target);
        return { output: '' };
      }

      case 'cat': {
        if (!args[0]) return { output: 'cat: missing file operand', isError: true };
        const target = resolvePath(args[0].replace('~', '/home/user'), cwd);
        const node = getNode(target, fs);
        if (!node) return { output: `cat: ${args[0]}: No such file or directory`, isError: true };
        if (node.type === 'dir') return { output: `cat: ${args[0]}: Is a directory`, isError: true };
        return { output: node.content || '' };
      }

      case 'mkdir': {
        if (!args[0]) return { output: 'mkdir: missing operand', isError: true };
        const target = resolvePath(args[0].replace('~', '/home/user'), cwd);
        const info = getParentAndName(target, fs);
        if (!info) return { output: `mkdir: cannot create directory '${args[0]}': No such file or directory`, isError: true };
        if (info.parent.children?.[info.name]) return { output: `mkdir: cannot create directory '${args[0]}': File exists`, isError: true };

        const newFs = deepClone(fs);
        const parentNode = getNode(target.split('/').slice(0, -1).join('/') || '/', newFs);
        if (parentNode && parentNode.children) {
          parentNode.children[info.name] = { type: 'dir', name: info.name, permissions: 'drwxr-xr-x', children: {} };
          setFs(newFs);
        }
        return { output: '' };
      }

      case 'touch': {
        if (!args[0]) return { output: 'touch: missing file operand', isError: true };
        const target = resolvePath(args[0].replace('~', '/home/user'), cwd);
        const info = getParentAndName(target, fs);
        if (!info) return { output: `touch: cannot touch '${args[0]}': No such file or directory`, isError: true };

        if (!info.parent.children?.[info.name]) {
          const newFs = deepClone(fs);
          const parentNode = getNode(target.split('/').slice(0, -1).join('/') || '/', newFs);
          if (parentNode && parentNode.children) {
            parentNode.children[info.name] = { type: 'file', name: info.name, permissions: '-rw-r--r--', content: '' };
            setFs(newFs);
          }
        }
        return { output: '' };
      }

      case 'rm': {
        if (!args[0]) return { output: 'rm: missing operand', isError: true };
        const isRecursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
        const targetArg = args.find((a) => !a.startsWith('-'));
        if (!targetArg) return { output: 'rm: missing operand', isError: true };

        const target = resolvePath(targetArg.replace('~', '/home/user'), cwd);
        const node = getNode(target, fs);
        if (!node) return { output: `rm: cannot remove '${targetArg}': No such file or directory`, isError: true };
        if (node.type === 'dir' && !isRecursive) return { output: `rm: cannot remove '${targetArg}': Is a directory (use -r)`, isError: true };

        const newFs = deepClone(fs);
        const info = getParentAndName(target, newFs);
        if (info && info.parent.children) {
          delete info.parent.children[info.name];
          setFs(newFs);
        }
        return { output: '' };
      }

      case 'cp': {
        if (args.length < 2) return { output: 'cp: missing file operand', isError: true };
        const srcPath = resolvePath(args[0].replace('~', '/home/user'), cwd);
        const dstPath = resolvePath(args[1].replace('~', '/home/user'), cwd);
        const srcNode = getNode(srcPath, fs);
        if (!srcNode) return { output: `cp: cannot stat '${args[0]}': No such file or directory`, isError: true };
        if (srcNode.type === 'dir') return { output: `cp: -r not specified; omitting directory '${args[0]}'`, isError: true };

        const newFs = deepClone(fs);
        const dstNode = getNode(dstPath, newFs);
        let actualDstPath = dstPath;
        if (dstNode && dstNode.type === 'dir') {
          actualDstPath = dstPath + '/' + srcNode.name;
        }
        const info = getParentAndName(actualDstPath, newFs);
        if (info && info.parent.children) {
          info.parent.children[info.name] = deepClone(srcNode);
          info.parent.children[info.name].name = info.name;
          setFs(newFs);
        }
        return { output: '' };
      }

      case 'mv': {
        if (args.length < 2) return { output: 'mv: missing file operand', isError: true };
        const srcPath = resolvePath(args[0].replace('~', '/home/user'), cwd);
        const dstPath = resolvePath(args[1].replace('~', '/home/user'), cwd);
        const srcNode = getNode(srcPath, fs);
        if (!srcNode) return { output: `mv: cannot stat '${args[0]}': No such file or directory`, isError: true };

        const newFs = deepClone(fs);
        // Remove from source
        const srcInfo = getParentAndName(srcPath, newFs);
        if (!srcInfo) return { output: `mv: cannot move '${args[0]}'`, isError: true };

        const dstNode = getNode(dstPath, newFs);
        let actualDstPath = dstPath;
        if (dstNode && dstNode.type === 'dir') {
          actualDstPath = dstPath + '/' + srcNode.name;
        }
        const dstInfo = getParentAndName(actualDstPath, newFs);
        if (dstInfo && dstInfo.parent.children && srcInfo.parent.children) {
          const movedNode = deepClone(srcInfo.parent.children[srcInfo.name]);
          movedNode.name = dstInfo.name;
          delete srcInfo.parent.children[srcInfo.name];
          dstInfo.parent.children[dstInfo.name] = movedNode;
          setFs(newFs);
        }
        return { output: '' };
      }

      case 'echo': {
        const text = args.join(' ').replace(/^["']|["']$/g, '');
        return { output: text };
      }

      case 'grep': {
        if (args.length < 2) return { output: 'grep: missing pattern or file', isError: true };
        const pattern = args[0];
        const fileArgs = args.slice(1);
        const results: string[] = [];

        for (const fileArg of fileArgs) {
          if (fileArg === '*') {
            // Search all files in current directory
            const dirNode = getNode(cwd, fs);
            if (dirNode?.children) {
              for (const child of Object.values(dirNode.children)) {
                if (child.type === 'file' && child.content) {
                  const lines = child.content.split('\n');
                  for (const line of lines) {
                    if (line.toLowerCase().includes(pattern.toLowerCase())) {
                      results.push(`${child.name}: ${line}`);
                    }
                  }
                }
              }
            }
          } else {
            const target = resolvePath(fileArg.replace('~', '/home/user'), cwd);
            const node = getNode(target, fs);
            if (!node) {
              results.push(`grep: ${fileArg}: No such file or directory`);
            } else if (node.type === 'dir') {
              results.push(`grep: ${fileArg}: Is a directory`);
            } else if (node.content) {
              const lines = node.content.split('\n');
              for (const line of lines) {
                if (line.toLowerCase().includes(pattern.toLowerCase())) {
                  results.push(fileArgs.length > 1 ? `${fileArg}: ${line}` : line);
                }
              }
            }
          }
        }

        if (results.length === 0) return { output: '' };
        return { output: results.join('\n') };
      }

      case 'chmod': {
        if (args.length < 2) return { output: 'chmod: missing operand', isError: true };
        const mode = args[0];
        const target = resolvePath(args[1].replace('~', '/home/user'), cwd);
        const node = getNode(target, fs);
        if (!node) return { output: `chmod: cannot access '${args[1]}': No such file or directory`, isError: true };

        const newFs = deepClone(fs);
        const targetNode = getNode(target, newFs);
        if (targetNode) {
          targetNode.permissions = mode.length === 3
            ? `-${['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'][+mode[0]]}${['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'][+mode[1]]}${['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'][+mode[2]]}`
            : mode;
          setFs(newFs);
        }
        return { output: '' };
      }

      case 'tree': {
        const target = args[0] ? resolvePath(args[0].replace('~', '/home/user'), cwd) : cwd;
        const node = getNode(target, fs);
        if (!node) return { output: `tree: '${args[0] || target}': No such file or directory`, isError: true };
        if (node.type === 'file') return { output: node.name };

        const lines: string[] = [target === cwd ? '.' : args[0] || target];
        let dirCount = 0;
        let fileCount = 0;

        const walk = (n: FSNode, prefix: string) => {
          if (!n.children) return;
          const entries = Object.values(n.children);
          entries.forEach((child, i) => {
            const isLast = i === entries.length - 1;
            const connector = isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ';
            const displayName = child.type === 'dir' ? `${child.name}/` : child.name;
            lines.push(`${prefix}${connector}${displayName}`);
            if (child.type === 'dir') {
              dirCount++;
              walk(child, prefix + (isLast ? '    ' : '\u2502   '));
            } else {
              fileCount++;
            }
          });
        };

        walk(node, '');
        lines.push(`\n${dirCount} directories, ${fileCount} files`);
        return { output: lines.join('\n') };
      }

      default:
        return { output: `${command}: command not found. Type 'help' for available commands.`, isError: true };
    }
  }, [cwd, fs, resolvePath, getNode, getParentAndName, deepClone]);

  const handleSubmit = useCallback(() => {
    const cmd = input.trim();
    if (!cmd) return;

    setCmdHistory((prev) => [cmd, ...prev]);
    setHistIdx(-1);
    setTabSuggestions([]);

    const result = executeCommand(cmd);

    // Tutorial validation
    if (tutorialMode && tutorialStep < TUTORIAL_STEPS.length) {
      const step = TUTORIAL_STEPS[tutorialStep];
      if (step.validate(cmd, result.output)) {
        setTutorialStep((prev) => prev + 1);
        setShowHint(false);
      }
    }

    if (cmd !== 'clear') {
      setHistory((prev) => [...prev, {
        command: cmd,
        output: result.output,
        isError: result.isError,
      }]);
    }

    setInput('');
  }, [input, executeCommand, tutorialMode, tutorialStep]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistIdx((prev) => {
        const next = Math.min(prev + 1, cmdHistory.length - 1);
        if (next >= 0 && cmdHistory[next]) setInput(cmdHistory[next]);
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistIdx((prev) => {
        const next = prev - 1;
        if (next < 0) { setInput(''); return -1; }
        if (cmdHistory[next]) setInput(cmdHistory[next]);
        return next;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const lastPart = parts[parts.length - 1] || '';
      const dirNode = getNode(cwd, fs);
      if (!dirNode?.children) return;

      const matches = Object.keys(dirNode.children).filter((name) =>
        name.startsWith(lastPart)
      );

      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        const node = dirNode.children[matches[0]];
        if (node.type === 'dir') parts[parts.length - 1] += '/';
        setInput(parts.join(' '));
        setTabSuggestions([]);
      } else if (matches.length > 1) {
        setTabSuggestions(matches);
      }
    } else {
      setTabSuggestions([]);
    }
  }, [handleSubmit, cmdHistory, input, cwd, fs, getNode]);

  // Auto-scroll
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when clicking terminal
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const promptStr = `user@learn-terminal:${cwd === '/home/user' ? '~' : cwd}$`;

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Terminal Simulator</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
              Practice Linux commands in a safe, simulated environment
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => { setTutorialMode(!tutorialMode); setTutorialStep(0); setShowHint(false); }}
              style={{
                height: '1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                padding: '0 0.8rem',
                border: tutorialMode ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                background: tutorialMode ? '#0066cc' : 'transparent',
                color: tutorialMode ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {tutorialMode ? 'Exit Tutorial' : 'Tutorial Mode'}
            </button>
            <button
              onClick={() => { setFs(createInitialFS()); setCwd('/home/user'); setHistory([]); }}
              style={{
                height: '1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                padding: '0 0.8rem',
                border: '1px solid var(--sl-color-gray-4)',
                background: 'transparent',
                color: 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tutorial banner */}
      <AnimatePresence>
        {tutorialMode && tutorialStep < TUTORIAL_STEPS.length && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: '#0066cc18',
              borderBottom: '1px solid #0066cc44',
              padding: '0.75rem 1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0066cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.15rem' }}>
                  {TUTORIAL_STEPS[tutorialStep].instruction}
                </div>
              </div>
              <button
                onClick={() => setShowHint(!showHint)}
                style={{
                  height: '1.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '999px',
                  padding: '0 0.7rem',
                  border: '1px solid #f59e0b44',
                  background: '#f59e0b18',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
            {showHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '0.78rem', color: '#f59e0b', fontFamily: 'monospace', marginTop: '0.4rem' }}
              >
                Hint: {TUTORIAL_STEPS[tutorialStep].hint}
              </motion.div>
            )}
            {/* Progress bar */}
            <div style={{ marginTop: '0.5rem', height: 4, background: 'var(--sl-color-gray-5)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${(tutorialStep / TUTORIAL_STEPS.length) * 100}%`, height: '100%', background: '#0066cc', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </motion.div>
        )}
        {tutorialMode && tutorialStep >= TUTORIAL_STEPS.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: '#10b98118',
              borderBottom: '1px solid #10b98144',
              padding: '0.75rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
              Tutorial Complete! You have mastered the basics.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal */}
      <div
        ref={termRef}
        onClick={focusInput}
        style={{
          background: '#0d1117',
          padding: '1rem',
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontSize: isMobile ? '0.72rem' : '0.8rem',
          lineHeight: 1.7,
          color: '#c9d1d9',
          minHeight: 300,
          maxHeight: 450,
          overflowY: 'auto',
          cursor: 'text',
        }}
      >
        {/* History */}
        {history.map((entry, i) => (
          <div key={i}>
            {entry.command && (
              <div>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{promptStr}</span>{' '}
                <span>{entry.command}</span>
              </div>
            )}
            {entry.output && (
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: entry.isError ? '#ef4444' : '#c9d1d9',
              }}>
                {entry.output}
              </pre>
            )}
          </div>
        ))}

        {/* Tab suggestions */}
        {tabSuggestions.length > 0 && (
          <div style={{ color: '#8b5cf6', marginBottom: '0.25rem' }}>
            {tabSuggestions.join('  ')}
          </div>
        )}

        {/* Input line */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#10b981', fontWeight: 600, flexShrink: 0 }}>{promptStr}</span>
          <span>&nbsp;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#c9d1d9',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              padding: 0,
              caretColor: '#10b981',
            }}
          />
        </div>
      </div>
    </div>
  );
}
