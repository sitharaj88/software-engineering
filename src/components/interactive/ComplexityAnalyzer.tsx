import { useState, useMemo } from 'react';

type ComplexityClass = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)' | 'O(2ⁿ)' | 'O(n!)';

const COMPLEXITIES: { label: ComplexityClass; color: string; fn: (n: number) => number; rating: string }[] = [
  { label: 'O(1)', color: '#10b981', fn: () => 1, rating: 'Excellent' },
  { label: 'O(log n)', color: '#22d3ee', fn: (n) => Math.log2(n), rating: 'Great' },
  { label: 'O(n)', color: '#3b82f6', fn: (n) => n, rating: 'Good' },
  { label: 'O(n log n)', color: '#8b5cf6', fn: (n) => n * Math.log2(n), rating: 'Fair' },
  { label: 'O(n²)', color: '#f59e0b', fn: (n) => n * n, rating: 'Poor' },
  { label: 'O(n³)', color: '#f97316', fn: (n) => n * n * n, rating: 'Bad' },
  { label: 'O(2ⁿ)', color: '#ef4444', fn: (n) => Math.pow(2, n), rating: 'Terrible' },
  { label: 'O(n!)', color: '#dc2626', fn: (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }, rating: 'Worst' },
];

const COMMON_OPS: { name: string; structure: string; complexity: string; category: string }[] = [
  { name: 'Array Access', structure: 'Array', complexity: 'O(1)', category: 'Access' },
  { name: 'Array Search', structure: 'Array', complexity: 'O(n)', category: 'Search' },
  { name: 'Array Insert (end)', structure: 'Array', complexity: 'O(1)*', category: 'Insert' },
  { name: 'Array Insert (beginning)', structure: 'Array', complexity: 'O(n)', category: 'Insert' },
  { name: 'Hash Table Lookup', structure: 'Hash Table', complexity: 'O(1)*', category: 'Search' },
  { name: 'Hash Table Insert', structure: 'Hash Table', complexity: 'O(1)*', category: 'Insert' },
  { name: 'BST Search', structure: 'BST', complexity: 'O(log n)*', category: 'Search' },
  { name: 'BST Insert', structure: 'BST', complexity: 'O(log n)*', category: 'Insert' },
  { name: 'Linked List Search', structure: 'Linked List', complexity: 'O(n)', category: 'Search' },
  { name: 'Linked List Insert (head)', structure: 'Linked List', complexity: 'O(1)', category: 'Insert' },
  { name: 'Heap Insert', structure: 'Heap', complexity: 'O(log n)', category: 'Insert' },
  { name: 'Heap Extract Min/Max', structure: 'Heap', complexity: 'O(log n)', category: 'Delete' },
  { name: 'Stack Push/Pop', structure: 'Stack', complexity: 'O(1)', category: 'Insert' },
  { name: 'Queue Enqueue/Dequeue', structure: 'Queue', complexity: 'O(1)', category: 'Insert' },
  { name: 'Quick Sort', structure: 'Sorting', complexity: 'O(n log n)*', category: 'Sort' },
  { name: 'Merge Sort', structure: 'Sorting', complexity: 'O(n log n)', category: 'Sort' },
  { name: 'Binary Search', structure: 'Search', complexity: 'O(log n)', category: 'Search' },
  { name: 'BFS/DFS', structure: 'Graph', complexity: 'O(V + E)', category: 'Search' },
];

export default function ComplexityAnalyzer() {
  const [inputSize, setInputSize] = useState(100);
  const [selected, setSelected] = useState<ComplexityClass[]>(['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)']);
  const [filterCat, setFilterCat] = useState<string>('All');

  const chartData = useMemo(() => {
    const points = [1, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000].filter((n) => n <= inputSize);
    if (!points.includes(inputSize)) points.push(inputSize);
    return points.sort((a, b) => a - b);
  }, [inputSize]);

  const maxVal = useMemo(() => {
    const selComps = COMPLEXITIES.filter((c) => selected.includes(c.label));
    let max = 0;
    for (const n of chartData) {
      for (const c of selComps) {
        const needsCap = c.label === 'O(2ⁿ)' || c.label === 'O(n!)';
        const v = c.fn(needsCap ? Math.min(n, 20) : n);
        if (v < 1e10) max = Math.max(max, v);
      }
    }
    return max || 1;
  }, [selected, chartData]);

  const toggle = (label: ComplexityClass) => {
    setSelected((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);
  };

  const operations = useMemo(() => {
    if (filterCat === 'All') return COMMON_OPS;
    return COMMON_OPS.filter((op) => op.category === filterCat);
  }, [filterCat]);

  const categories = ['All', ...new Set(COMMON_OPS.map((op) => op.category))];

  const getColor = (complexity: string) => {
    const c = COMPLEXITIES.find((cx) => cx.label === complexity);
    return c?.color || '#6b7280';
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Complexity Analyzer</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>Visualize and compare algorithm growth rates</p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Complexity toggles */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {COMPLEXITIES.map((c) => (
            <button key={c.label} onClick={() => toggle(c.label)} style={{ padding: '0.3rem 0.7rem', borderRadius: '999px', border: selected.includes(c.label) ? `2px solid ${c.color}` : '1px solid var(--sl-color-gray-4)', background: selected.includes(c.label) ? `${c.color}20` : 'transparent', color: selected.includes(c.label) ? c.color : 'var(--sl-color-gray-3)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
              {c.label} — {c.rating}
            </button>
          ))}
        </div>

        {/* Input size slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Input Size (n):</label>
          <input type="range" min={10} max={1000} value={inputSize} onChange={(e) => setInputSize(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>{inputSize}</span>
        </div>

        {/* Growth chart */}
        <div style={{ background: 'var(--sl-color-gray-7, #0d1117)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', marginBottom: '0.5rem' }}>Growth Rate Comparison</div>
          <svg viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((y) => (
              <line key={y} x1="40" y1={20 + y * 200} x2="490" y2={20 + y * 200} stroke="var(--sl-color-gray-5)" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {/* Lines */}
            {COMPLEXITIES.filter((c) => selected.includes(c.label)).map((comp) => {
              const points = chartData.map((n, i) => {
                const x = 40 + (i / (chartData.length - 1)) * 450;
                const needsCap = comp.label === 'O(2ⁿ)' || comp.label === 'O(n!)';
                const raw = comp.fn(needsCap ? Math.min(n, 20) : n);
                const clamped = Math.min(raw, maxVal);
                const y = 220 - (clamped / maxVal) * 200;
                return `${x},${Math.max(20, y)}`;
              }).join(' ');
              return <polyline key={comp.label} points={points} fill="none" stroke={comp.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
            })}
            {/* Axis labels */}
            <text x="260" y="248" textAnchor="middle" fill="var(--sl-color-gray-3)" fontSize="10">Input Size (n)</text>
            <text x="15" y="130" textAnchor="middle" fill="var(--sl-color-gray-3)" fontSize="10" transform="rotate(-90, 15, 130)">Operations</text>
          </svg>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {COMPLEXITIES.filter((c) => selected.includes(c.label)).map((c) => (
              <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                <span style={{ width: 12, height: 3, borderRadius: 2, background: c.color, display: 'inline-block' }} />
                <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Operations at input size */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Operations at n = {inputSize}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {COMPLEXITIES.filter((c) => selected.includes(c.label)).map((c) => {
              const ops = c.fn(inputSize);
              const display = ops > 1e15 ? '> 10¹⁵' : ops > 1e9 ? `${(ops / 1e9).toFixed(1)}B` : ops > 1e6 ? `${(ops / 1e6).toFixed(1)}M` : ops > 1e3 ? `${(ops / 1e3).toFixed(1)}K` : ops.toFixed(0);
              return (
                <div key={c.label} style={{ padding: '0.6rem 0.8rem', borderRadius: '0.375rem', border: `1px solid ${c.color}40`, background: `${c.color}10`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: c.color, fontWeight: 600, fontSize: '0.85rem' }}>{c.label}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>{display}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common operations reference */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Common Operations Reference</h4>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', border: filterCat === cat ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)', background: filterCat === cat ? '#0066cc' : 'transparent', color: filterCat === cat ? '#fff' : 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--sl-color-gray-5)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Operation</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Structure</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Complexity</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--sl-color-gray-5)' }}>
                    <td style={{ padding: '0.5rem' }}>{op.name}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--sl-color-gray-3)' }}>{op.structure}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: `${getColor(op.complexity)}20`, color: getColor(op.complexity) }}>
                        {op.complexity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
