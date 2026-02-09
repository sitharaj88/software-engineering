import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

type SortAlgo = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';

interface RaceResult {
  algorithm: SortAlgo;
  name: string;
  time: number;
  comparisons: number;
  swaps: number;
  color: string;
}

const ALGO_NAMES: Record<SortAlgo, string> = {
  bubble: 'Bubble Sort',
  selection: 'Selection Sort',
  insertion: 'Insertion Sort',
  merge: 'Merge Sort',
  quick: 'Quick Sort',
  heap: 'Heap Sort',
};

const ALGO_COLORS: Record<SortAlgo, string> = {
  bubble: '#ef4444',
  selection: '#f59e0b',
  insertion: '#10b981',
  merge: '#3b82f6',
  quick: '#8b5cf6',
  heap: '#ec4899',
};

function bubbleSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      comparisons++;
      if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swaps++; }
    }
  return { comparisons, swaps };
}

function selectionSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) { comparisons++; if (a[j] < a[min]) min = j; }
    if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; swaps++; }
  }
  return { comparisons, swaps };
}

function insertionSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i]; let j = i - 1;
    while (j >= 0 && a[j] > key) { comparisons++; a[j + 1] = a[j]; swaps++; j--; }
    comparisons++;
    a[j + 1] = key;
  }
  return { comparisons, swaps };
}

function mergeSortCount(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  function ms(a: number[]): number[] {
    if (a.length <= 1) return a;
    const m = Math.floor(a.length / 2);
    const l = ms(a.slice(0, m)), r = ms(a.slice(m));
    const res: number[] = [];
    let i = 0, j = 0;
    while (i < l.length && j < r.length) {
      comparisons++;
      if (l[i] <= r[j]) res.push(l[i++]); else { res.push(r[j++]); swaps++; }
    }
    while (i < l.length) res.push(l[i++]);
    while (j < r.length) res.push(r[j++]);
    return res;
  }
  ms([...arr]);
  return { comparisons, swaps };
}

function quickSortCount(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  function qs(a: number[], l: number, r: number) {
    if (l >= r) return;
    const pivot = a[r]; let i = l - 1;
    for (let j = l; j < r; j++) { comparisons++; if (a[j] < pivot) { i++; [a[i], a[j]] = [a[j], a[i]]; swaps++; } }
    [a[i + 1], a[r]] = [a[r], a[i + 1]]; swaps++;
    const pi = i + 1;
    qs(a, l, pi - 1); qs(a, pi + 1, r);
  }
  qs([...arr], 0, arr.length - 1);
  return { comparisons, swaps };
}

function heapSortCount(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const a = [...arr];
  function heapify(n: number, i: number) {
    let largest = i; const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n) { comparisons++; if (a[l] > a[largest]) largest = l; }
    if (r < n) { comparisons++; if (a[r] > a[largest]) largest = r; }
    if (largest !== i) { [a[i], a[largest]] = [a[largest], a[i]]; swaps++; heapify(n, largest); }
  }
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i);
  for (let i = a.length - 1; i > 0; i--) { [a[0], a[i]] = [a[i], a[0]]; swaps++; heapify(i, 0); }
  return { comparisons, swaps };
}

const SORT_FNS: Record<SortAlgo, (arr: number[]) => { comparisons: number; swaps: number }> = {
  bubble: bubbleSort, selection: selectionSort, insertion: insertionSort,
  merge: mergeSortCount, quick: quickSortCount, heap: heapSortCount,
};

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

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--sl-color-gray-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
};

export default function AlgorithmRacer() {
  const [size, setSize] = useState(500);
  const [selected, setSelected] = useState<Set<SortAlgo>>(new Set(['bubble', 'merge', 'quick']));
  const [results, setResults] = useState<RaceResult[]>([]);
  const [racing, setRacing] = useState(false);
  const [inputType, setInputType] = useState<'random' | 'sorted' | 'reversed' | 'nearly'>('random');
  const isMobile = useIsMobile();

  const generateInput = useCallback(() => {
    let arr: number[];
    switch (inputType) {
      case 'sorted': arr = Array.from({ length: size }, (_, i) => i); break;
      case 'reversed': arr = Array.from({ length: size }, (_, i) => size - i); break;
      case 'nearly': {
        arr = Array.from({ length: size }, (_, i) => i);
        for (let i = 0; i < size * 0.05; i++) {
          const a = Math.floor(Math.random() * size), b = Math.floor(Math.random() * size);
          [arr[a], arr[b]] = [arr[b], arr[a]];
        }
        break;
      }
      default: arr = Array.from({ length: size }, () => Math.floor(Math.random() * size * 10));
    }
    return arr;
  }, [size, inputType]);

  const startRace = useCallback(() => {
    setRacing(true);
    setResults([]);
    const arr = generateInput();
    const newResults: RaceResult[] = [];

    setTimeout(() => {
      for (const algo of selected) {
        const start = performance.now();
        const { comparisons, swaps } = SORT_FNS[algo](arr);
        const time = performance.now() - start;
        newResults.push({ algorithm: algo, name: ALGO_NAMES[algo], time, comparisons, swaps, color: ALGO_COLORS[algo] });
      }
      newResults.sort((a, b) => a.time - b.time);
      setResults(newResults);
      setRacing(false);
    }, 100);
  }, [selected, generateInput]);

  const toggle = (algo: SortAlgo) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(algo)) { if (next.size > 1) next.delete(algo); }
      else next.add(algo);
      return next;
    });
  };

  const maxTime = Math.max(...results.map((r) => r.time), 1);

  return (
    <div style={{
      border: '1px solid var(--sl-color-gray-5)',
      borderRadius: 12,
      overflow: 'hidden',
      margin: '1.5rem 0',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--sl-color-gray-5)',
        background: 'var(--sl-color-gray-6)',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Algorithm Race</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Compare sorting algorithms head-to-head with real performance metrics
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Algorithm Selection Pills */}
        <div style={{
          marginBottom: '1rem',
          ...(isMobile
            ? { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }
            : { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const }
          ),
        }}>
          {(Object.keys(ALGO_NAMES) as SortAlgo[]).map((algo) => (
            <button
              key={algo}
              onClick={() => toggle(algo)}
              style={{
                padding: isMobile ? '0.55rem 0.5rem' : '0.35rem 0.75rem',
                borderRadius: 999,
                border: selected.has(algo)
                  ? `2px solid ${ALGO_COLORS[algo]}`
                  : '1px solid var(--sl-color-gray-4)',
                background: selected.has(algo)
                  ? `${ALGO_COLORS[algo]}15`
                  : 'transparent',
                color: selected.has(algo)
                  ? ALGO_COLORS[algo]
                  : 'var(--sl-color-gray-3)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 600,
                minHeight: isMobile ? 44 : undefined,
                textAlign: 'center' as const,
              }}
            >
              {ALGO_NAMES[algo]}
            </button>
          ))}
        </div>

        {/* Config Section */}
        {isMobile ? (
          /* ---- MOBILE Config ---- */
          <div style={{
            background: 'var(--sl-color-gray-6)',
            border: '1.5px solid var(--sl-color-gray-5)',
            borderRadius: 10,
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {/* Array Size */}
            <div>
              <div style={sectionLabel}>Array Size</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="range" min={100} max={5000} step={100}
                  value={size} onChange={(e) => setSize(+e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', minWidth: 45 }}>
                  {size}
                </span>
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: 'var(--sl-color-gray-5)' }} />

            {/* Data Pattern */}
            <div>
              <div style={sectionLabel}>Data Pattern</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
                {(['random', 'sorted', 'reversed', 'nearly'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    style={{
                      padding: '0.5rem 0.25rem',
                      borderRadius: 4,
                      border: inputType === type ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                      background: inputType === type ? '#0066cc' : 'transparent',
                      color: inputType === type ? '#fff' : 'var(--sl-color-text)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textAlign: 'center' as const,
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: 'var(--sl-color-gray-5)' }} />

            {/* Start Race Button */}
            <button
              onClick={startRace}
              disabled={racing}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: 8,
                border: 'none',
                background: racing ? '#6b7280' : '#10b981',
                color: '#fff',
                cursor: racing ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                minHeight: 48,
              }}
            >
              {racing ? 'Racing...' : 'Start Race!'}
            </button>
          </div>
        ) : (
          /* ---- DESKTOP Config ---- */
          <div style={{
            background: 'var(--sl-color-gray-6)',
            border: '1.5px solid var(--sl-color-gray-5)',
            borderRadius: 10,
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '1.5rem',
            alignItems: 'start',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {/* Column 1: Array Size */}
            <div>
              <div style={sectionLabel}>Array Size</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="range" min={100} max={5000} step={100}
                  value={size} onChange={(e) => setSize(+e.target.value)}
                  style={{ width: 160 }}
                />
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', minWidth: 45 }}>
                  {size}
                </span>
              </div>
            </div>

            {/* Column 2: Data Pattern */}
            <div>
              <div style={sectionLabel}>Data Pattern</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                {(['random', 'sorted', 'reversed', 'nearly'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 4,
                      border: inputType === type ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                      background: inputType === type ? '#0066cc' : 'transparent',
                      color: inputType === type ? '#fff' : 'var(--sl-color-text)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textAlign: 'center' as const,
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Start Race button */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <button
                onClick={startRace}
                disabled={racing}
                style={{
                  padding: '0.6rem 2rem',
                  borderRadius: 8,
                  border: 'none',
                  background: racing ? '#6b7280' : '#10b981',
                  color: '#fff',
                  cursor: racing ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {racing ? 'Racing...' : 'Start Race!'}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            {/* Race Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {results.map((r, i) => (
                isMobile ? (
                  /* ---- MOBILE result row (stacked) ---- */
                  <div key={r.algorithm} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    padding: '0.6rem',
                    background: 'var(--sl-color-gray-6)',
                    borderRadius: 8,
                  }}>
                    {/* Row 1: rank + name + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: i === 0 ? '#f59e0b' : 'var(--sl-color-gray-5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 900,
                        color: i === 0 ? '#fff' : 'var(--sl-color-gray-3)',
                        flexShrink: 0,
                      }}>
                        {i === 0 ? '\u{1F3C6}' : i + 1}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: r.color, flex: 1 }}>
                        {r.name}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem' }}>
                        {r.time.toFixed(2)}ms
                      </span>
                    </div>
                    {/* Row 2: progress bar full width */}
                    <div style={{ height: 24, background: 'var(--sl-color-gray-5)', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(5, (r.time / maxTime) * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: r.color, borderRadius: 4 }}
                      />
                    </div>
                    {/* Row 3: stats */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--sl-color-gray-3)', display: 'flex', gap: '0.75rem' }}>
                      <span>{r.comparisons.toLocaleString()} comparisons</span>
                      <span>{r.swaps.toLocaleString()} swaps</span>
                    </div>
                  </div>
                ) : (
                  /* ---- DESKTOP result row (horizontal) ---- */
                  <div key={r.algorithm} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: i === 0 ? '#f59e0b' : 'var(--sl-color-gray-5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 900,
                      color: i === 0 ? '#fff' : 'var(--sl-color-gray-3)',
                      flexShrink: 0,
                    }}>
                      {i === 0 ? '\u{1F3C6}' : i + 1}
                    </div>
                    <div style={{ width: 120, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0, color: r.color }}>
                      {r.name}
                    </div>
                    <div style={{ flex: 1, height: 28, background: 'var(--sl-color-gray-6)', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(5, (r.time / maxTime) * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                          height: '100%', background: r.color, borderRadius: 4,
                          display: 'flex', alignItems: 'center', paddingLeft: '0.5rem',
                        }}
                      >
                        <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {r.time.toFixed(2)}ms
                        </span>
                      </motion.div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)', minWidth: 140, textAlign: 'right' }}>
                      {r.comparisons.toLocaleString()} cmp / {r.swaps.toLocaleString()} swp
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Summary: mobile cards vs desktop table */}
            {isMobile ? (
              /* ---- MOBILE Summary Cards ---- */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {results.map((r, i) => (
                  <div key={r.algorithm} style={{
                    border: '1px solid var(--sl-color-gray-5)',
                    borderRadius: 8,
                    padding: '0.75rem',
                    background: 'var(--sl-color-gray-6)',
                  }}>
                    {/* Card header: rank + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `#${i + 1}`}
                      </span>
                      <span style={{ fontWeight: 600, color: r.color, fontSize: '0.85rem' }}>
                        {r.name}
                      </span>
                    </div>
                    {/* Card stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: '0.15rem' }}>
                          Time
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                          {r.time.toFixed(3)}ms
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: '0.15rem' }}>
                          vs Winner
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: i === 0 ? '#10b981' : '#ef4444' }}>
                          {i === 0 ? '\u2014' : `${(r.time / results[0].time).toFixed(1)}x slower`}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: '0.15rem' }}>
                          Comparisons
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                          {r.comparisons.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: '0.15rem' }}>
                          Swaps
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                          {r.swaps.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ---- DESKTOP Summary Table ---- */
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--sl-color-gray-5)' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Algorithm</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Time (ms)</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Comparisons</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Swaps</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>vs Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.algorithm} style={{ borderBottom: '1px solid var(--sl-color-gray-5)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700 }}>
                          {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `#${i + 1}`}
                        </td>
                        <td style={{ padding: '0.5rem', color: r.color, fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.time.toFixed(3)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.comparisons.toLocaleString()}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.swaps.toLocaleString()}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', color: i === 0 ? '#10b981' : '#ef4444' }}>
                          {i === 0 ? '\u2014' : `${(r.time / results[0].time).toFixed(1)}x slower`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !racing && (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1.5rem',
            color: 'var(--sl-color-gray-3)',
            border: '1px dashed var(--sl-color-gray-5)',
            borderRadius: 8,
            background: 'var(--sl-color-gray-6)',
          }}>
            Select algorithms and click "Start Race" to compare their performance
          </div>
        )}
      </div>
    </div>
  );
}
