import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Scenario = 'point-to-point' | 'pub-sub' | 'consumer-groups';

interface Message {
  id: number;
  label: string;
  color: string;
  phase: 'producing' | 'in-queue' | 'delivering' | 'delivered';
  targetConsumer: number | number[] | null;
  x: number;
  y: number;
}

interface Stats {
  produced: number;
  delivered: number;
  inQueue: number;
  throughput: number;
}

const SCENARIOS: { key: Scenario; label: string; description: string }[] = [
  { key: 'point-to-point', label: 'Point-to-Point', description: 'Each message is delivered to exactly one consumer. Messages are load-balanced across consumers.' },
  { key: 'pub-sub', label: 'Pub/Sub', description: 'Each message is delivered to ALL subscribers. Every consumer receives a copy of every message.' },
  { key: 'consumer-groups', label: 'Consumer Groups', description: 'Messages are partitioned across consumer groups. Each partition is consumed by one consumer in the group.' },
];

const MSG_COLORS = ['#0066cc', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

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

export default function MessageQueueVisualizer() {
  const isMobile = useIsMobile();
  const [scenario, setScenario] = useState<Scenario>('point-to-point');
  const [speed, setSpeed] = useState(50);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats>({ produced: 0, delivered: 0, inQueue: 0, throughput: 0 });
  const [autoProducing, setAutoProducing] = useState(false);
  const nextId = useRef(1);
  const roundRobin = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const throughputWindow = useRef<number[]>([]);

  const numConsumers = scenario === 'consumer-groups' ? 4 : 3;
  const consumerLabels = scenario === 'consumer-groups'
    ? ['G1-C1', 'G1-C2', 'G2-C1', 'G2-C2']
    : scenario === 'pub-sub'
      ? ['Sub A', 'Sub B', 'Sub C']
      : ['Consumer 1', 'Consumer 2', 'Consumer 3'];

  // Layout positions
  const producerX = isMobile ? 30 : 60;
  const queueX = isMobile ? 140 : 220;
  const consumerX = isMobile ? 250 : 400;
  const areaW = isMobile ? 300 : 480;
  const areaH = isMobile ? 200 : 220;

  const getConsumerY = (index: number) => {
    const spacing = areaH / (numConsumers + 1);
    return spacing * (index + 1);
  };
  const producerY = areaH / 2;
  const queueY = areaH / 2;

  const produceMessage = useCallback(() => {
    const id = nextId.current++;
    const color = MSG_COLORS[(id - 1) % MSG_COLORS.length];

    // Determine target based on scenario
    let targetConsumer: number | number[] | null = null;
    if (scenario === 'point-to-point') {
      targetConsumer = roundRobin.current % numConsumers;
      roundRobin.current++;
    } else if (scenario === 'pub-sub') {
      targetConsumer = Array.from({ length: numConsumers }, (_, i) => i);
    } else {
      // consumer-groups: partition by message id
      const partition = id % 2; // 2 partitions
      // Group 1 consumers (indices 0,1), Group 2 consumers (indices 2,3)
      targetConsumer = partition === 0
        ? (roundRobin.current % 2 === 0 ? 0 : 1)
        : (roundRobin.current % 2 === 0 ? 2 : 3);
      roundRobin.current++;
    }

    const msg: Message = {
      id,
      label: `M${id}`,
      color,
      phase: 'producing',
      targetConsumer,
      x: producerX,
      y: producerY,
    };

    setMessages(prev => [...prev, msg]);
    setStats(prev => ({ ...prev, produced: prev.produced + 1 }));
  }, [scenario, numConsumers, producerX, producerY]);

  // Animation loop
  useEffect(() => {
    const stepDelay = Math.max(30, 120 - speed);

    animTimerRef.current = setInterval(() => {
      setMessages(prev => {
        let delivered = 0;
        const updated = prev.map(msg => {
          const m = { ...msg };
          const moveSpeed = 3 + speed * 0.05;

          if (m.phase === 'producing') {
            // Move toward queue
            if (m.x < queueX - 10) {
              m.x += moveSpeed;
            } else {
              m.phase = 'in-queue';
              m.x = queueX;
              m.y = queueY;
            }
          } else if (m.phase === 'in-queue') {
            // Brief pause then deliver
            m.phase = 'delivering';
          } else if (m.phase === 'delivering') {
            const targets = Array.isArray(m.targetConsumer) ? m.targetConsumer : [m.targetConsumer ?? 0];
            const primaryTarget = targets[0];
            const targetY = getConsumerY(primaryTarget);

            if (m.x < consumerX - 10) {
              m.x += moveSpeed;
              // Lerp y toward target
              m.y += (targetY - m.y) * 0.1;
            } else {
              m.phase = 'delivered';
              delivered++;
            }
          }
          return m;
        });

        if (delivered > 0) {
          throughputWindow.current.push(Date.now());
          // Clean old entries (last 5 seconds)
          const now = Date.now();
          throughputWindow.current = throughputWindow.current.filter(t => now - t < 5000);

          setStats(s => ({
            ...s,
            delivered: s.delivered + delivered,
            throughput: throughputWindow.current.length,
          }));
        }

        // Remove delivered messages after animation
        const filtered = updated.filter(m => m.phase !== 'delivered');
        const inQueue = filtered.filter(m => m.phase === 'in-queue' || m.phase === 'delivering').length;
        setStats(s => ({ ...s, inQueue }));

        return filtered;
      });
    }, stepDelay);

    return () => { if (animTimerRef.current) clearInterval(animTimerRef.current); };
  }, [speed, queueX, queueY, consumerX, scenario]);

  // Auto-produce
  useEffect(() => {
    if (!autoProducing) {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      return;
    }
    const interval = Math.max(300, 2000 - speed * 18);
    autoTimerRef.current = setInterval(produceMessage, interval);
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, [autoProducing, speed, produceMessage]);

  const handleReset = useCallback(() => {
    setMessages([]);
    setStats({ produced: 0, delivered: 0, inQueue: 0, throughput: 0 });
    setAutoProducing(false);
    nextId.current = 1;
    roundRobin.current = 0;
    throughputWindow.current = [];
  }, []);

  const handleScenarioChange = (s: Scenario) => {
    handleReset();
    setScenario(s);
  };

  // For pub/sub, create visual clones for each subscriber
  const getVisualMessages = () => {
    const visual: (Message & { visualId: string; visualTarget: number })[] = [];
    for (const msg of messages) {
      if (scenario === 'pub-sub' && Array.isArray(msg.targetConsumer) && msg.phase === 'delivering') {
        for (const t of msg.targetConsumer) {
          const targetY = getConsumerY(t);
          // Each clone moves toward its own consumer
          const progress = Math.min(1, (msg.x - queueX) / (consumerX - queueX));
          const cloneY = queueY + (targetY - queueY) * progress;
          visual.push({ ...msg, visualId: `${msg.id}-${t}`, visualTarget: t, y: cloneY });
        }
      } else {
        const t = Array.isArray(msg.targetConsumer) ? msg.targetConsumer[0] : (msg.targetConsumer ?? 0);
        visual.push({ ...msg, visualId: `${msg.id}`, visualTarget: t });
      }
    }
    return visual;
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: 6,
    padding: '0.5rem 0.9rem',
    minHeight: 44,
    border: active ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-5)',
    background: active ? '#0066cc' : 'var(--sl-color-gray-6)',
    color: active ? '#fff' : 'var(--sl-color-text)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  });

  const actionBtn = (bg: string): React.CSSProperties => ({
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    border: 'none',
    background: bg,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    minHeight: 36,
  });

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Message Queue Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Explore messaging patterns: Point-to-Point, Pub/Sub, and Consumer Groups
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Scenario tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {SCENARIOS.map(s => (
            <button
              key={s.key}
              onClick={() => handleScenarioChange(s.key)}
              style={btnStyle(scenario === s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={scenario}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '6px',
              background: '#0066cc15',
              border: '1px solid #0066cc40',
              fontSize: '0.78rem',
              color: 'var(--sl-color-gray-2)',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}
          >
            {SCENARIOS.find(s => s.key === scenario)?.description}
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          <button style={actionBtn('#0066cc')} onClick={produceMessage}>
            Produce Message
          </button>
          <button
            style={actionBtn(autoProducing ? '#ef4444' : '#10b981')}
            onClick={() => setAutoProducing(p => !p)}
          >
            {autoProducing ? 'Stop Auto' : 'Auto Produce'}
          </button>
          <button style={actionBtn('var(--sl-color-gray-4)')} onClick={handleReset}>
            Reset
          </button>
          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--sl-color-gray-3)', marginLeft: 'auto' }}>
            Speed
            <input
              type="range"
              min={10}
              max={100}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              style={{ width: isMobile ? '4rem' : '6rem', accentColor: '#0066cc' }}
            />
          </label>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {[
            { label: 'Produced', value: stats.produced, color: '#0066cc' },
            { label: 'Delivered', value: stats.delivered, color: '#10b981' },
            { label: 'In Queue', value: stats.inQueue, color: '#f59e0b' },
            { label: 'Throughput', value: `${stats.throughput}/5s`, color: '#8b5cf6' },
          ].map(s => (
            <div
              key={s.label}
              style={{
                padding: '0.4rem 0.7rem',
                borderRadius: '6px',
                background: `${s.color}12`,
                border: `1px solid ${s.color}40`,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span style={{ color: 'var(--sl-color-gray-3)' }}>{s.label}:</span>
              <span style={{ fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Visualization area */}
        <div style={{
          background: 'var(--sl-color-gray-7, #0d1117)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <svg width="100%" height={areaH} viewBox={`0 0 ${areaW} ${areaH}`} style={{ display: 'block' }}>
            {/* Producer */}
            <rect
              x={producerX - 30}
              y={producerY - 25}
              width={60}
              height={50}
              rx={8}
              fill="#0066cc20"
              stroke="#0066cc"
              strokeWidth={1.5}
            />
            <text x={producerX} y={producerY + 2} textAnchor="middle" fontSize="10" fill="#0066cc" fontWeight={600}>
              Producer
            </text>

            {/* Queue/Topic */}
            <rect
              x={queueX - 35}
              y={queueY - 30}
              width={70}
              height={60}
              rx={8}
              fill="#f59e0b18"
              stroke="#f59e0b"
              strokeWidth={1.5}
            />
            <text x={queueX} y={queueY - 10} textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight={700}>
              {scenario === 'pub-sub' ? 'Topic' : scenario === 'consumer-groups' ? 'Partitions' : 'Queue'}
            </text>
            <text x={queueX} y={queueY + 6} textAnchor="middle" fontSize="14" fill="#f59e0b" fontWeight={700}>
              {stats.inQueue}
            </text>
            <text x={queueX} y={queueY + 20} textAnchor="middle" fontSize="8" fill="var(--sl-color-gray-4)">
              messages
            </text>

            {/* Consumers */}
            {consumerLabels.map((label, i) => {
              const cy = getConsumerY(i);
              const isGroup1 = scenario === 'consumer-groups' && i < 2;
              const isGroup2 = scenario === 'consumer-groups' && i >= 2;
              const borderColor = isGroup1 ? '#10b981' : isGroup2 ? '#8b5cf6' : '#10b981';
              return (
                <g key={i}>
                  {/* Connection line from queue to consumer */}
                  <line
                    x1={queueX + 35}
                    y1={queueY}
                    x2={consumerX - 30}
                    y2={cy}
                    stroke="var(--sl-color-gray-5)"
                    strokeWidth={0.5}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={consumerX - 30}
                    y={cy - 18}
                    width={60}
                    height={36}
                    rx={6}
                    fill={`${borderColor}15`}
                    stroke={borderColor}
                    strokeWidth={1.5}
                  />
                  <text x={consumerX} y={cy + 4} textAnchor="middle" fontSize="9" fill={borderColor} fontWeight={600}>
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Consumer group labels */}
            {scenario === 'consumer-groups' && (
              <>
                <rect x={consumerX - 40} y={getConsumerY(0) - 28} width={80} height={getConsumerY(1) - getConsumerY(0) + 56} rx={10} fill="none" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" />
                <text x={consumerX + 45} y={getConsumerY(0) + (getConsumerY(1) - getConsumerY(0)) / 2 + 4} fontSize="8" fill="#10b981" fontWeight={600}>Group 1</text>
                <rect x={consumerX - 40} y={getConsumerY(2) - 28} width={80} height={getConsumerY(3) - getConsumerY(2) + 56} rx={10} fill="none" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" />
                <text x={consumerX + 45} y={getConsumerY(2) + (getConsumerY(3) - getConsumerY(2)) / 2 + 4} fontSize="8" fill="#8b5cf6" fontWeight={600}>Group 2</text>
              </>
            )}

            {/* Connection line from producer to queue */}
            <line
              x1={producerX + 30}
              y1={producerY}
              x2={queueX - 35}
              y2={queueY}
              stroke="var(--sl-color-gray-5)"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />

            {/* Animated messages */}
            <AnimatePresence>
              {getVisualMessages().map(msg => (
                <motion.g
                  key={msg.visualId}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <circle
                    cx={msg.x}
                    cy={msg.y}
                    r={7}
                    fill={msg.color}
                    opacity={0.9}
                  />
                  <text
                    x={msg.x}
                    y={msg.y + 3}
                    textAnchor="middle"
                    fontSize="6"
                    fill="#fff"
                    fontWeight={700}
                  >
                    {msg.label}
                  </text>
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        </div>

        {/* Pattern explanation */}
        <div style={{
          padding: '0.75rem 0.9rem',
          borderRadius: '8px',
          background: 'var(--sl-color-gray-6)',
          border: '1px solid var(--sl-color-gray-5)',
          fontSize: '0.78rem',
          lineHeight: 1.6,
          color: 'var(--sl-color-gray-2)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '0.82rem' }}>
            How {SCENARIOS.find(s => s.key === scenario)?.label} Works
          </div>
          {scenario === 'point-to-point' && (
            <div>
              Messages are placed in a queue and delivered to exactly <strong>one</strong> consumer using round-robin or load-balancing.
              This is ideal for task distribution where each task should be processed once. Examples: job queues, order processing, task workers.
            </div>
          )}
          {scenario === 'pub-sub' && (
            <div>
              A producer publishes messages to a <strong>topic</strong>. All subscribers receive a copy of every message independently.
              This enables event-driven architectures where multiple systems react to the same events. Examples: notifications, event sourcing, real-time feeds.
            </div>
          )}
          {scenario === 'consumer-groups' && (
            <div>
              Messages are partitioned across <strong>consumer groups</strong>. Within each group, each partition is assigned to exactly one consumer.
              This combines the benefits of pub/sub (multiple groups) with point-to-point (load balancing within a group). Examples: Kafka consumer groups, competing consumers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
