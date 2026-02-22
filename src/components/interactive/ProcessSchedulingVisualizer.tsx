import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

type Algorithm = 'fcfs' | 'sjf' | 'srtf' | 'rr' | 'priority';

interface Process {
  name: string;
  arrival: number;
  burst: number;
  priority: number;
}

interface GanttBlock {
  process: string;
  start: number;
  end: number;
  color: string;
}

interface ProcessStats {
  name: string;
  arrival: number;
  burst: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
}

const ALGO_INFO: Record<Algorithm, { name: string; preemptive: boolean; description: string }> = {
  fcfs: { name: 'FCFS', preemptive: false, description: 'First Come First Served' },
  sjf: { name: 'SJF', preemptive: false, description: 'Shortest Job First' },
  srtf: { name: 'SRTF', preemptive: true, description: 'Shortest Remaining Time First' },
  rr: { name: 'Round Robin', preemptive: true, description: 'Round Robin (configurable quantum)' },
  priority: { name: 'Priority', preemptive: false, description: 'Priority (lower = higher priority)' },
};

const PROCESS_COLORS = ['#0066cc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

const EXAMPLE_PROCESSES: Process[] = [
  { name: 'P1', arrival: 0, burst: 6, priority: 2 },
  { name: 'P2', arrival: 1, burst: 4, priority: 1 },
  { name: 'P3', arrival: 2, burst: 8, priority: 3 },
  { name: 'P4', arrival: 3, burst: 3, priority: 4 },
  { name: 'P5', arrival: 5, burst: 2, priority: 5 },
];

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

function getColor(name: string, processes: Process[]): string {
  const idx = processes.findIndex((p) => p.name === name);
  return PROCESS_COLORS[idx % PROCESS_COLORS.length];
}

/* =================== Scheduling Algorithms =================== */

function scheduleFCFS(procs: Process[]): { gantt: GanttBlock[]; stats: ProcessStats[] } {
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.name.localeCompare(b.name));
  const gantt: GanttBlock[] = [];
  const stats: ProcessStats[] = [];
  let time = 0;
  const firstResponse: Record<string, number> = {};

  for (const p of sorted) {
    if (time < p.arrival) {
      gantt.push({ process: 'Idle', start: time, end: p.arrival, color: '#6b7280' });
      time = p.arrival;
    }
    firstResponse[p.name] = time;
    gantt.push({ process: p.name, start: time, end: time + p.burst, color: getColor(p.name, procs) });
    time += p.burst;
    stats.push({
      name: p.name, arrival: p.arrival, burst: p.burst,
      completion: time, turnaround: time - p.arrival,
      waiting: time - p.arrival - p.burst, response: firstResponse[p.name] - p.arrival,
    });
  }
  return { gantt, stats };
}

function scheduleSJF(procs: Process[]): { gantt: GanttBlock[]; stats: ProcessStats[] } {
  const remaining = procs.map((p) => ({ ...p }));
  const gantt: GanttBlock[] = [];
  const done: ProcessStats[] = [];
  let time = 0;
  const completed = new Set<string>();
  const firstResponse: Record<string, number> = {};

  while (completed.size < procs.length) {
    const available = remaining.filter((p) => p.arrival <= time && !completed.has(p.name));
    if (available.length === 0) {
      const next = remaining.filter((p) => !completed.has(p.name)).sort((a, b) => a.arrival - b.arrival)[0];
      gantt.push({ process: 'Idle', start: time, end: next.arrival, color: '#6b7280' });
      time = next.arrival;
      continue;
    }
    available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
    const p = available[0];
    firstResponse[p.name] = time;
    gantt.push({ process: p.name, start: time, end: time + p.burst, color: getColor(p.name, procs) });
    time += p.burst;
    completed.add(p.name);
    done.push({
      name: p.name, arrival: p.arrival, burst: p.burst,
      completion: time, turnaround: time - p.arrival,
      waiting: time - p.arrival - p.burst, response: firstResponse[p.name] - p.arrival,
    });
  }
  return { gantt, stats: done };
}

function scheduleSRTF(procs: Process[]): { gantt: GanttBlock[]; stats: ProcessStats[] } {
  const rem: Record<string, number> = {};
  procs.forEach((p) => (rem[p.name] = p.burst));
  const completion: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const gantt: GanttBlock[] = [];
  let time = 0;
  const maxTime = procs.reduce((s, p) => s + p.burst, 0) + Math.max(...procs.map((p) => p.arrival)) + 1;
  let prev = '';

  while (Object.values(rem).some((r) => r > 0) && time < maxTime) {
    const available = procs.filter((p) => p.arrival <= time && rem[p.name] > 0);
    if (available.length === 0) {
      const next = procs.filter((p) => rem[p.name] > 0).sort((a, b) => a.arrival - b.arrival)[0];
      if (!next) break;
      if (prev !== 'Idle') {
        gantt.push({ process: 'Idle', start: time, end: next.arrival, color: '#6b7280' });
      } else if (gantt.length > 0) {
        gantt[gantt.length - 1].end = next.arrival;
      }
      time = next.arrival;
      prev = 'Idle';
      continue;
    }
    available.sort((a, b) => rem[a.name] - rem[b.name] || a.arrival - b.arrival);
    const chosen = available[0];
    if (!(chosen.name in firstResponse)) firstResponse[chosen.name] = time;

    if (prev === chosen.name && gantt.length > 0) {
      gantt[gantt.length - 1].end = time + 1;
    } else {
      gantt.push({ process: chosen.name, start: time, end: time + 1, color: getColor(chosen.name, procs) });
    }
    rem[chosen.name]--;
    time++;
    prev = chosen.name;

    if (rem[chosen.name] === 0) completion[chosen.name] = time;
  }

  const stats: ProcessStats[] = procs.map((p) => ({
    name: p.name, arrival: p.arrival, burst: p.burst,
    completion: completion[p.name], turnaround: completion[p.name] - p.arrival,
    waiting: completion[p.name] - p.arrival - p.burst,
    response: (firstResponse[p.name] ?? 0) - p.arrival,
  }));
  return { gantt, stats };
}

function scheduleRR(procs: Process[], quantum: number): { gantt: GanttBlock[]; stats: ProcessStats[] } {
  const rem: Record<string, number> = {};
  procs.forEach((p) => (rem[p.name] = p.burst));
  const completion: Record<string, number> = {};
  const firstResponse: Record<string, number> = {};
  const gantt: GanttBlock[] = [];
  let time = 0;
  const queue: string[] = [];
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival);
  const added = new Set<string>();
  let idx = 0;

  // Add processes arriving at time 0
  while (idx < sorted.length && sorted[idx].arrival <= time) {
    queue.push(sorted[idx].name);
    added.add(sorted[idx].name);
    idx++;
  }

  while (queue.length > 0 || idx < sorted.length) {
    if (queue.length === 0) {
      const next = sorted[idx];
      gantt.push({ process: 'Idle', start: time, end: next.arrival, color: '#6b7280' });
      time = next.arrival;
      while (idx < sorted.length && sorted[idx].arrival <= time) {
        if (!added.has(sorted[idx].name)) {
          queue.push(sorted[idx].name);
          added.add(sorted[idx].name);
        }
        idx++;
      }
      continue;
    }

    const name = queue.shift()!;
    if (!(name in firstResponse)) firstResponse[name] = time;
    const exec = Math.min(quantum, rem[name]);
    gantt.push({ process: name, start: time, end: time + exec, color: getColor(name, procs) });
    time += exec;
    rem[name] -= exec;

    // Add newly arrived processes before re-queuing current
    while (idx < sorted.length && sorted[idx].arrival <= time) {
      if (!added.has(sorted[idx].name)) {
        queue.push(sorted[idx].name);
        added.add(sorted[idx].name);
      }
      idx++;
    }

    if (rem[name] > 0) {
      queue.push(name);
    } else {
      completion[name] = time;
    }
  }

  const stats: ProcessStats[] = procs.map((p) => ({
    name: p.name, arrival: p.arrival, burst: p.burst,
    completion: completion[p.name], turnaround: completion[p.name] - p.arrival,
    waiting: completion[p.name] - p.arrival - p.burst,
    response: (firstResponse[p.name] ?? 0) - p.arrival,
  }));
  return { gantt, stats };
}

function schedulePriority(procs: Process[]): { gantt: GanttBlock[]; stats: ProcessStats[] } {
  const remaining = procs.map((p) => ({ ...p }));
  const gantt: GanttBlock[] = [];
  const done: ProcessStats[] = [];
  let time = 0;
  const completed = new Set<string>();
  const firstResponse: Record<string, number> = {};

  while (completed.size < procs.length) {
    const available = remaining.filter((p) => p.arrival <= time && !completed.has(p.name));
    if (available.length === 0) {
      const next = remaining.filter((p) => !completed.has(p.name)).sort((a, b) => a.arrival - b.arrival)[0];
      gantt.push({ process: 'Idle', start: time, end: next.arrival, color: '#6b7280' });
      time = next.arrival;
      continue;
    }
    available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
    const p = available[0];
    firstResponse[p.name] = time;
    gantt.push({ process: p.name, start: time, end: time + p.burst, color: getColor(p.name, procs) });
    time += p.burst;
    completed.add(p.name);
    done.push({
      name: p.name, arrival: p.arrival, burst: p.burst,
      completion: time, turnaround: time - p.arrival,
      waiting: time - p.arrival - p.burst, response: firstResponse[p.name] - p.arrival,
    });
  }
  return { gantt, stats: done };
}

/* =================== Styles =================== */

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.4rem 0.5rem', borderRadius: 6, fontSize: '0.85rem',
  border: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-bg)',
  color: 'var(--sl-color-text)', textAlign: 'center', fontFamily: 'monospace',
};

const thStyle: React.CSSProperties = {
  padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontWeight: 700,
  color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.03em',
  borderBottom: '2px solid var(--sl-color-gray-5)', textAlign: 'center', whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.4rem 0.6rem', fontSize: '0.85rem', textAlign: 'center',
  borderBottom: '1px solid var(--sl-color-gray-5)', fontFamily: 'monospace',
};

/* =================== Component =================== */

export default function ProcessSchedulingVisualizer() {
  const [processes, setProcesses] = useState<Process[]>(EXAMPLE_PROCESSES);
  const [algorithm, setAlgorithm] = useState<Algorithm>('fcfs');
  const [quantum, setQuantum] = useState(2);
  const [gantt, setGantt] = useState<GanttBlock[]>([]);
  const [stats, setStats] = useState<ProcessStats[]>([]);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(50);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const isMobile = useIsMobile();
  const ganttRef = useRef<HTMLDivElement>(null);

  const nextProcessId = processes.length > 0
    ? Math.max(...processes.map((p) => parseInt(p.name.replace('P', '')) || 0)) + 1
    : 1;

  const addProcess = useCallback(() => {
    setProcesses((prev) => [...prev, { name: `P${nextProcessId}`, arrival: 0, burst: 1, priority: 1 }]);
  }, [nextProcessId]);

  const removeProcess = useCallback((idx: number) => {
    setProcesses((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateProcess = useCallback((idx: number, field: keyof Process, value: string | number) => {
    setProcesses((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: typeof value === 'string' ? value : Math.max(0, value) } : p)));
  }, []);

  const loadExample = useCallback(() => {
    setProcesses([...EXAMPLE_PROCESSES]);
    setGantt([]); setStats([]); setVisibleBlocks(0); setDone(false);
  }, []);

  const runScheduler = useCallback(() => {
    if (processes.length === 0) return;
    // Validate burst times
    if (processes.some((p) => p.burst <= 0)) return;

    let result: { gantt: GanttBlock[]; stats: ProcessStats[] };
    switch (algorithm) {
      case 'fcfs': result = scheduleFCFS(processes); break;
      case 'sjf': result = scheduleSJF(processes); break;
      case 'srtf': result = scheduleSRTF(processes); break;
      case 'rr': result = scheduleRR(processes, quantum); break;
      case 'priority': result = schedulePriority(processes); break;
    }

    setGantt(result.gantt);
    setStats(result.stats);
    setVisibleBlocks(0);
    setDone(false);
    setRunning(true);
    setPaused(false);
    stopRef.current = false;
    pauseRef.current = false;
  }, [processes, algorithm, quantum]);

  // Animation loop
  useEffect(() => {
    if (!running || gantt.length === 0) return;
    let cancelled = false;
    const interval = Math.max(80, 600 - speed * 5);

    const step = () => {
      if (cancelled || stopRef.current) return;
      if (pauseRef.current) {
        setTimeout(step, 100);
        return;
      }
      setVisibleBlocks((prev) => {
        if (prev >= gantt.length) {
          setRunning(false);
          setDone(true);
          return prev;
        }
        // Auto-scroll Gantt chart
        if (ganttRef.current) {
          ganttRef.current.scrollLeft = ganttRef.current.scrollWidth;
        }
        return prev + 1;
      });
      setTimeout(step, interval);
    };
    setTimeout(step, interval);

    return () => { cancelled = true; };
  }, [running, gantt, speed]);

  const handlePause = useCallback(() => {
    pauseRef.current = !pauseRef.current;
    setPaused(pauseRef.current);
  }, []);

  const handleReset = useCallback(() => {
    stopRef.current = true;
    setRunning(false);
    setPaused(false);
    setGantt([]);
    setStats([]);
    setVisibleBlocks(0);
    setDone(false);
  }, []);

  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
  const avgTurnaround = stats.length > 0 ? (stats.reduce((s, p) => s + p.turnaround, 0) / stats.length).toFixed(2) : '—';
  const avgWaiting = stats.length > 0 ? (stats.reduce((s, p) => s + p.waiting, 0) / stats.length).toFixed(2) : '—';

  const showPriority = algorithm === 'priority';

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: 12, overflow: 'hidden', margin: '1.5rem 0', background: 'var(--sl-color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        {isMobile ? (
          <>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>CPU Scheduling Visualizer</h3>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
              {(Object.keys(ALGO_INFO) as Algorithm[]).map((algo) => (
                <button key={algo} onClick={() => !running && setAlgorithm(algo)} disabled={running}
                  style={{
                    padding: '0.5rem 0.9rem', borderRadius: 6, minHeight: 44,
                    border: algorithm === algo ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                    background: algorithm === algo ? '#0066cc' : 'transparent',
                    color: algorithm === algo ? '#fff' : 'var(--sl-color-text)',
                    cursor: running ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {ALGO_INFO[algo].name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>CPU Scheduling Visualizer</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(Object.keys(ALGO_INFO) as Algorithm[]).map((algo) => (
                <button key={algo} onClick={() => !running && setAlgorithm(algo)} disabled={running}
                  style={{
                    padding: '0.5rem 0.9rem', borderRadius: 6, minHeight: 44,
                    border: algorithm === algo ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                    background: algorithm === algo ? '#0066cc' : 'transparent',
                    color: algorithm === algo ? '#fff' : 'var(--sl-color-text)',
                    cursor: running ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}>
                  {ALGO_INFO[algo].name}
                </button>
              ))}
            </div>
          </div>
        )}
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          {ALGO_INFO[algorithm].description}{ALGO_INFO[algorithm].preemptive ? ' (Preemptive)' : ' (Non-preemptive)'}
        </p>
      </div>

      {/* Process Table Input */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={sectionLabel}>PROCESS TABLE</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={loadExample} disabled={running}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                border: '1px solid var(--sl-color-gray-4)', background: 'transparent',
                color: 'var(--sl-color-text)', cursor: running ? 'not-allowed' : 'pointer',
              }}>
              Load Example
            </button>
            <button onClick={addProcess} disabled={running || processes.length >= 10}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                border: 'none', background: '#0066cc', color: '#fff',
                cursor: running || processes.length >= 10 ? 'not-allowed' : 'pointer',
                opacity: processes.length >= 10 ? 0.5 : 1,
              }}>
              + Add Process
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Process</th>
                <th style={thStyle}>Arrival</th>
                <th style={thStyle}>Burst</th>
                {showPriority && <th style={thStyle}>Priority</th>}
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, i) => (
                <tr key={i}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: getColor(p.name, processes), display: 'inline-block', flexShrink: 0 }} />
                      {p.name}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <input type="number" min={0} value={p.arrival} disabled={running}
                      onChange={(e) => updateProcess(i, 'arrival', parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, width: 60 }} />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" min={1} value={p.burst} disabled={running}
                      onChange={(e) => updateProcess(i, 'burst', Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ ...inputStyle, width: 60 }} />
                  </td>
                  {showPriority && (
                    <td style={tdStyle}>
                      <input type="number" min={1} value={p.priority} disabled={running}
                        onChange={(e) => updateProcess(i, 'priority', Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ ...inputStyle, width: 60 }} />
                    </td>
                  )}
                  <td style={tdStyle}>
                    <button onClick={() => removeProcess(i)} disabled={running || processes.length <= 1}
                      style={{
                        background: 'transparent', border: 'none', cursor: running || processes.length <= 1 ? 'not-allowed' : 'pointer',
                        color: '#ef4444', fontSize: '1rem', lineHeight: 1, padding: '0.2rem',
                        opacity: processes.length <= 1 ? 0.3 : 1,
                      }}>
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {algorithm === 'rr' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', whiteSpace: 'nowrap' }}>Time Quantum</span>
                <input type="number" min={1} max={20} value={quantum} disabled={running}
                  onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ ...inputStyle, width: 60 }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={runScheduler} disabled={running && !paused}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 6, border: 'none', minHeight: 44,
                  background: '#10b981', color: '#fff',
                  cursor: running && !paused ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem',
                }}>
                {running ? 'Running...' : 'Run'}
              </button>
              {running && (
                <button onClick={handlePause}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: 6, border: 'none', minHeight: 44,
                    background: paused ? '#f59e0b' : '#6b7280', color: '#fff',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                  {paused ? 'Resume' : 'Pause'}
                </button>
              )}
              <button onClick={handleReset}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 6, minHeight: 44,
                  border: '1px solid var(--sl-color-gray-4)', background: 'transparent',
                  color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem',
                }}>
                Reset
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Speed</span>
              <input type="range" min={1} max={100} value={speed}
                onChange={(e) => setSpeed(+e.target.value)} style={{ flex: 1, height: 4 }} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', minWidth: 24 }}>{speed}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={sectionLabel}>ACTIONS</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={runScheduler} disabled={running && !paused}
                  style={{
                    flex: 1, padding: '0.65rem 1.2rem', borderRadius: 6, border: 'none', minHeight: 44,
                    background: '#10b981', color: '#fff',
                    cursor: running && !paused ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                  {running ? 'Running...' : 'Run'}
                </button>
                {running && (
                  <button onClick={handlePause}
                    style={{
                      padding: '0.65rem 1rem', borderRadius: 6, border: 'none', minHeight: 44,
                      background: paused ? '#f59e0b' : '#6b7280', color: '#fff',
                      cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button onClick={handleReset}
                  style={{
                    flex: 1, padding: '0.65rem 1rem', borderRadius: 6, minHeight: 44,
                    border: '1px solid var(--sl-color-gray-4)', background: 'transparent',
                    color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem',
                  }}>
                  Reset
                </button>
              </div>
              {algorithm === 'rr' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-3)', whiteSpace: 'nowrap' }}>Time Quantum:</span>
                  <input type="number" min={1} max={20} value={quantum} disabled={running}
                    onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ ...inputStyle, width: 60 }} />
                </div>
              )}
            </div>
            <div>
              <div style={sectionLabel}>SPEED</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Slow</span>
                <input type="range" min={1} max={100} value={speed}
                  onChange={(e) => setSpeed(+e.target.value)} style={{ flex: 1, height: 4 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Fast</span>
              </div>
              {done && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
                  Scheduling complete!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gantt Chart */}
      {gantt.length > 0 && (
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)' }}>
          <div style={sectionLabel}>GANTT CHART</div>
          <div ref={ganttRef} style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 56, gap: 2, minWidth: 'max-content' }}>
              {gantt.slice(0, visibleBlocks).map((block, i) => {
                const width = Math.max(36, (block.end - block.start) * 40);
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.25 }}
                    style={{ originX: 0 }}>
                    <div style={{
                      width, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: block.color, borderRadius: 6, color: '#fff', fontWeight: 700,
                      fontSize: '0.8rem', padding: '0.25rem 0.4rem',
                      boxShadow: block.process === 'Idle' ? 'none' : '0 2px 6px rgba(0,0,0,0.15)',
                      opacity: block.process === 'Idle' ? 0.5 : 1,
                    }}>
                      {block.process}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', marginTop: 2, padding: '0 2px' }}>
                      <span>{block.start}</span>
                      <span>{block.end}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Time pointer */}
            {running && visibleBlocks > 0 && visibleBlocks <= gantt.length && (
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#0066cc' }}>
                Current Time: {gantt[visibleBlocks - 1].end} / {totalTime}
              </div>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
            {processes.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: getColor(p.name, processes), display: 'inline-block' }} />
                <span style={{ color: 'var(--sl-color-text)' }}>{p.name}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#6b7280', display: 'inline-block', opacity: 0.5 }} />
              <span style={{ color: 'var(--sl-color-gray-3)' }}>Idle</span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Table */}
      {stats.length > 0 && (done || visibleBlocks >= gantt.length) && (
        <div style={{ padding: '1.25rem' }}>
          <div style={sectionLabel}>STATISTICS</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Process</th>
                  <th style={thStyle}>Arrival</th>
                  <th style={thStyle}>Burst</th>
                  <th style={thStyle}>Completion</th>
                  <th style={thStyle}>Turnaround</th>
                  <th style={thStyle}>Waiting</th>
                  <th style={thStyle}>Response</th>
                </tr>
              </thead>
              <tbody>
                {stats.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((s) => (
                  <motion.tr key={s.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: getColor(s.name, processes), display: 'inline-block', flexShrink: 0 }} />
                        {s.name}
                      </div>
                    </td>
                    <td style={tdStyle}>{s.arrival}</td>
                    <td style={tdStyle}>{s.burst}</td>
                    <td style={tdStyle}>{s.completion}</td>
                    <td style={tdStyle}>{s.turnaround}</td>
                    <td style={tdStyle}>{s.waiting}</td>
                    <td style={tdStyle}>{s.response}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', borderBottom: 'none' }}>Averages:</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0066cc', borderBottom: 'none' }}>{avgTurnaround}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0066cc', borderBottom: 'none' }}>{avgWaiting}</td>
                  <td style={{ ...tdStyle, borderBottom: 'none' }}>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {gantt.length === 0 && (
        <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--sl-color-gray-3)' }}>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>Configure processes above and click <strong>Run</strong> to visualize the scheduling algorithm.</p>
        </div>
      )}
    </div>
  );
}
