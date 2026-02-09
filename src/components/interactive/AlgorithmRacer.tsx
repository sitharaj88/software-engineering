import { useState, useCallback, useRef } from 'react';
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

export default function AlgorithmRacer() {
  const [size, setSize] = useState(500);
  const [selected, setSelected] = useState<Set<SortAlgo>>(new Set(['bubble', 'merge', 'quick']));
  const [results, setResults] = useState<RaceResult[]>([]);
  const [racing, setRacing] = useState(false);
  const [inputType, setInputType] = useState<'random' | 'sorted' | 'reversed' | 'nearly'>('random');

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
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Algorithm Race</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>Compare sorting algorithms head-to-head with real performance metrics</p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Algorithm selection */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {(Object.keys(ALGO_NAMES) as SortAlgo[]).map((algo) => (
            <button key={algo} onClick={() => toggle(algo)}
              style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', border: selected.has(algo) ? `2px solid ${ALGO_COLORS[algo]}` : '1px solid var(--sl-color-gray-4)', background: selected.has(algo) ? `${ALGO_COLORS[algo]}15` : 'transparent', color: selected.has(algo) ? ALGO_COLORS[algo] : 'var(--sl-color-gray-3)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
              {ALGO_NAMES[algo]}
            </button>
          ))}
        </div>

        {/* Config */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            Array Size:
            <input type="range" min={100} max={5000} step={100} value={size} onChange={(e) => setSize(+e.target.value)} style={{ width: 120 }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 45 }}>{size}</span>
          </label>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <span>Input:</span>
            {(['random', 'sorted', 'reversed', 'nearly'] as const).map((type) => (
              <button key={type} onClick={() => setInputType(type)}
                style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: inputType === type ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)', background: inputType === type ? '#0066cc' : 'transparent', color: inputType === type ? '#fff' : 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={startRace} disabled={racing}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '0.375rem', border: 'none', background: racing ? '#6b7280' : '#10b981', color: '#fff', cursor: racing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
            {racing ? '⏳ Racing...' : '🏁 Start Race!'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {results.map((r, i) => (
                <div key={r.algorithm} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#f59e0b' : 'var(--sl-color-gray-5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: i === 0 ? '#fff' : 'var(--sl-color-gray-3)', flexShrink: 0 }}>
                    {i === 0 ? '🏆' : i + 1}
                  </div>
                  <div style={{ width: 120, fontSize: '0.85rem', fontWeight: 600, flexShrink: 0, color: r.color }}>{r.name}</div>
                  <div style={{ flex: 1, height: 28, background: 'var(--sl-color-gray-6)', borderRadius: '0.25rem', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(5, (r.time / maxTime) * 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: r.color, borderRadius: '0.25rem', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                      <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.time.toFixed(2)}ms</span>
                    </motion.div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)', minWidth: 140, textAlign: 'right' }}>
                    {r.comparisons.toLocaleString()} cmp / {r.swaps.toLocaleString()} swp
                  </div>
                </div>
              ))}
            </div>

            {/* Summary table */}
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
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td>
                    <td style={{ padding: '0.5rem', color: r.color, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.time.toFixed(3)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.comparisons.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.swaps.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', color: i === 0 ? '#10b981' : '#ef4444' }}>
                      {i === 0 ? '—' : `${(r.time / results[0].time).toFixed(1)}x slower`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results.length === 0 && !racing && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sl-color-gray-3)' }}>
            Select algorithms and click "Start Race" to compare their performance
          </div>
        )}
      </div>
    </div>
  );
}
