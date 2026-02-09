import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

type SortAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';
type BarState = 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot';

interface BarData {
  value: number;
  state: BarState;
}

const COLORS: Record<BarState, string> = {
  default: '#0066cc',
  comparing: '#f59e0b',
  swapping: '#ef4444',
  sorted: '#10b981',
  pivot: '#8b5cf6',
};

const ALGO_INFO: Record<SortAlgorithm, { name: string; best: string; avg: string; worst: string; space: string; stable: boolean }> = {
  bubble: { name: 'Bubble Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  selection: { name: 'Selection Sort', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false },
  insertion: { name: 'Insertion Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  merge: { name: 'Merge Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
  quick: { name: 'Quick Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false },
  heap: { name: 'Heap Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false },
};

function generateArray(size: number): BarData[] {
  return Array.from({ length: size }, () => ({
    value: Math.floor(Math.random() * 90) + 10,
    state: 'default' as BarState,
  }));
}

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

export default function SortingVisualizer() {
  const [size, setSize] = useState(30);
  const [speed, setSpeed] = useState(50);
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>('bubble');
  const [bars, setBars] = useState<BarData[]>(() => generateArray(30));
  const [sorting, setSorting] = useState(false);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [done, setDone] = useState(false);
  const stopRef = useRef(false);
  const isMobile = useIsMobile();

  const delay = useCallback(() => new Promise<void>((r) => setTimeout(r, Math.max(5, 200 - speed * 2))), [speed]);

  const reset = useCallback(() => {
    stopRef.current = true;
    setTimeout(() => {
      stopRef.current = false;
      setBars(generateArray(size));
      setComparisons(0);
      setSwaps(0);
      setSorting(false);
      setDone(false);
    }, 50);
  }, [size]);

  useEffect(() => { reset(); }, [size]);

  const updateBars = (arr: BarData[]) => setBars([...arr]);

  async function bubbleSort(arr: BarData[]) {
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (stopRef.current) return;
        arr[j].state = 'comparing'; arr[j + 1].state = 'comparing';
        updateBars(arr); setComparisons((c) => c + 1); await delay();
        if (arr[j].value > arr[j + 1].value) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          arr[j].state = 'swapping'; arr[j + 1].state = 'swapping';
          updateBars(arr); setSwaps((s) => s + 1); await delay();
        }
        arr[j].state = 'default'; arr[j + 1].state = 'default';
      }
      arr[arr.length - 1 - i].state = 'sorted';
      updateBars(arr);
    }
    arr[0].state = 'sorted';
    updateBars(arr);
  }

  async function selectionSort(arr: BarData[]) {
    for (let i = 0; i < arr.length - 1; i++) {
      let minIdx = i;
      arr[i].state = 'comparing';
      for (let j = i + 1; j < arr.length; j++) {
        if (stopRef.current) return;
        arr[j].state = 'comparing';
        updateBars(arr); setComparisons((c) => c + 1); await delay();
        if (arr[j].value < arr[minIdx].value) {
          if (minIdx !== i) arr[minIdx].state = 'default';
          minIdx = j;
          arr[minIdx].state = 'pivot';
        } else { arr[j].state = 'default'; }
        updateBars(arr);
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setSwaps((s) => s + 1);
      }
      arr[i].state = 'sorted';
      if (minIdx !== i) arr[minIdx].state = 'default';
      updateBars(arr); await delay();
    }
    arr[arr.length - 1].state = 'sorted';
    updateBars(arr);
  }

  async function insertionSort(arr: BarData[]) {
    arr[0].state = 'sorted'; updateBars(arr);
    for (let i = 1; i < arr.length; i++) {
      if (stopRef.current) return;
      const key = arr[i];
      key.state = 'comparing';
      updateBars(arr); await delay();
      let j = i - 1;
      while (j >= 0 && arr[j].value > key.value) {
        if (stopRef.current) return;
        setComparisons((c) => c + 1);
        arr[j + 1] = arr[j];
        arr[j + 1].state = 'swapping';
        updateBars(arr); setSwaps((s) => s + 1); await delay();
        arr[j + 1].state = 'sorted';
        j--;
      }
      arr[j + 1] = key;
      arr[j + 1].state = 'sorted';
      updateBars(arr); await delay();
    }
  }

  async function mergeSort(arr: BarData[], l = 0, r = arr.length - 1) {
    if (l >= r || stopRef.current) return;
    const m = Math.floor((l + r) / 2);
    await mergeSort(arr, l, m);
    await mergeSort(arr, m + 1, r);
    await merge(arr, l, m, r);
  }

  async function merge(arr: BarData[], l: number, m: number, r: number) {
    const left = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      if (stopRef.current) return;
      arr[k].state = 'comparing';
      updateBars(arr); setComparisons((c) => c + 1); await delay();
      if (left[i].value <= right[j].value) { arr[k] = { ...left[i], state: 'swapping' }; i++; }
      else { arr[k] = { ...right[j], state: 'swapping' }; j++; }
      setSwaps((s) => s + 1);
      updateBars(arr); await delay();
      arr[k].state = r === arr.length - 1 && l === 0 ? 'sorted' : 'default';
      k++;
    }
    while (i < left.length) { if (stopRef.current) return; arr[k] = { ...left[i], state: 'default' }; i++; k++; updateBars(arr); await delay(); }
    while (j < right.length) { if (stopRef.current) return; arr[k] = { ...right[j], state: 'default' }; j++; k++; updateBars(arr); await delay(); }
  }

  async function quickSort(arr: BarData[], l = 0, r = arr.length - 1) {
    if (l >= r || stopRef.current) return;
    const pi = await partition(arr, l, r);
    if (pi === undefined) return;
    arr[pi].state = 'sorted'; updateBars(arr);
    await quickSort(arr, l, pi - 1);
    await quickSort(arr, pi + 1, r);
    for (let i = l; i <= r; i++) arr[i].state = 'sorted';
    updateBars(arr);
  }

  async function partition(arr: BarData[], l: number, r: number) {
    const pivotVal = arr[r].value;
    arr[r].state = 'pivot'; updateBars(arr);
    let i = l - 1;
    for (let j = l; j < r; j++) {
      if (stopRef.current) return;
      arr[j].state = 'comparing';
      updateBars(arr); setComparisons((c) => c + 1); await delay();
      if (arr[j].value < pivotVal) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        arr[i].state = 'swapping';
        setSwaps((s) => s + 1);
        updateBars(arr); await delay();
        arr[i].state = 'default';
      }
      arr[j].state = 'default';
    }
    [arr[i + 1], arr[r]] = [arr[r], arr[i + 1]];
    setSwaps((s) => s + 1);
    updateBars(arr);
    return i + 1;
  }

  async function heapSort(arr: BarData[]) {
    const n = arr.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(arr, n, i);
    for (let i = n - 1; i > 0; i--) {
      if (stopRef.current) return;
      [arr[0], arr[i]] = [arr[i], arr[0]];
      arr[0].state = 'swapping'; arr[i].state = 'swapping';
      updateBars(arr); setSwaps((s) => s + 1); await delay();
      arr[i].state = 'sorted';
      await heapify(arr, i, 0);
    }
    arr[0].state = 'sorted'; updateBars(arr);
  }

  async function heapify(arr: BarData[], n: number, i: number) {
    let largest = i; const l = 2 * i + 1; const r = 2 * i + 2;
    if (stopRef.current) return;
    if (l < n) { setComparisons((c) => c + 1); if (arr[l].value > arr[largest].value) largest = l; }
    if (r < n) { setComparisons((c) => c + 1); if (arr[r].value > arr[largest].value) largest = r; }
    if (largest !== i) {
      arr[i].state = 'comparing'; arr[largest].state = 'comparing';
      updateBars(arr); await delay();
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      arr[i].state = 'default'; arr[largest].state = 'default';
      setSwaps((s) => s + 1);
      updateBars(arr); await delay();
      await heapify(arr, n, largest);
    }
  }

  const startSort = useCallback(async () => {
    setSorting(true); setDone(false);
    setComparisons(0); setSwaps(0);
    stopRef.current = false;
    const arr = bars.map((b) => ({ ...b, state: 'default' as BarState }));
    setBars(arr);

    const sortFns: Record<SortAlgorithm, (a: BarData[]) => Promise<void>> = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort, quick: quickSort, heap: heapSort };
    await sortFns[algorithm](arr);

    if (!stopRef.current) {
      arr.forEach((b) => (b.state = 'sorted'));
      updateBars(arr);
      setDone(true);
    }
    setSorting(false);
  }, [bars, algorithm, delay]);

  const info = ALGO_INFO[algorithm];

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: 12, overflow: 'hidden', margin: '1.5rem 0', background: 'var(--sl-color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        {isMobile ? (
          <>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Sorting Algorithm Visualizer</h3>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
              {(Object.keys(ALGO_INFO) as SortAlgorithm[]).map((algo) => (
                <button key={algo} onClick={() => !sorting && setAlgorithm(algo)} disabled={sorting}
                  style={{
                    padding: '0.5rem 0.9rem', borderRadius: 6, minHeight: 44,
                    border: algorithm === algo ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                    background: algorithm === algo ? '#0066cc' : 'transparent',
                    color: algorithm === algo ? '#fff' : 'var(--sl-color-text)',
                    cursor: sorting ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {ALGO_INFO[algo].name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Sorting Algorithm Visualizer</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(Object.keys(ALGO_INFO) as SortAlgorithm[]).map((algo) => (
                <button key={algo} onClick={() => !sorting && setAlgorithm(algo)} disabled={sorting}
                  style={{
                    padding: '0.5rem 0.9rem', borderRadius: 6, minHeight: 44,
                    border: algorithm === algo ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                    background: algorithm === algo ? '#0066cc' : 'transparent',
                    color: algorithm === algo ? '#fff' : 'var(--sl-color-text)',
                    cursor: sorting ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}>
                  {ALGO_INFO[algo].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bars */}
      <div style={{ padding: '1.5rem 1.25rem', display: 'flex', alignItems: 'flex-end', gap: 2, height: 260, justifyContent: 'center' }}>
        {bars.map((bar, i) => (
          <motion.div key={i}
            layout
            style={{ flex: 1, maxWidth: 30, borderRadius: '3px 3px 0 0', background: COLORS[bar.state], minWidth: 4 }}
            animate={{ height: `${(bar.value / 100) * 200}px` }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--sl-color-gray-5)',
        background: 'var(--sl-color-gray-6)',
        ...(isMobile
          ? { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }
          : { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' as const }
        ),
      }}>
        {isMobile ? (
          <>
            {/* Row 1: Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={startSort} disabled={sorting} style={{
                flex: 1, padding: '0.65rem', borderRadius: 6, border: 'none', minHeight: 44,
                background: '#10b981', color: '#fff', cursor: sorting ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.85rem',
              }}>
                {sorting ? 'Sorting...' : 'Sort'}
              </button>
              <button onClick={reset} style={{
                flex: 1, padding: '0.65rem', borderRadius: 6, minHeight: 44,
                border: '1px solid var(--sl-color-gray-4)', background: 'transparent',
                color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem',
              }}>
                New Array
              </button>
            </div>

            {/* Row 2: Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Size</span>
                <input type="range" min={10} max={80} value={size}
                  onChange={(e) => !sorting && setSize(+e.target.value)} disabled={sorting}
                  style={{ flex: 1, height: 4 }} />
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', minWidth: 24 }}>{size}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Speed</span>
                <input type="range" min={1} max={100} value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                  style={{ flex: 1, height: 4 }} />
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', minWidth: 24 }}>{speed}</span>
              </div>
            </div>

            {/* Row 3: Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span>Comparisons: <strong>{comparisons}</strong></span>
              <span>Swaps: <strong>{swaps}</strong></span>
              {done && <span style={{ color: '#10b981', fontWeight: 700 }}>Done!</span>}
            </div>
          </>
        ) : (
          <>
            {/* Group 1: Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={startSort} disabled={sorting} style={{
                padding: '0.65rem 1.2rem', borderRadius: 6, border: 'none', minHeight: 44,
                background: '#10b981', color: '#fff', cursor: sorting ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.85rem',
              }}>
                {sorting ? 'Sorting...' : 'Sort'}
              </button>
              <button onClick={reset} style={{
                padding: '0.65rem 1rem', borderRadius: 6, minHeight: 44,
                border: '1px solid var(--sl-color-gray-4)', background: 'transparent',
                color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem',
              }}>
                New Array
              </button>
            </div>

            {/* Vertical separator */}
            <div style={{ width: 1, height: 28, background: 'var(--sl-color-gray-4)' }} />

            {/* Group 2: Sliders */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
                Size
                <input type="range" min={10} max={80} value={size}
                  onChange={(e) => !sorting && setSize(+e.target.value)} disabled={sorting}
                  style={{ width: 100 }} />
                <span style={{ minWidth: 24, fontFamily: 'monospace', fontSize: '0.8rem' }}>{size}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
                Speed
                <input type="range" min={1} max={100} value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                  style={{ width: 100 }} />
                <span style={{ minWidth: 24, fontFamily: 'monospace', fontSize: '0.8rem' }}>{speed}</span>
              </label>
            </div>

            {/* Stats pushed right */}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', marginLeft: 'auto' }}>
              <span>Comparisons: <strong>{comparisons}</strong></span>
              <span>Swaps: <strong>{swaps}</strong></span>
              {done && <span style={{ color: '#10b981', fontWeight: 700 }}>Done!</span>}
            </div>
          </>
        )}
      </div>

      {/* Complexity Info */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--sl-color-gray-5)',
        background: 'var(--sl-color-gray-6)',
        fontSize: '0.78rem',
        ...(isMobile
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }
          : { display: 'flex', gap: '1.5rem' }
        ),
      }}>
        <span>Best: <strong style={{ color: '#10b981' }}>{info.best}</strong></span>
        <span>Average: <strong style={{ color: '#f59e0b' }}>{info.avg}</strong></span>
        <span>Worst: <strong style={{ color: '#ef4444' }}>{info.worst}</strong></span>
        <span>Space: <strong>{info.space}</strong></span>
        <span>Stable: <strong>{info.stable ? 'Yes' : 'No'}</strong></span>
      </div>

      {/* Legend */}
      <div style={{
        borderTop: '1px solid var(--sl-color-gray-5)',
        fontSize: '0.75rem',
        ...(isMobile
          ? { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', padding: '0.75rem 1.25rem' }
          : { display: 'flex', gap: '1rem', padding: '0.5rem 1.25rem' }
        ),
      }}>
        {Object.entries(COLORS).map(([state, color]) => (
          <span key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: color, display: 'inline-block' }} />
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
