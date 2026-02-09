import { useState, useCallback, useRef } from 'react';

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

export default function PathfindingVisualizer() {
  const [grid, setGrid] = useState<CellType[][]>(createGrid);
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');
  const [running, setRunning] = useState(false);
  const [drawMode, setDrawMode] = useState<'wall' | 'start' | 'end' | 'erase'>('wall');
  const [stats, setStats] = useState({ visited: 0, pathLength: 0 });
  const [done, setDone] = useState(false);
  const stopRef = useRef(false);
  const mouseDownRef = useRef(false);

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

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Pathfinding Visualizer</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>{ALGO_INFO[algorithm].guarantees}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {(Object.keys(ALGO_INFO) as Algorithm[]).map((algo) => (
              <button key={algo} onClick={() => !running && setAlgorithm(algo)} disabled={running}
                style={{ padding: '0.3rem 0.7rem', borderRadius: '0.375rem', border: algorithm === algo ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)', background: algorithm === algo ? '#0066cc' : 'transparent', color: algorithm === algo ? '#fff' : 'var(--sl-color-text)', cursor: running ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                {ALGO_INFO[algo].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', marginRight: '0.25rem' }}>Draw:</span>
        {([['wall', 'Wall', '#374151'], ['start', 'Start', '#10b981'], ['end', 'End', '#ef4444'], ['erase', 'Erase', '#6b7280']] as const).map(([mode, label, color]) => (
          <button key={mode} onClick={() => setDrawMode(mode)}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: drawMode === mode ? `2px solid ${color}` : '1px solid var(--sl-color-gray-4)', background: drawMode === mode ? `${color}20` : 'transparent', color: drawMode === mode ? color : 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
            {label}
          </button>
        ))}
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
                {cell === 'start' && '▶'}
                {cell === 'end' && '◎'}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--sl-color-gray-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={startVisualization} disabled={running}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '0.375rem', border: 'none', background: '#10b981', color: '#fff', cursor: running ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            {running ? '⏳ Running...' : '▶ Visualize'}
          </button>
          <button onClick={clearPath} disabled={running}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
            Clear Path
          </button>
          <button onClick={generateMaze} disabled={running}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
            Random Maze
          </button>
          <button onClick={resetGrid}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>
            ↺ Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
          <span>Cells Visited: <strong>{stats.visited}</strong></span>
          <span>Path Length: <strong>{stats.pathLength || '–'}</strong></span>
          {done && <span style={{ color: stats.pathLength > 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{stats.pathLength > 0 ? 'Path Found!' : 'No Path'}</span>}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid var(--sl-color-gray-5)', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
        {Object.entries(CELL_COLORS).filter(([k]) => k !== 'current').map(([state, color]) => (
          <span key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: color || 'var(--sl-color-gray-5)', border: color === 'transparent' ? '1px solid var(--sl-color-gray-4)' : 'none', display: 'inline-block' }} />
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
