import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegexMatch {
  text: string;
  index: number;
  groups: string[];
}

interface RegexToken {
  token: string;
  explanation: string;
  color: string;
}

interface Preset {
  label: string;
  pattern: string;
  flags: string;
  testText: string;
}

const PRESETS: Preset[] = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g', testText: 'Contact us at hello@example.com or support@company.org for more info. Invalid: user@.com' },
  { label: 'URL', pattern: 'https?://[\\w.-]+(?:\\.[a-zA-Z]{2,})(?:/[\\w./?&=-]*)?', flags: 'g', testText: 'Visit https://example.com or http://docs.site.org/page?q=1 for details. Not a URL: ftp://old.server' },
  { label: 'IP Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g', testText: 'Server at 192.168.1.1 and 10.0.0.255 responded. Invalid: 999.999.999.999 is not checked by this simple pattern.' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g', testText: 'Events on 2024-01-15, 2024-12-31, and 2025-06-01. Invalid: 2024-13-01 or 2024-00-15.' },
  { label: 'Phone Number', pattern: '(?:\\+?1[-.]?)?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}', flags: 'g', testText: 'Call (555) 123-4567 or +1-800-555-0199 or 555.867.5309 for support.' },
];

const HIGHLIGHT_COLORS = ['#0066cc', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const DEFAULT_PATTERN = '\\b[A-Z][a-z]+\\b';
const DEFAULT_FLAGS = 'g';
const DEFAULT_TEXT = 'The quick Brown Fox jumps over the Lazy Dog. Alice and Bob met at the Park on a Sunny day.';

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

function tokenizeRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;

  const tokenColors = {
    quantifier: '#f59e0b',
    charClass: '#8b5cf6',
    group: '#ec4899',
    anchor: '#10b981',
    escape: '#0066cc',
    alternation: '#ef4444',
    literal: 'var(--sl-color-gray-3)',
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      const escapes: Record<string, string> = {
        'd': 'any digit [0-9]',
        'D': 'any non-digit',
        'w': 'any word character [a-zA-Z0-9_]',
        'W': 'any non-word character',
        's': 'any whitespace',
        'S': 'any non-whitespace',
        'b': 'word boundary',
        'B': 'non-word boundary',
        'n': 'newline',
        't': 'tab',
        '.': 'literal dot',
        '\\': 'literal backslash',
        '(': 'literal (',
        ')': 'literal )',
        '[': 'literal [',
        ']': 'literal ]',
        '{': 'literal {',
        '}': 'literal }',
        '+': 'literal +',
        '*': 'literal *',
        '?': 'literal ?',
        '|': 'literal |',
        '^': 'literal ^',
        '$': 'literal $',
      };
      tokens.push({
        token: `\\${next}`,
        explanation: escapes[next] || `escaped "${next}"`,
        color: next === 'b' || next === 'B' ? tokenColors.anchor : tokenColors.escape,
      });
      i += 2;
      continue;
    }

    if (ch === '[') {
      let bracket = '[';
      let j = i + 1;
      if (j < pattern.length && pattern[j] === '^') { bracket += '^'; j++; }
      while (j < pattern.length && pattern[j] !== ']') { bracket += pattern[j]; j++; }
      if (j < pattern.length) bracket += ']';
      const negated = bracket.includes('[^') ? 'NOT ' : '';
      tokens.push({ token: bracket, explanation: `${negated}character class: ${bracket}`, color: tokenColors.charClass });
      i = j + 1;
      continue;
    }

    if (ch === '(' || ch === ')') {
      if (ch === '(' && pattern.substring(i, i + 3) === '(?:') {
        tokens.push({ token: '(?:', explanation: 'non-capturing group start', color: tokenColors.group });
        i += 3;
      } else if (ch === '(' && pattern.substring(i, i + 4) === '(?<=') {
        tokens.push({ token: '(?<=', explanation: 'positive lookbehind', color: tokenColors.group });
        i += 4;
      } else if (ch === '(' && pattern.substring(i, i + 4) === '(?<!') {
        tokens.push({ token: '(?<!', explanation: 'negative lookbehind', color: tokenColors.group });
        i += 4;
      } else if (ch === '(' && pattern.substring(i, i + 3) === '(?=') {
        tokens.push({ token: '(?=', explanation: 'positive lookahead', color: tokenColors.group });
        i += 3;
      } else if (ch === '(' && pattern.substring(i, i + 3) === '(?!') {
        tokens.push({ token: '(?!', explanation: 'negative lookahead', color: tokenColors.group });
        i += 3;
      } else {
        tokens.push({ token: ch, explanation: ch === '(' ? 'capturing group start' : 'group end', color: tokenColors.group });
        i++;
      }
      continue;
    }

    if (ch === '*' || ch === '+' || ch === '?') {
      const lazy = i + 1 < pattern.length && pattern[i + 1] === '?';
      const desc = ch === '*' ? 'zero or more' : ch === '+' ? 'one or more' : 'zero or one';
      tokens.push({ token: lazy ? `${ch}?` : ch, explanation: `${desc}${lazy ? ' (lazy)' : ' (greedy)'}`, color: tokenColors.quantifier });
      i += lazy ? 2 : 1;
      continue;
    }

    if (ch === '{') {
      let quant = '{';
      let j = i + 1;
      while (j < pattern.length && pattern[j] !== '}') { quant += pattern[j]; j++; }
      if (j < pattern.length) quant += '}';
      tokens.push({ token: quant, explanation: `repeat ${quant}`, color: tokenColors.quantifier });
      i = j + 1;
      continue;
    }

    if (ch === '^') { tokens.push({ token: '^', explanation: 'start of line/string', color: tokenColors.anchor }); i++; continue; }
    if (ch === '$') { tokens.push({ token: '$', explanation: 'end of line/string', color: tokenColors.anchor }); i++; continue; }
    if (ch === '.') { tokens.push({ token: '.', explanation: 'any character (except newline)', color: tokenColors.charClass }); i++; continue; }
    if (ch === '|') { tokens.push({ token: '|', explanation: 'alternation (OR)', color: tokenColors.alternation }); i++; continue; }

    tokens.push({ token: ch, explanation: `literal "${ch}"`, color: tokenColors.literal });
    i++;
  }

  return tokens;
}

export default function RegexTester() {
  const isMobile = useIsMobile();
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [testText, setTestText] = useState(DEFAULT_TEXT);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [showExplanation, setShowExplanation] = useState(true);

  const flagOptions = [
    { flag: 'g', label: 'g', description: 'Global' },
    { flag: 'i', label: 'i', description: 'Case insensitive' },
    { flag: 'm', label: 'm', description: 'Multiline' },
    { flag: 's', label: 's', description: 'Dotall' },
  ];

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  const applyPreset = (preset: Preset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestText(preset.testText);
  };

  // Compute matches
  const { matches, error, regex } = useMemo(() => {
    if (!pattern) return { matches: [], error: null, regex: null };
    try {
      const re = new RegExp(pattern, flags);
      const results: RegexMatch[] = [];
      let match;

      if (flags.includes('g')) {
        while ((match = re.exec(testText)) !== null) {
          results.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (match[0].length === 0) re.lastIndex++;
        }
      } else {
        match = re.exec(testText);
        if (match) {
          results.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      return { matches: results, error: null, regex: re };
    } catch (e: any) {
      return { matches: [], error: e.message, regex: null };
    }
  }, [pattern, testText, flags]);

  // Build highlighted text
  const highlightedText = useMemo(() => {
    if (!regex || matches.length === 0 || !testText) return null;

    const parts: { text: string; isMatch: boolean; matchIndex: number }[] = [];
    let lastEnd = 0;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (m.index > lastEnd) {
        parts.push({ text: testText.slice(lastEnd, m.index), isMatch: false, matchIndex: -1 });
      }
      parts.push({ text: m.text, isMatch: true, matchIndex: i });
      lastEnd = m.index + m.text.length;
    }
    if (lastEnd < testText.length) {
      parts.push({ text: testText.slice(lastEnd), isMatch: false, matchIndex: -1 });
    }

    return parts;
  }, [regex, matches, testText]);

  const tokens = useMemo(() => tokenizeRegex(pattern), [pattern]);

  const pillBtn = (active: boolean): React.CSSProperties => ({
    height: '1.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '0 0.6rem',
    border: active ? '2px solid #0066cc' : '2px solid var(--sl-color-gray-4)',
    background: active ? '#0066cc' : 'transparent',
    color: active ? '#fff' : 'var(--sl-color-text)',
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontWeight: 600,
    transition: 'all 0.15s',
    minWidth: '2rem',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    border: error ? '2px solid #ef4444' : '1px solid var(--sl-color-gray-5)',
    background: 'var(--sl-color-gray-7, #0d1117)',
    color: 'var(--sl-color-text)',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Regex Tester</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Test regular expressions with real-time matching, highlighting, and explanations
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Presets */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Presets
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid var(--sl-color-gray-5)',
                  background: 'var(--sl-color-gray-6)',
                  color: 'var(--sl-color-text)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern input */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pattern</label>
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--sl-color-gray-3)', marginRight: '0.3rem' }}>Flags:</span>
              {flagOptions.map(f => (
                <button
                  key={f.flag}
                  onClick={() => toggleFlag(f.flag)}
                  title={f.description}
                  style={pillBtn(flags.includes(f.flag))}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--sl-color-gray-4)', fontFamily: 'monospace', fontSize: '1rem', pointerEvents: 'none' }}>/</span>
            <input
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '1.4rem', paddingRight: `${flags.length * 0.6 + 1.4}rem` }}
              placeholder="Enter regex pattern..."
            />
            <span style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#0066cc', fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 600, pointerEvents: 'none' }}>/{flags}</span>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '0.35rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '4px',
                background: '#ef444418',
                border: '1px solid #ef444440',
                fontSize: '0.75rem',
                color: '#ef4444',
                fontFamily: 'monospace',
              }}
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Test string */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Test String</label>
          <textarea
            value={testText}
            onChange={e => setTestText(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.6,
            }}
            placeholder="Enter text to test against..."
          />
        </div>

        {/* Highlighted result */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Result ({matches.length} match{matches.length !== 1 ? 'es' : ''})
            </div>
          </div>
          <div style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--sl-color-gray-7, #0d1117)',
            border: '1px solid var(--sl-color-gray-5)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: '3rem',
          }}>
            {highlightedText ? (
              highlightedText.map((part, i) =>
                part.isMatch ? (
                  <span
                    key={i}
                    style={{
                      background: `${HIGHLIGHT_COLORS[part.matchIndex % HIGHLIGHT_COLORS.length]}35`,
                      border: `1px solid ${HIGHLIGHT_COLORS[part.matchIndex % HIGHLIGHT_COLORS.length]}`,
                      borderRadius: '3px',
                      padding: '0.05rem 0.15rem',
                    }}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i} style={{ color: 'var(--sl-color-gray-3)' }}>{part.text}</span>
                )
              )
            ) : (
              <span style={{ color: 'var(--sl-color-gray-4)' }}>
                {!pattern ? 'Enter a regex pattern above...' : error ? 'Fix the pattern error to see results.' : 'No matches found.'}
              </span>
            )}
          </div>
        </div>

        {/* Matches list */}
        {matches.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Match Details
            </div>
            <div style={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '8px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontWeight: 600 }}>#</th>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontWeight: 600 }}>Match</th>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontWeight: 600 }}>Index</th>
                    {matches.some(m => m.groups.length > 0) && (
                      <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', fontWeight: 600 }}>Groups</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--sl-color-gray-5)' }}>
                      <td style={{ padding: '0.4rem 0.6rem', color: 'var(--sl-color-gray-4)' }}>{i + 1}</td>
                      <td style={{ padding: '0.4rem 0.6rem' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '3px',
                          background: `${HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]}25`,
                          border: `1px solid ${HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]}60`,
                          color: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length],
                          fontWeight: 600,
                        }}>
                          {m.text}
                        </span>
                      </td>
                      <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', color: 'var(--sl-color-gray-3)' }}>
                        {m.index}
                      </td>
                      {matches.some(m => m.groups.length > 0) && (
                        <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {m.groups.length > 0 ? m.groups.map((g, gi) => (
                            <span key={gi} style={{ marginRight: '0.3rem', color: '#8b5cf6' }}>
                              ${gi + 1}: {g || '(empty)'}
                            </span>
                          )) : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Regex explanation */}
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.5rem' }}
            onClick={() => setShowExplanation(p => !p)}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pattern Explanation
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-4)' }}>
              {showExplanation ? 'Hide' : 'Show'}
            </span>
          </div>
          <AnimatePresence>
            {showExplanation && pattern && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--sl-color-gray-6)',
                  border: '1px solid var(--sl-color-gray-5)',
                }}>
                  {/* Token visualization */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.75rem' }}>
                    {tokens.map((t, i) => (
                      <span
                        key={i}
                        title={t.explanation}
                        style={{
                          fontFamily: 'monospace',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '4px',
                          background: `${t.color}18`,
                          border: `1px solid ${t.color}50`,
                          color: t.color,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'default',
                        }}
                      >
                        {t.token}
                      </span>
                    ))}
                  </div>
                  {/* Token breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {tokens.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', fontSize: '0.75rem' }}>
                        <code style={{
                          fontFamily: 'monospace',
                          color: t.color,
                          fontWeight: 700,
                          minWidth: isMobile ? 50 : 70,
                          flexShrink: 0,
                        }}>
                          {t.token}
                        </code>
                        <span style={{ color: 'var(--sl-color-gray-3)' }}>{t.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
