import { useState, useCallback, useRef, useEffect } from 'react';

type CellType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path' | 'current';
type Algorithm = 'bfs' | 'dfs' | 'dijkstra' | 'astar';

const ROWS = 20;
const COLS = 35;
const ALGO_INFO: Record<Algorithm, { name: string; guarantees: string; weighted: boolean }> = {
  bfs: { name: 'BFS', guarantees: 'Shortest path (unweighted)', weighted: false },
  dfs: { name: 'DFS', guarantees: 'Finds a path (not necessarily shortest)', weighted: false },
  dijkstra: { name: "Dijkstra's", guarantees: 'Shortest path (weighted)', weighted: true },
  astar: { name: 'A* Search', guarantees: 'Shortest path (weighted, with heuristic)', weighted: true },
};

const CELL_COLORS: Record<CellType, string> = {
  empty: 'transparent',
  wall: '#374151',
  start: '#10b981',
  end: '#ef4444',
  visited: '#0066cc40',
  path: '#f59e0b',
  current: '#8b5cf6',
};

function createGrid(): CellType[][] {
  const grid: CellType[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
  grid[Math.floor(ROWS / 2)][5] = 'start';
  grid[Math.floor(ROWS / 2)][COLS - 6] = 'end';
  return grid;
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

export default function PathfindingVisualizer() {
  const [grid, setGrid] = useState<CellType[][]>(createGrid);
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');
  const [running, setRunning] = useState(false);
  const [drawMode, setDrawMode] = useState<'wall' | 'start' | 'end' | 'erase'>('wall');
  const [stats, setStats] = useState({ visited: 0, pathLength: 0 });
  const [done, setDone] = useState(false);
  const stopRef = useRef(false);
  const mouseDownRef = useRef(false);
  const isMobile = useIsMobile();

  const findCell = (type: CellType): [number, number] | null => {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (grid[r][c] === type) return [r, c];
    return null;
  };

  const clearPath = useCallback(() => {
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => (cell === 'visited' || cell === 'path' || cell === 'current' ? 'empty' : cell))
      )
    );
    setStats({ visited: 0, pathLength: 0 });
    setDone(false);
  }, []);

  const resetGrid = useCallback(() => {
    stopRef.current = true;
    setTimeout(() => {
      stopRef.current = false;
      setGrid(createGrid());
      setStats({ visited: 0, pathLength: 0 });
      setRunning(false);
      setDone(false);
    }, 50);
  }, []);

  const generateMaze = useCallback(() => {
    const newGrid = createGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newGrid[r][c] === 'empty' && Math.random() < 0.3) {
          newGrid[r][c] = 'wall';
        }
      }
    }
    setGrid(newGrid);
    setStats({ visited: 0, pathLength: 0 });
    setDone(false);
  }, []);

  const handleCellInteraction = useCallback((r: number, c: number) => {
    if (running) return;
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      if (drawMode === 'start') {
        const old = findCell('start');
        if (old) newGrid[old[0]][old[1]] = 'empty';
        newGrid[r][c] = 'start';
      } else if (drawMode === 'end') {
        const old = findCell('end');
        if (old) newGrid[old[0]][old[1]] = 'empty';
        newGrid[r][c] = 'end';
      } else if (drawMode === 'erase') {
        if (newGrid[r][c] !== 'start' && newGrid[r][c] !== 'end') newGrid[r][c] = 'empty';
      } else {
        if (newGrid[r][c] === 'empty') newGrid[r][c] = 'wall';
        else if (newGrid[r][c] === 'wall') newGrid[r][c] = 'empty';
      }
      return newGrid;
    });
  }, [running, drawMode, grid]);

  const delay = () => new Promise<void>((r) => setTimeout(r, 15));

  const getNeighbors = (r: number, c: number): [number, number][] => {
    const dirs: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    return dirs
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
  };

  const tracePath = async (parent: Map<string, string>, end: [number, number]) => {
    const path: [number, number][] = [];
    let key = `${end[0]},${end[1]}`;
    while (parent.has(key)) {
      const [r, c] = key.split(',').map(Number);
      path.unshift([r, c]);
      key = parent.get(key)!;
    }
    for (const [r, c] of path) {
      if (stopRef.current) return;
      setGrid((prev) => {
        const g = prev.map((row) => [...row]);
        if (g[r][c] !== 'start' && g[r][c] !== 'end') g[r][c] = 'path';
        return g;
      });
      await delay();
    }
    setStats((s) => ({ ...s, pathLength: path.length }));
  };

  const runBFS = async () => {
    const start = findCell('start');
    const end = findCell('end');
    if (!start || !end) return;
    const queue: [number, number][] = [start];
    const visited = new Set<string>([`${start[0]},${start[1]}`]);
    const parent = new Map<string, string>();
    let count = 0;

    while (queue.length > 0) {
      if (stopRef.current) return;
      const [r, c] = queue.shift()!;
      count++;
      setStats((s) => ({ ...s, visited: count }));

      if (r === end[0] && c === end[1]) {
        await tracePath(parent, end);
        return true;
      }

      setGrid((prev) => {
        const g = prev.map((row) => [...row]);
        if (g[r][c] !== 'start') g[r][c] = 'visited';
        return g;
      });
      await delay();

      for (const [nr, nc] of getNeighbors(r, c)) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && grid[nr][nc] !== 'wall') {
          visited.add(key);
          parent.set(key, `${r},${c}`);
          queue.push([nr, nc]);
        }
      }
    }
    return false;
  };

  const runDFS = async () => {
    const start = findCell('start');
    const end = findCell('end');
    if (!start || !end) return;
    const stack: [number, number][] = [start];
    const visited = new Set<string>([`${start[0]},${start[1]}`]);
    const parent = new Map<string, string>();
    let count = 0;

    while (stack.length > 0) {
      if (stopRef.current) return;
      const [r, c] = stack.pop()!;
      count++;
      setStats((s) => ({ ...s, visited: count }));

      if (r === end[0] && c === end[1]) {
        await tracePath(parent, end);
        return true;
      }

      setGrid((prev) => {
        const g = prev.map((row) => [...row]);
        if (g[r][c] !== 'start') g[r][c] = 'visited';
        return g;
      });
      await delay();

      for (const [nr, nc] of getNeighbors(r, c)) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && grid[nr][nc] !== 'wall') {
          visited.add(key);
          parent.set(key, `${r},${c}`);
          stack.push([nr, nc]);
        }
      }
    }
    return false;
  };

  const heuristic = (a: [number, number], b: [number, number]) =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

  const runAStar = async (useHeuristic: boolean) => {
    const start = findCell('start');
    const end = findCell('end');
    if (!start || !end) return;

    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const parent = new Map<string, string>();
    const openSet: [number, number][] = [start];
    const closedSet = new Set<string>();
    let count = 0;

    gScore.set(`${start[0]},${start[1]}`, 0);
    fScore.set(`${start[0]},${start[1]}`, useHeuristic ? heuristic(start, end) : 0);

    while (openSet.length > 0) {
      if (stopRef.current) return;

      openSet.sort((a, b) => (fScore.get(`${a[0]},${a[1]}`) || Infinity) - (fScore.get(`${b[0]},${b[1]}`) || Infinity));
      const [r, c] = openSet.shift()!;
      const key = `${r},${c}`;
      count++;
      setStats((s) => ({ ...s, visited: count }));

      if (r === end[0] && c === end[1]) {
        await tracePath(parent, end);
        return true;
      }

      closedSet.add(key);
      setGrid((prev) => {
        const g = prev.map((row) => [...row]);
        if (g[r][c] !== 'start') g[r][c] = 'visited';
        return g;
      });
      await delay();

      for (const [nr, nc] of getNeighbors(r, c)) {
        const nkey = `${nr},${nc}`;
        if (closedSet.has(nkey) || grid[nr][nc] === 'wall') continue;

        const tentative = (gScore.get(key) || 0) + 1;
        if (tentative < (gScore.get(nkey) || Infinity)) {
          parent.set(nkey, key);
          gScore.set(nkey, tentative);
          fScore.set(nkey, tentative + (useHeuristic ? heuristic([nr, nc], end) : 0));
          if (!openSet.find(([or, oc]) => or === nr && oc === nc)) {
            openSet.push([nr, nc]);
          }
        }
      }
    }
    return false;
  };

  const startVisualization = useCallback(async () => {
    clearPath();
    setRunning(true);
    setDone(false);
    stopRef.current = false;

    await new Promise((r) => setTimeout(r, 100));

    let found = false;
    switch (algorithm) {
      case 'bfs': found = (await runBFS()) || false; break;
      case 'dfs': found = (await runDFS()) || false; break;
      case 'dijkstra': found = (await runAStar(false)) || false; break;
      case 'astar': found = (await runAStar(true)) || false; break;
    }

    if (!stopRef.current) setDone(true);
    setRunning(false);
  }, [algorithm, grid]);

  const drawTools = [['wall', 'Wall', '#374151'], ['start', 'Start', '#10b981'], ['end', 'End', '#ef4444'], ['erase', 'Erase', '#6b7280']] as const;

  return (
    <div style={{
      border: '1px solid var(--sl-color-gray-5)',
      borderRadius: 12,
      overflow: 'hidden',
      margin: '1.5rem 0',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--sl-color-gray-5)',
        background: 'var(--sl-color-gray-6)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '0.5rem',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Pathfinding Visualizer</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>{ALGO_INFO[algorithm].guarantees}</p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            ...(isMobile ? {
              overflowX: 'auto' as const,
              width: '100%',
              WebkitOverflowScrolling: 'touch' as const,
              paddingBottom: '0.25rem',
            } : {
              flexWrap: 'wrap' as const,
            }),
          }}>
            {(Object.keys(ALGO_INFO) as Algorithm[]).map((algo) => (
              <button
                key={algo}
                onClick={() => !running && setAlgorithm(algo)}
                disabled={running}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: 6,
                  border: algorithm === algo ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                  background: algorithm === algo ? '#0066cc' : 'transparent',
                  color: algorithm === algo ? '#fff' : 'var(--sl-color-text)',
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minHeight: 44,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {ALGO_INFO[algo].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Bar */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--sl-color-gray-5)',
        background: 'var(--sl-color-gray-6)',
      }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--sl-color-gray-3)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          marginBottom: '0.4rem',
        }}>Draw Tool</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.4rem',
        }}>
          {drawTools.map(([mode, label, color]) => (
            <button
              key={mode}
              onClick={() => setDrawMode(mode)}
              style={{
                padding: '0.55rem 0.5rem',
                borderRadius: 6,
                border: drawMode === mode ? `2.5px solid ${color}` : '1px solid var(--sl-color-gray-4)',
                background: drawMode === mode ? `${color}30` : 'transparent',
                color: drawMode === mode ? color : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: drawMode === mode ? 700 : 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                minHeight: 44,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
                flexShrink: 0,
                border: mode === 'erase' ? '1.5px solid var(--sl-color-gray-3)' : 'none',
                boxSizing: 'border-box',
              }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '0.75rem', overflowX: 'auto' }}
        onMouseLeave={() => { mouseDownRef.current = false; }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1, maxWidth: 700, margin: '0 auto' }}>
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`}
                onMouseDown={() => { mouseDownRef.current = true; handleCellInteraction(r, c); }}
                onMouseUp={() => { mouseDownRef.current = false; }}
                onMouseEnter={() => { if (mouseDownRef.current) handleCellInteraction(r, c); }}
                style={{
                  aspectRatio: '1', borderRadius: 2, cursor: running ? 'default' : 'pointer',
                  background: CELL_COLORS[cell],
                  border: cell === 'empty' ? '1px solid var(--sl-color-gray-5)' : 'none',
                  transition: 'background 0.15s',
                  fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}
              >
                {cell === 'start' && '\u25B6'}
                {cell === 'end' && '\u25CE'}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--sl-color-gray-5)',
        background: 'var(--sl-color-gray-6)',
      }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Row 1: Primary Action */}
            <button
              onClick={startVisualization}
              disabled={running}
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: 8,
                border: 'none',
                background: running ? '#6b7280' : '#10b981',
                color: '#fff',
                cursor: running ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: running ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {running ? 'Running...' : 'Visualize'}
            </button>

            {/* Row 2: Secondary Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={clearPath}
                disabled={running}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 6,
                  border: '1px solid var(--sl-color-gray-4)',
                  background: 'transparent',
                  color: 'var(--sl-color-text)',
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  opacity: running ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                Clear Path
              </button>
              <button
                onClick={generateMaze}
                disabled={running}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 6,
                  border: '1px solid var(--sl-color-gray-4)',
                  background: 'transparent',
                  color: 'var(--sl-color-text)',
                  cursor: running ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  opacity: running ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                Random Maze
              </button>
              <button
                onClick={resetGrid}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 6,
                  border: '1px solid var(--sl-color-gray-4)',
                  background: 'transparent',
                  color: 'var(--sl-color-text)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                }}
              >
                Reset
              </button>
            </div>

            {/* Row 3: Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: 'var(--sl-color-gray-2)',
              alignItems: 'center',
            }}>
              <span>Visited: <strong style={{ color: 'var(--sl-color-text)' }}>{stats.visited}</strong></span>
              <span>Path: <strong style={{ color: 'var(--sl-color-text)' }}>{stats.pathLength || '\u2013'}</strong></span>
              {done && (
                <span style={{
                  color: stats.pathLength > 0 ? '#10b981' : '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 4,
                  background: stats.pathLength > 0 ? '#10b98118' : '#ef444418',
                }}>
                  {stats.pathLength > 0 ? 'Found!' : 'No Path'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '1.5rem',
            alignItems: 'start',
          }}>
            {/* Left column: ACTIONS */}
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--sl-color-gray-3)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}>Actions</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
                <button
                  onClick={startVisualization}
                  disabled={running}
                  style={{
                    padding: '0.55rem 1.4rem',
                    borderRadius: 8,
                    border: 'none',
                    background: running ? '#6b7280' : '#10b981',
                    color: '#fff',
                    cursor: running ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    boxShadow: running ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {running ? 'Running...' : 'Visualize'}
                </button>
                <button
                  onClick={clearPath}
                  disabled={running}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 6,
                    border: '1px solid var(--sl-color-gray-4)',
                    background: 'transparent',
                    color: 'var(--sl-color-text)',
                    cursor: running ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    opacity: running ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  Clear Path
                </button>
                <button
                  onClick={generateMaze}
                  disabled={running}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 6,
                    border: '1px solid var(--sl-color-gray-4)',
                    background: 'transparent',
                    color: 'var(--sl-color-text)',
                    cursor: running ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    opacity: running ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  Random Maze
                </button>
                <button
                  onClick={resetGrid}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 6,
                    border: '1px solid var(--sl-color-gray-4)',
                    background: 'transparent',
                    color: 'var(--sl-color-text)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Right column: STATISTICS */}
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--sl-color-gray-3)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}>Statistics</div>
              <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: 'var(--sl-color-gray-2)',
              }}>
                <span>Cells Visited: <strong style={{ color: 'var(--sl-color-text)' }}>{stats.visited}</strong></span>
                <span>Path Length: <strong style={{ color: 'var(--sl-color-text)' }}>{stats.pathLength || '\u2013'}</strong></span>
                {done && (
                  <span style={{
                    color: stats.pathLength > 0 ? '#10b981' : '#ef4444',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 4,
                    background: stats.pathLength > 0 ? '#10b98118' : '#ef444418',
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                  }}>
                    Status: {stats.pathLength > 0 ? 'Found!' : 'No Path'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: isMobile ? '0.75rem 1.25rem' : '0.5rem 1.25rem',
        borderTop: '1px solid var(--sl-color-gray-5)',
        display: 'flex',
        gap: isMobile ? '0.75rem' : '1rem',
        flexWrap: 'wrap' as const,
        fontSize: isMobile ? '0.75rem' : '0.72rem',
      }}>
        {Object.entries(CELL_COLORS).filter(([k]) => k !== 'current').map(([state, color]) => (
          <span key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: color || 'var(--sl-color-gray-5)',
              border: color === 'transparent' ? '1px solid var(--sl-color-gray-4)' : 'none',
              display: 'inline-block',
            }} />
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
