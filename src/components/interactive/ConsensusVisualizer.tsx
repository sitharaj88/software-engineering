import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type NodeRole = 'follower' | 'candidate' | 'leader';
type EventType = 'election' | 'vote' | 'heartbeat' | 'write' | 'replicate' | 'commit' | 'failure' | 'info';

interface NodeState {
  id: number;
  role: NodeRole;
  term: number;
  votedFor: number | null;
  log: string[];
  alive: boolean;
  voteGranted: boolean;
}

interface LogEvent {
  time: number;
  type: EventType;
  message: string;
}

interface AnimatedMessage {
  id: string;
  from: number;
  to: number;
  label: string;
  color: string;
  progress: number;
}

const ROLE_COLORS: Record<NodeRole, string> = {
  leader: '#10b981',
  candidate: '#f59e0b',
  follower: '#6b7280',
};

const ROLE_LABELS: Record<NodeRole, string> = {
  leader: 'Leader',
  candidate: 'Candidate',
  follower: 'Follower',
};

const EVENT_COLORS: Record<EventType, string> = {
  election: '#f59e0b',
  vote: '#8b5cf6',
  heartbeat: '#0066cc',
  write: '#10b981',
  replicate: '#3b82f6',
  commit: '#10b981',
  failure: '#ef4444',
  info: 'var(--sl-color-gray-3)',
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

function createInitialNodes(): NodeState[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    role: 'follower' as NodeRole,
    term: 0,
    votedFor: null,
    log: [],
    alive: true,
    voteGranted: false,
  }));
}

export default function ConsensusVisualizer() {
  const isMobile = useIsMobile();
  const [nodes, setNodes] = useState<NodeState[]>(createInitialNodes);
  const [events, setEvents] = useState<LogEvent[]>([{ time: 0, type: 'info', message: 'Cluster initialized with 5 follower nodes. Ready for leader election.' }]);
  const [messages, setMessages] = useState<AnimatedMessage[]>([]);
  const [animating, setAnimating] = useState(false);
  const [writeCount, setWriteCount] = useState(0);
  const eventCounter = useRef(1);
  const animFrameRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addEvent = useCallback((type: EventType, message: string) => {
    setEvents(prev => [...prev.slice(-49), { time: eventCounter.current++, type, message }]);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [events]);

  // Animate messages
  useEffect(() => {
    if (messages.length === 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setMessages(prev => {
        const updated = prev.map(m => ({ ...m, progress: m.progress + dt * 1.8 }));
        return updated.filter(m => m.progress < 1);
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [messages.length > 0]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const sendMessage = useCallback((from: number, to: number, label: string, color: string) => {
    const id = `${from}-${to}-${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, { id, from, to, label, color, progress: 0 }]);
  }, []);

  const getLeader = useCallback((): number | null => {
    const leader = nodes.find(n => n.role === 'leader' && n.alive);
    return leader ? leader.id : null;
  }, [nodes]);

  const startElection = useCallback(async () => {
    if (animating) return;
    setAnimating(true);

    // Pick a random alive follower to become candidate
    const followers = nodes.filter(n => n.role === 'follower' && n.alive);
    if (followers.length === 0) {
      addEvent('info', 'No followers available to start an election.');
      setAnimating(false);
      return;
    }

    // If there's already a leader, explain timeout
    const existingLeader = getLeader();
    if (existingLeader !== null) {
      addEvent('info', `Node ${existingLeader} is already the leader. Kill it first to trigger a new election.`);
      setAnimating(false);
      return;
    }

    const candidate = followers[Math.floor(Math.random() * followers.length)];
    const newTerm = candidate.term + 1;

    addEvent('election', `Node ${candidate.id} election timeout expired. Becoming candidate for term ${newTerm}.`);
    setNodes(prev => prev.map(n =>
      n.id === candidate.id ? { ...n, role: 'candidate', term: newTerm, votedFor: candidate.id, voteGranted: false } : n
    ));
    await sleep(500);

    // Request votes from all other alive nodes
    const aliveOthers = nodes.filter(n => n.id !== candidate.id && n.alive);
    addEvent('vote', `Node ${candidate.id} sends RequestVote to ${aliveOthers.length} nodes.`);
    for (const other of aliveOthers) {
      sendMessage(candidate.id, other.id, 'RequestVote', '#8b5cf6');
    }
    await sleep(800);

    // Count votes (candidate votes for itself + all alive others grant)
    let votesReceived = 1; // self-vote
    const voterIds: number[] = [candidate.id];

    for (const other of aliveOthers) {
      votesReceived++;
      voterIds.push(other.id);
      sendMessage(other.id, candidate.id, 'VoteGranted', '#10b981');
      setNodes(prev => prev.map(n =>
        n.id === other.id ? { ...n, term: newTerm, votedFor: candidate.id, voteGranted: true } : n
      ));
    }
    await sleep(800);

    const majority = Math.floor(nodes.filter(n => n.alive).length / 2) + 1;
    addEvent('vote', `Node ${candidate.id} received ${votesReceived} votes (majority needs ${majority}).`);

    if (votesReceived >= majority) {
      addEvent('election', `Node ${candidate.id} wins election! Becomes leader for term ${newTerm}.`);
      setNodes(prev => prev.map(n => {
        if (n.id === candidate.id) return { ...n, role: 'leader', term: newTerm };
        if (n.alive) return { ...n, role: 'follower', term: newTerm, voteGranted: false };
        return n;
      }));
      await sleep(400);

      // Send initial heartbeats
      addEvent('heartbeat', `Leader ${candidate.id} sends heartbeats to establish authority.`);
      for (const other of aliveOthers) {
        sendMessage(candidate.id, other.id, 'Heartbeat', '#0066cc');
      }
    } else {
      addEvent('election', `Node ${candidate.id} failed to win election. Reverting to follower.`);
      setNodes(prev => prev.map(n =>
        n.id === candidate.id ? { ...n, role: 'follower' } : n
      ));
    }

    await sleep(600);
    setAnimating(false);
  }, [animating, nodes, addEvent, sendMessage, getLeader]);

  const sendWrite = useCallback(async () => {
    if (animating) return;
    const leaderId = getLeader();
    if (leaderId === null) {
      addEvent('info', 'No leader available. Start an election first.');
      return;
    }
    setAnimating(true);
    const entry = `SET x=${writeCount + 1}`;
    setWriteCount(c => c + 1);

    addEvent('write', `Client sends write "${entry}" to leader (Node ${leaderId}).`);
    await sleep(400);

    // Leader appends to its log
    setNodes(prev => prev.map(n =>
      n.id === leaderId ? { ...n, log: [...n.log, entry] } : n
    ));
    addEvent('replicate', `Leader ${leaderId} appends "${entry}" to local log. Sending AppendEntries to followers.`);
    await sleep(300);

    // Send AppendEntries to all alive followers
    const followers = nodes.filter(n => n.id !== leaderId && n.alive);
    for (const f of followers) {
      sendMessage(leaderId, f.id, 'AppendEntries', '#3b82f6');
    }
    await sleep(800);

    // Followers acknowledge
    let acks = 1; // leader counts as one
    for (const f of followers) {
      setNodes(prev => prev.map(n =>
        n.id === f.id ? { ...n, log: [...n.log, entry] } : n
      ));
      sendMessage(f.id, leaderId, 'ACK', '#10b981');
      acks++;
    }
    await sleep(800);

    const majority = Math.floor(nodes.filter(n => n.alive).length / 2) + 1;
    if (acks >= majority) {
      addEvent('commit', `Entry "${entry}" replicated to ${acks}/${nodes.filter(n => n.alive).length} nodes. Committed (majority=${majority}).`);
    } else {
      addEvent('info', `Entry "${entry}" only replicated to ${acks} nodes. Not yet committed.`);
    }

    await sleep(400);
    setAnimating(false);
  }, [animating, nodes, getLeader, addEvent, sendMessage, writeCount]);

  const killLeader = useCallback(async () => {
    if (animating) return;
    const leaderId = getLeader();
    if (leaderId === null) {
      addEvent('info', 'No leader to kill.');
      return;
    }
    setAnimating(true);
    addEvent('failure', `Node ${leaderId} (Leader) has crashed! Cluster needs a new leader.`);
    setNodes(prev => prev.map(n =>
      n.id === leaderId ? { ...n, alive: false, role: 'follower' } : n
    ));
    await sleep(500);
    addEvent('info', 'Followers will detect missing heartbeats and start a new election.');
    setAnimating(false);
  }, [animating, getLeader, addEvent]);

  const reset = useCallback(() => {
    setNodes(createInitialNodes());
    setEvents([{ time: 0, type: 'info', message: 'Cluster reset. 5 follower nodes ready.' }]);
    setMessages([]);
    setAnimating(false);
    setWriteCount(0);
    eventCounter.current = 1;
  }, []);

  // Node positions (circular)
  const getNodePos = (index: number, total: number) => {
    const cx = isMobile ? 140 : 180;
    const cy = isMobile ? 130 : 150;
    const radius = isMobile ? 90 : 115;
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const svgW = isMobile ? 280 : 360;
  const svgH = isMobile ? 260 : 300;

  const btnStyle = (bg: string, disabled = false): React.CSSProperties => ({
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    border: 'none',
    background: disabled ? 'var(--sl-color-gray-5)' : bg,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s',
    minHeight: 36,
  });

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Raft Consensus Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Simulate leader election, log replication, and heartbeats in a Raft cluster
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <button style={btnStyle('#f59e0b', animating)} onClick={startElection} disabled={animating}>
            Start Election
          </button>
          <button style={btnStyle('#0066cc', animating)} onClick={sendWrite} disabled={animating}>
            Send Write
          </button>
          <button style={btnStyle('#ef4444', animating)} onClick={killLeader} disabled={animating}>
            Kill Leader
          </button>
          <button style={btnStyle('var(--sl-color-gray-4)', animating)} onClick={reset} disabled={animating}>
            Reset
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {(['leader', 'candidate', 'follower'] as NodeRole[]).map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: ROLE_COLORS[role] }} />
              <span style={{ fontWeight: 600 }}>{ROLE_LABELS[role]}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', opacity: 0.5 }} />
            <span style={{ fontWeight: 600 }}>Dead</span>
          </div>
        </div>

        {/* Cluster diagram */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            {/* Animated messages */}
            {messages.map(msg => {
              const from = getNodePos(msg.from, 5);
              const to = getNodePos(msg.to, 5);
              const x = from.x + (to.x - from.x) * msg.progress;
              const y = from.y + (to.y - from.y) * msg.progress;
              return (
                <g key={msg.id}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={msg.color}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    strokeDasharray="4 4"
                  />
                  <circle cx={x} cy={y} r={5} fill={msg.color} opacity={0.9}>
                    <animate attributeName="r" values="4;6;4" dur="0.6s" repeatCount="indefinite" />
                  </circle>
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize="8"
                    fill={msg.color}
                    fontWeight={600}
                  >
                    {msg.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const pos = getNodePos(i, 5);
              const color = node.alive ? ROLE_COLORS[node.role] : '#ef4444';
              const nodeRadius = isMobile ? 26 : 32;
              return (
                <g key={node.id}>
                  {/* Pulse for leader */}
                  {node.role === 'leader' && node.alive && (
                    <circle cx={pos.x} cy={pos.y} r={nodeRadius + 4} fill="none" stroke={color} strokeWidth={2} opacity={0.4}>
                      <animate attributeName="r" values={`${nodeRadius + 2};${nodeRadius + 8};${nodeRadius + 2}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeRadius}
                    fill={node.alive ? `${color}25` : `${color}15`}
                    stroke={color}
                    strokeWidth={node.role === 'leader' ? 3 : 2}
                    opacity={node.alive ? 1 : 0.4}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 6}
                    textAnchor="middle"
                    fontSize={isMobile ? '11' : '13'}
                    fontWeight={700}
                    fill={node.alive ? color : '#ef4444'}
                  >
                    N{node.id}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 8}
                    textAnchor="middle"
                    fontSize={isMobile ? '8' : '9'}
                    fill={node.alive ? color : '#ef4444'}
                  >
                    {node.alive ? ROLE_LABELS[node.role] : 'Dead'}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 19}
                    textAnchor="middle"
                    fontSize="7"
                    fill="var(--sl-color-gray-3)"
                  >
                    T{node.term} | Log:{node.log.length}
                  </text>
                </g>
              );
            })}

            {/* Center term info */}
            <text
              x={svgW / 2}
              y={svgH / 2 - 6}
              textAnchor="middle"
              fontSize="11"
              fill="var(--sl-color-gray-3)"
              fontWeight={600}
            >
              Term {Math.max(...nodes.map(n => n.term))}
            </text>
            <text
              x={svgW / 2}
              y={svgH / 2 + 10}
              textAnchor="middle"
              fontSize="9"
              fill="var(--sl-color-gray-4)"
            >
              {nodes.filter(n => n.alive).length}/5 alive
            </text>
          </svg>
        </div>

        {/* Node detail cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {nodes.map(node => {
            const color = node.alive ? ROLE_COLORS[node.role] : '#ef4444';
            return (
              <div
                key={node.id}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  border: `1.5px solid ${color}${node.alive ? '' : '66'}`,
                  background: node.alive ? `${color}12` : 'transparent',
                  opacity: node.alive ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color, marginBottom: '0.2rem' }}>
                  Node {node.id}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', lineHeight: 1.5 }}>
                  <div>Role: {node.alive ? ROLE_LABELS[node.role] : 'Dead'}</div>
                  <div>Term: {node.term}</div>
                  <div>Log: [{node.log.slice(-2).join(', ')}]</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Event log */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Event Log
          </div>
          <div
            ref={logEndRef}
            style={{
              background: 'var(--sl-color-gray-7, #0d1117)',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '8px',
              padding: '0.6rem 0.75rem',
              maxHeight: 180,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              lineHeight: 1.7,
            }}
          >
            <AnimatePresence>
              {events.map((evt, i) => (
                <motion.div
                  key={`${evt.time}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ color: EVENT_COLORS[evt.type] }}
                >
                  <span style={{ color: 'var(--sl-color-gray-4)', marginRight: '0.5rem' }}>
                    [{String(evt.time).padStart(3, '0')}]
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '0 0.3rem',
                    borderRadius: '3px',
                    background: `${EVENT_COLORS[evt.type]}20`,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    marginRight: '0.4rem',
                    textTransform: 'uppercase',
                  }}>
                    {evt.type}
                  </span>
                  {evt.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
