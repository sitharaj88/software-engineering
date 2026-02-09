import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';

interface CodeExample {
  python?: string;
  javascript?: string;
  java?: string;
  cpp?: string;
}

interface Props {
  code: CodeExample;
  defaultLanguage?: keyof CodeExample;
  height?: string;
  readOnly?: boolean;
  title?: string;
  expectedOutput?: Record<string, string>;
}

const LANG_CONFIG: Record<string, { label: string; monacoLang: string; icon: string }> = {
  python: { label: 'Python', monacoLang: 'python', icon: '🐍' },
  javascript: { label: 'JavaScript', monacoLang: 'javascript', icon: 'JS' },
  java: { label: 'Java', monacoLang: 'java', icon: '☕' },
  cpp: { label: 'C++', monacoLang: 'cpp', icon: '⚡' },
};

export default function CodePlayground({
  code,
  defaultLanguage = 'python',
  height = '320px',
  readOnly = false,
  title = 'Code Playground',
  expectedOutput = {},
}: Props) {
  const availableLangs = Object.keys(code).filter((k) => code[k as keyof CodeExample]);
  const [lang, setLang] = useState<string>(availableLangs.includes(defaultLanguage) ? defaultLanguage : availableLangs[0]);
  const [editedCode, setEditedCode] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const k of availableLangs) initial[k] = code[k as keyof CodeExample]!;
    return initial;
  });
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setShowOutput(true);
    setTimeout(() => {
      if (expectedOutput[lang]) {
        setOutput(expectedOutput[lang]);
      } else {
        setOutput(`// Output for ${LANG_CONFIG[lang]?.label || lang}\n// Code executed successfully ✓\n// (In-browser execution simulated)`);
      }
      setIsRunning(false);
    }, 600);
  }, [lang, expectedOutput]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editedCode[lang] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [lang, editedCode]);

  const handleReset = useCallback(() => {
    setEditedCode((prev) => ({ ...prev, [lang]: code[lang as keyof CodeExample] || '' }));
    setOutput('');
    setShowOutput(false);
  }, [lang, code]);

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0', background: '#1e1e1e' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#2d2d2d', borderBottom: '1px solid #404040' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
          </div>
          <span style={{ color: '#ccc', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 500 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {availableLangs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: lang === l ? '#0066cc' : '#3d3d3d',
                color: lang === l ? '#fff' : '#999',
                transition: 'all 0.2s',
              }}
            >
              {LANG_CONFIG[l]?.label || l}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <Editor
        height={height}
        language={LANG_CONFIG[lang]?.monacoLang || lang}
        value={editedCode[lang] || ''}
        onChange={(val) => setEditedCode((prev) => ({ ...prev, [lang]: val || '' }))}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          padding: { top: 12 },
          fontFamily: '"Fira Code", Menlo, Monaco, monospace',
          fontLigatures: true,
        }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: '#2d2d2d', borderTop: '1px solid #404040' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleRun} disabled={isRunning} style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: isRunning ? 0.7 : 1 }}>
            {isRunning ? '⏳ Running...' : '▶ Run'}
          </button>
          <button onClick={handleReset} style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: '1px solid #555', background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem' }}>
            ↺ Reset
          </button>
        </div>
        <button onClick={handleCopy} style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: '1px solid #555', background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem' }}>
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>

      {/* Output */}
      {showOutput && (
        <div style={{ borderTop: '1px solid #404040', padding: '0.75rem 1rem', background: '#1a1a2e', maxHeight: '150px', overflow: 'auto' }}>
          <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</div>
          <pre style={{ color: '#e0e0e0', fontSize: '0.85rem', fontFamily: '"Fira Code", monospace', margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
        </div>
      )}
    </div>
  );
}
