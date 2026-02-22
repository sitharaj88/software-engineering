import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───

interface Commit {
  id: string;
  hash: string;
  message: string;
  parents: string[];
  branch: string;
  x: number;
  y: number;
}

interface Branch {
  name: string;
  color: string;
  headCommitId: string;
}

interface HistoryEntry {
  command: string;
  result: string;
  success: boolean;
}

interface GitState {
  commits: Commit[];
  branches: Branch[];
  currentBranch: string;
  nextCommitNum: number;
}

// ─── Constants ───

const COLORS = ['#0066cc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const COMMIT_R = 16;
const X_SP = 100;
const Y_SP = 60;
const PAD_L = 60;
const PAD_T = 50;

// ─── Responsive hook ───

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

// ─── Helpers ───

const genHash = () => Math.random().toString(16).substring(2, 9);

const mkCommit = (id: string, msg: string, parents: string[], branch: string): Commit => ({
  id, hash: genHash(), message: msg, parents, branch, x: 0, y: 0,
});

function getInitialState(): GitState {
  return {
    commits: [mkCommit('c0', 'Initial commit', [], 'main')],
    branches: [{ name: 'main', color: COLORS[0], headCommitId: 'c0' }],
    currentBranch: 'main',
    nextCommitNum: 1,
  };
}

function branchColor(branches: Branch[], name: string): string {
  return branches.find(b => b.name === name)?.color ?? COLORS[0];
}

function layoutCommits(commits: Commit[], branches: Branch[]): Commit[] {
  const order: Record<string, number> = {};
  branches.forEach((b, i) => { order[b.name] = i; });
  return commits.map((c, i) => ({
    ...c,
    x: PAD_L + i * X_SP,
    y: PAD_T + (order[c.branch] ?? 0) * Y_SP,
  }));
}

// ─── Styles ───

const controlBox: React.CSSProperties = {
  border: '1.5px solid var(--sl-color-gray-5)',
  borderRadius: 10,
  marginBottom: '1rem',
  background: 'var(--sl-color-gray-6)',
  padding: '1rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--sl-color-gray-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: 6,
  border: '1.5px solid var(--sl-color-gray-4)',
  background: 'var(--sl-color-bg)',
  color: 'var(--sl-color-text)',
  fontSize: '0.85rem',
  fontWeight: 500,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const btnBase: React.CSSProperties = {
  borderRadius: 6,
  fontWeight: 600,
  fontSize: '0.82rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.15s',
  padding: '0.5rem 1rem',
  minHeight: 38,
};

const btn = (bg: string): React.CSSProperties => ({
  ...btnBase,
  background: bg,
  color: '#fff',
  border: 'none',
});

const scenarioBtn: React.CSSProperties = {
  ...btnBase,
  background: 'var(--sl-color-gray-5)',
  color: 'var(--sl-color-text)',
  border: '1px solid var(--sl-color-gray-4)',
  fontSize: '0.75rem',
  padding: '0.35rem 0.75rem',
};

// ─── Component ───

export default function GitGraphVisualizer() {
  const isMobile = useIsMobile();
  const [git, setGit] = useState<GitState>(getInitialState);
  const [cmdInput, setCmdInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [switchTarget, setSwitchTarget] = useState('');
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const laid = layoutCommits(git.commits, git.branches);
  const svgW = Math.max(400, PAD_L + git.commits.length * X_SP + 80);
  const svgH = Math.max(160, PAD_T + git.branches.length * Y_SP + 40);
  const curBranch = git.branches.find(b => b.name === git.currentBranch);
  const headCommit = laid.find(c => c.id === curBranch?.headCommitId);

  const addLog = useCallback((command: string, result: string, success: boolean) => {
    setHistory(prev => [...prev, { command, result, success }]);
  }, []);

  // ─── Command execution ───

  const executeCommand = useCallback((raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    setGit(prev => {
      const s = { ...prev, commits: [...prev.commits], branches: prev.branches.map(b => ({ ...b })) };

      // git commit -m "message"
      const commitMatch = cmd.match(/^git\s+commit\s+-m\s+["'](.+?)["']$/i);
      if (commitMatch) {
        const br = s.branches.find(b => b.name === s.currentBranch);
        if (!br) { addLog(cmd, `Error: branch '${s.currentBranch}' not found`, false); return prev; }
        const id = `c${s.nextCommitNum}`;
        const nc = mkCommit(id, commitMatch[1], [br.headCommitId], s.currentBranch);
        s.commits.push(nc);
        br.headCommitId = id;
        s.nextCommitNum++;
        addLog(cmd, `Created commit ${nc.hash.slice(0, 7)} on ${s.currentBranch}`, true);
        return s;
      }

      // git branch <name>
      const branchMatch = cmd.match(/^git\s+branch\s+(\S+)$/i);
      if (branchMatch) {
        const name = branchMatch[1];
        if (s.branches.find(b => b.name === name)) {
          addLog(cmd, `Error: branch '${name}' already exists`, false);
          return prev;
        }
        const cur = s.branches.find(b => b.name === s.currentBranch);
        if (!cur) { addLog(cmd, 'Error: no current branch', false); return prev; }
        s.branches.push({
          name,
          color: COLORS[s.branches.length % COLORS.length],
          headCommitId: cur.headCommitId,
        });
        addLog(cmd, `Created branch '${name}' at ${cur.headCommitId}`, true);
        return s;
      }

      // git checkout <branch>
      const checkoutMatch = cmd.match(/^git\s+checkout\s+(\S+)$/i);
      if (checkoutMatch) {
        const target = s.branches.find(b => b.name === checkoutMatch[1]);
        if (!target) { addLog(cmd, `Error: branch '${checkoutMatch[1]}' not found`, false); return prev; }
        s.currentBranch = checkoutMatch[1];
        addLog(cmd, `Switched to branch '${checkoutMatch[1]}'`, true);
        return s;
      }

      // git merge <branch>
      const mergeMatch = cmd.match(/^git\s+merge\s+(\S+)$/i);
      if (mergeMatch) {
        const src = s.branches.find(b => b.name === mergeMatch[1]);
        const tgt = s.branches.find(b => b.name === s.currentBranch);
        if (!src) { addLog(cmd, `Error: branch '${mergeMatch[1]}' not found`, false); return prev; }
        if (!tgt) { addLog(cmd, 'Error: no current branch', false); return prev; }
        if (src.headCommitId === tgt.headCommitId) {
          addLog(cmd, 'Already up to date', true);
          return prev;
        }
        const id = `c${s.nextCommitNum}`;
        const mc = mkCommit(id, `Merge branch '${mergeMatch[1]}' into ${s.currentBranch}`,
          [tgt.headCommitId, src.headCommitId], s.currentBranch);
        s.commits.push(mc);
        tgt.headCommitId = id;
        s.nextCommitNum++;
        addLog(cmd, `Merged '${mergeMatch[1]}' into '${s.currentBranch}' (${mc.hash.slice(0, 7)})`, true);
        return s;
      }

      // git rebase <branch>
      const rebaseMatch = cmd.match(/^git\s+rebase\s+(\S+)$/i);
      if (rebaseMatch) {
        const tgtBr = s.branches.find(b => b.name === rebaseMatch[1]);
        const curBr = s.branches.find(b => b.name === s.currentBranch);
        if (!tgtBr) { addLog(cmd, `Error: branch '${rebaseMatch[1]}' not found`, false); return prev; }
        if (!curBr) { addLog(cmd, 'Error: no current branch', false); return prev; }
        if (tgtBr.headCommitId === curBr.headCommitId) {
          addLog(cmd, 'Already up to date', true);
          return prev;
        }
        const id = `c${s.nextCommitNum}`;
        const rc = mkCommit(id, `Rebased ${s.currentBranch} onto ${rebaseMatch[1]}`,
          [tgtBr.headCommitId], s.currentBranch);
        s.commits.push(rc);
        curBr.headCommitId = id;
        s.nextCommitNum++;
        addLog(cmd, `Rebased '${s.currentBranch}' onto '${rebaseMatch[1]}'`, true);
        return s;
      }

      addLog(cmd, `Unknown command: ${cmd}`, false);
      return prev;
    });
  }, [addLog]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(cmdInput);
    setCmdInput('');
    inputRef.current?.focus();
  }, [cmdInput, executeCommand]);

  // ─── Quick actions ───

  const quickCommit = useCallback(() => {
    const msgs = ['Add feature', 'Fix bug', 'Update docs', 'Refactor code', 'Add tests', 'Optimize perf'];
    executeCommand(`git commit -m "${msgs[Math.floor(Math.random() * msgs.length)]}"`);
  }, [executeCommand]);

  const quickBranch = useCallback(() => {
    const names = ['feature', 'bugfix', 'hotfix', 'release', 'develop', 'experiment'];
    const existing = new Set(git.branches.map(b => b.name));
    const name = names.find(n => !existing.has(n)) ?? `branch-${Date.now().toString(36).slice(-4)}`;
    executeCommand(`git branch ${name}`);
  }, [executeCommand, git.branches]);

  const quickMerge = useCallback(() => {
    const other = git.branches.find(b => b.name !== git.currentBranch);
    if (other) executeCommand(`git merge ${other.name}`);
  }, [executeCommand, git.branches, git.currentBranch]);

  const handleSwitchBranch = useCallback((name: string) => {
    if (name) { executeCommand(`git checkout ${name}`); setSwitchTarget(''); }
  }, [executeCommand]);

  // ─── Pre-set scenarios ───

  const loadScenario = useCallback((scenario: string) => {
    setHistory([]);
    const init = getInitialState();

    if (scenario === 'feature') {
      init.commits.push(
        mkCommit('c1', 'Add README', ['c0'], 'main'),
        mkCommit('c2', 'Setup project', ['c1'], 'main'),
        mkCommit('c3', 'Add login UI', ['c2'], 'feature'),
        mkCommit('c4', 'Add auth logic', ['c3'], 'feature'),
      );
      init.branches[0].headCommitId = 'c2';
      init.branches.push({ name: 'feature', color: COLORS[1], headCommitId: 'c4' });
      init.nextCommitNum = 5;
      setGit(init);
      addLog('scenario', 'Loaded "Feature Branch" scenario', true);
      return;
    }

    if (scenario === 'merge') {
      init.commits.push(
        mkCommit('c1', 'Add README', ['c0'], 'main'),
        mkCommit('c2', 'Add feature', ['c1'], 'feature'),
        mkCommit('c3', 'Fix main bug', ['c1'], 'main'),
        mkCommit('c4', "Merge 'feature' into main", ['c3', 'c2'], 'main'),
      );
      init.branches[0].headCommitId = 'c4';
      init.branches.push({ name: 'feature', color: COLORS[1], headCommitId: 'c2' });
      init.nextCommitNum = 5;
      setGit(init);
      addLog('scenario', 'Loaded "Merge Example" scenario', true);
      return;
    }

    if (scenario === 'multiple') {
      init.commits.push(
        mkCommit('c1', 'Setup', ['c0'], 'main'),
        mkCommit('c2', 'Feature A start', ['c1'], 'feature-a'),
        mkCommit('c3', 'Feature B start', ['c1'], 'feature-b'),
        mkCommit('c4', 'Main update', ['c1'], 'main'),
        mkCommit('c5', 'Feature A done', ['c2'], 'feature-a'),
        mkCommit('c6', 'Feature B done', ['c3'], 'feature-b'),
      );
      init.branches[0].headCommitId = 'c4';
      init.branches.push(
        { name: 'feature-a', color: COLORS[1], headCommitId: 'c5' },
        { name: 'feature-b', color: COLORS[2], headCommitId: 'c6' },
      );
      init.nextCommitNum = 7;
      setGit(init);
      addLog('scenario', 'Loaded "Multiple Branches" scenario', true);
      return;
    }
  }, [addLog]);

  const resetAll = useCallback(() => {
    setGit(getInitialState());
    setHistory([]);
    setCmdInput('');
    setSwitchTarget('');
  }, []);

  // Auto-scroll SVG container to show latest commits
  useEffect(() => {
    if (svgContainerRef.current) {
      svgContainerRef.current.scrollLeft = svgContainerRef.current.scrollWidth;
    }
  }, [git.commits.length]);

  // ─── SVG render helpers ───

  const renderEdges = () => {
    const commitMap = new Map(laid.map(c => [c.id, c]));
    const edges: React.ReactNode[] = [];

    laid.forEach(commit => {
      commit.parents.forEach((parentId, pIdx) => {
        const parent = commitMap.get(parentId);
        if (!parent) return;
        const isMergeEdge = pIdx > 0;
        const color = isMergeEdge
          ? branchColor(git.branches, parent.branch)
          : branchColor(git.branches, commit.branch);
        const key = `${parentId}-${commit.id}-${pIdx}`;

        if (parent.y === commit.y) {
          edges.push(
            <motion.line key={key} x1={parent.x} y1={parent.y} x2={commit.x} y2={commit.y}
              stroke={color} strokeWidth={2.5} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4 }} />
          );
        } else {
          const midX = (parent.x + commit.x) / 2;
          const d = `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${commit.y}, ${commit.x} ${commit.y}`;
          edges.push(
            <motion.path key={key} d={d} stroke={color} strokeWidth={2.5}
              fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4 }} />
          );
        }
      });
    });
    return edges;
  };

  const renderCommits = () => laid.map(c => {
    const color = branchColor(git.branches, c.branch);
    const isHead = c.id === headCommit?.id;
    return (
      <motion.g key={c.id}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
        {/* Commit node */}
        <circle cx={c.x} cy={c.y} r={COMMIT_R} fill={color}
          stroke={isHead ? '#fff' : 'none'} strokeWidth={isHead ? 3 : 0}
          style={{ filter: isHead ? `drop-shadow(0 0 6px ${color})` : 'none' }} />
        {/* Merge indicator — dashed outer ring */}
        {c.parents.length > 1 && (
          <circle cx={c.x} cy={c.y} r={COMMIT_R + 4} fill="none"
            stroke={color} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
        )}
        {/* Hash label below node */}
        <text x={c.x} y={c.y + COMMIT_R + 14} textAnchor="middle"
          fontSize={9} fontFamily="monospace" fill="var(--sl-color-gray-3)">
          {c.hash.slice(0, 7)}
        </text>
        {/* Native tooltip on hover */}
        <title>{`${c.hash.slice(0, 7)} — ${c.message}`}</title>
      </motion.g>
    );
  });

  const renderBranchLabels = () => git.branches.map(branch => {
    const commit = laid.find(c => c.id === branch.headCommitId);
    if (!commit) return null;
    const isActive = branch.name === git.currentBranch;
    const labelW = Math.max(56, branch.name.length * 7.5 + 16);
    return (
      <motion.g key={branch.name}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        <rect x={commit.x - 28} y={commit.y - COMMIT_R - 24}
          width={labelW} height={18} rx={9}
          fill={branch.color} opacity={isActive ? 1 : 0.7} />
        <text x={commit.x - 28 + labelW / 2} y={commit.y - COMMIT_R - 12}
          textAnchor="middle" fontSize={10} fontWeight={isActive ? 700 : 500}
          fill="#fff" fontFamily="system-ui, sans-serif">
          {branch.name}
        </text>
      </motion.g>
    );
  });

  const renderHead = () => {
    if (!headCommit) return null;
    return (
      <motion.g key="head-indicator"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <text x={headCommit.x} y={headCommit.y - COMMIT_R - 30} textAnchor="middle"
          fontSize={10} fontWeight={700} fill="var(--sl-color-text)" fontFamily="monospace">
          HEAD
        </text>
        <line x1={headCommit.x} y1={headCommit.y - COMMIT_R - 27}
          x2={headCommit.x} y2={headCommit.y - COMMIT_R - 22}
          stroke="var(--sl-color-gray-3)" strokeWidth={1.5} />
      </motion.g>
    );
  };

  // ─── Render ───

  return (
    <div style={{
      border: '1px solid var(--sl-color-gray-5)',
      borderRadius: 12,
      padding: isMobile ? '1rem' : '1.25rem',
      background: 'var(--sl-color-bg)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--sl-color-text)' }}>
          Git Graph Visualizer
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', fontFamily: 'monospace' }}>
            on <strong style={{ color: branchColor(git.branches, git.currentBranch) }}>
              {git.currentBranch}
            </strong>
          </span>
          <button onClick={resetAll} style={{
            ...btnBase, background: 'var(--sl-color-gray-5)', color: 'var(--sl-color-text)',
            border: '1px solid var(--sl-color-gray-4)', fontSize: '0.72rem',
            padding: '0.25rem 0.6rem', minHeight: 28,
          }}>
            Reset
          </button>
        </div>
      </div>

      {/* Pre-set Scenarios */}
      <div style={controlBox}>
        <div style={sectionLabel}>Scenarios</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => loadScenario('feature')} style={scenarioBtn}>Feature Branch</button>
          <button onClick={() => loadScenario('merge')} style={scenarioBtn}>Merge Example</button>
          <button onClick={() => loadScenario('multiple')} style={scenarioBtn}>Multiple Branches</button>
        </div>
      </div>

      {/* Command Input */}
      <div style={controlBox}>
        <div style={sectionLabel}>Command</div>
        <form onSubmit={handleSubmit} style={{
          display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row',
        }}>
          <input ref={inputRef} value={cmdInput} onChange={e => setCmdInput(e.target.value)}
            placeholder='git commit -m "message"'
            style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: '0.82rem' }} />
          <button type="submit" style={btn('#0066cc')}>Run</button>
        </form>
        <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: 'var(--sl-color-gray-3)', lineHeight: 1.6 }}>
          Supported: <code style={{ fontSize: '0.68rem' }}>git commit -m "msg"</code>{' | '}
          <code style={{ fontSize: '0.68rem' }}>git branch name</code>{' | '}
          <code style={{ fontSize: '0.68rem' }}>git checkout name</code>{' | '}
          <code style={{ fontSize: '0.68rem' }}>git merge name</code>{' | '}
          <code style={{ fontSize: '0.68rem' }}>git rebase name</code>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={controlBox}>
        <div style={sectionLabel}>Quick Actions</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={quickCommit} style={btn('#10b981')}>Commit</button>
          <button onClick={quickBranch} style={btn('#8b5cf6')}>New Branch</button>
          <button onClick={quickMerge} style={{
            ...btn('#f59e0b'),
            opacity: git.branches.length < 2 ? 0.5 : 1,
            pointerEvents: git.branches.length < 2 ? 'none' : 'auto',
          }}>
            Merge
          </button>
          <select value={switchTarget}
            onChange={e => { handleSwitchBranch(e.target.value); e.target.value = ''; }}
            style={{ ...inputStyle, width: 'auto', minWidth: 120, cursor: 'pointer' }}>
            <option value="">Switch Branch...</option>
            {git.branches.filter(b => b.name !== git.currentBranch).map(b =>
              <option key={b.name} value={b.name}>{b.name}</option>
            )}
          </select>
        </div>
      </div>

      {/* SVG Commit Graph */}
      <div style={controlBox}>
        <div style={sectionLabel}>Commit Graph</div>
        <div ref={svgContainerRef} style={{
          overflowX: 'auto', overflowY: 'hidden', borderRadius: 8,
          background: 'var(--sl-color-gray-7, var(--sl-color-gray-6))',
          border: '1px solid var(--sl-color-gray-5)', padding: '0.5rem',
        }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ display: 'block', minWidth: svgW }}>
            {/* Branch row labels on the left */}
            {git.branches.map((br, i) => (
              <text key={`row-${br.name}`} x={14} y={PAD_T + i * Y_SP + 4}
                fontSize={9} fill="var(--sl-color-gray-3)" fontFamily="monospace" opacity={0.5}>
                {br.name}
              </text>
            ))}
            {renderEdges()}
            <AnimatePresence>{renderCommits()}</AnimatePresence>
            {renderBranchLabels()}
            {renderHead()}
          </svg>
        </div>
      </div>

      {/* History Log */}
      <div style={controlBox}>
        <div style={sectionLabel}>History Log</div>
        <div style={{ maxHeight: 180, overflowY: 'auto', fontSize: '0.78rem',
          fontFamily: 'monospace', lineHeight: 1.8 }}>
          <AnimatePresence>
            {history.length === 0 ? (
              <div style={{ color: 'var(--sl-color-gray-3)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                No commands executed yet. Try typing a git command or use the quick actions above.
              </div>
            ) : (
              [...history].reverse().map((entry, i) => (
                <motion.div key={history.length - 1 - i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ padding: '0.2rem 0',
                    borderBottom: '1px solid var(--sl-color-gray-6, var(--sl-color-gray-5))' }}>
                  <span style={{ color: entry.success ? '#10b981' : '#ef4444', marginRight: '0.5rem' }}>
                    {entry.success ? '$' : '!'}
                  </span>
                  <span style={{ color: 'var(--sl-color-text)' }}>{entry.command}</span>
                  <span style={{ color: 'var(--sl-color-gray-3)', marginLeft: '0.75rem' }}>
                    {entry.result}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Branch Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {git.branches.map(br => (
          <div key={br.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: br.color,
              border: br.name === git.currentBranch ? '2px solid var(--sl-color-text)' : 'none',
            }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)', fontFamily: 'monospace' }}>
              {br.name}{br.name === git.currentBranch ? ' (HEAD)' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
