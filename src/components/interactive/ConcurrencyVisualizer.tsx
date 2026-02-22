import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Scenario = 'race' | 'deadlock' | 'producer-consumer' | 'philosophers';
type PhilosopherState = 'thinking' | 'hungry' | 'eating' | 'waiting';

const COLORS = {
  blue: '#0066cc',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const PHILOSOPHER_COLORS: Record<PhilosopherState, string> = {
  thinking: 'var(--sl-color-gray-4)',
  hungry: COLORS.yellow,
  eating: COLORS.green,
  waiting: COLORS.red,
};

const SCENARIOS: { key: Scenario; label: string }[] = [
  { key: 'race', label: 'Race Condition' },
  { key: 'deadlock', label: 'Deadlock' },
  { key: 'producer-consumer', label: 'Producer-Consumer' },
  { key: 'philosophers', label: 'Dining Philosophers' },
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

/* ─── Race Condition Steps ─── */
interface RaceStep {
  threadA: string;
  threadB: string;
  shared: number;
  description: string;
  highlight: 'A' | 'B' | 'both' | 'none';
  isError?: boolean;
}

function buildRaceSteps(withLock: boolean): RaceStep[] {
  if (withLock) {
    return [
      { threadA: 'Acquire lock', threadB: 'Waiting...', shared: 0, description: 'Thread A acquires the mutex lock.', highlight: 'A' },
      { threadA: 'Read value (0)', threadB: 'Waiting...', shared: 0, description: 'Thread A reads the shared counter. Thread B is blocked.', highlight: 'A' },
      { threadA: 'Increment to 1', threadB: 'Waiting...', shared: 0, description: 'Thread A computes new value: 0 + 1 = 1.', highlight: 'A' },
      { threadA: 'Write value (1)', threadB: 'Waiting...', shared: 1, description: 'Thread A writes 1 back to the shared counter.', highlight: 'A' },
      { threadA: 'Release lock', threadB: 'Acquire lock', shared: 1, description: 'Thread A releases lock. Thread B now acquires it.', highlight: 'both' },
      { threadA: 'Done', threadB: 'Read value (1)', shared: 1, description: 'Thread B reads the updated counter value of 1.', highlight: 'B' },
      { threadA: 'Done', threadB: 'Increment to 2', shared: 1, description: 'Thread B computes new value: 1 + 1 = 2.', highlight: 'B' },
      { threadA: 'Done', threadB: 'Write value (2)', shared: 2, description: 'Thread B writes 2. Final value is correct!', highlight: 'B' },
    ];
  }
  return [
    { threadA: 'Read value (0)', threadB: 'Idle', shared: 0, description: 'Thread A reads the shared counter value of 0.', highlight: 'A' },
    { threadA: 'Read value (0)', threadB: 'Read value (0)', shared: 0, description: 'Thread B also reads 0 before A writes back!', highlight: 'B', isError: true },
    { threadA: 'Increment to 1', threadB: '...', shared: 0, description: 'Thread A computes 0 + 1 = 1 locally.', highlight: 'A' },
    { threadA: 'Write value (1)', threadB: '...', shared: 1, description: 'Thread A writes 1 back to the counter.', highlight: 'A' },
    { threadA: 'Done', threadB: 'Increment to 1', shared: 1, description: 'Thread B still has stale value 0, computes 0 + 1 = 1.', highlight: 'B', isError: true },
    { threadA: 'Done', threadB: 'Write value (1)', shared: 1, description: 'Thread B overwrites with 1. One increment is lost!', highlight: 'B', isError: true },
  ];
}

/* ─── Deadlock Steps ─── */
interface DeadlockStep {
  aHolds: string | null;
  aWants: string | null;
  bHolds: string | null;
  bWants: string | null;
  description: string;
  isDeadlock: boolean;
}

function buildDeadlockSteps(resolved: boolean): DeadlockStep[] {
  if (resolved) {
    return [
      { aHolds: null, aWants: 'Lock 1', bHolds: null, bWants: null, description: 'Both threads use consistent lock ordering: always Lock 1 first, then Lock 2.', isDeadlock: false },
      { aHolds: 'Lock 1', aWants: null, bHolds: null, bWants: 'Lock 1', description: 'Thread A acquires Lock 1. Thread B waits for Lock 1.', isDeadlock: false },
      { aHolds: 'Lock 1', aWants: 'Lock 2', bHolds: null, bWants: 'Lock 1', description: 'Thread A acquires Lock 2 (available). Thread B still waits.', isDeadlock: false },
      { aHolds: 'Lock 1 + 2', aWants: null, bHolds: null, bWants: 'Lock 1', description: 'Thread A finishes and releases both locks.', isDeadlock: false },
      { aHolds: null, aWants: null, bHolds: 'Lock 1', bWants: 'Lock 2', description: 'Thread B acquires Lock 1, then Lock 2. No deadlock!', isDeadlock: false },
      { aHolds: null, aWants: null, bHolds: 'Lock 1 + 2', bWants: null, description: 'Thread B finishes. Both threads completed successfully.', isDeadlock: false },
    ];
  }
  return [
    { aHolds: null, aWants: 'Lock 1', bHolds: null, bWants: 'Lock 2', description: 'Thread A wants Lock 1. Thread B wants Lock 2. (Different ordering!)', isDeadlock: false },
    { aHolds: 'Lock 1', aWants: null, bHolds: 'Lock 2', bWants: null, description: 'Thread A acquires Lock 1. Thread B acquires Lock 2.', isDeadlock: false },
    { aHolds: 'Lock 1', aWants: 'Lock 2', bHolds: 'Lock 2', bWants: null, description: 'Thread A now needs Lock 2... but Thread B holds it.', isDeadlock: false },
    { aHolds: 'Lock 1', aWants: 'Lock 2', bHolds: 'Lock 2', bWants: 'Lock 1', description: 'Thread B now needs Lock 1... but Thread A holds it.', isDeadlock: false },
    { aHolds: 'Lock 1', aWants: 'Lock 2', bHolds: 'Lock 2', bWants: 'Lock 1', description: 'DEADLOCK! Both threads are blocked forever waiting for each other.', isDeadlock: true },
  ];
}

/* ─── Shared styles ─── */
const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--sl-color-gray-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
};

const btnBase: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  borderRadius: '6px',
  border: '1px solid var(--sl-color-gray-5)',
  background: 'var(--sl-color-bg)',
  color: 'var(--sl-color-white)',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 600,
  transition: 'all 0.15s',
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: COLORS.blue,
  color: '#fff',
  borderColor: COLORS.blue,
};

/* ─────────────────────────────────── Main Component ─────────────────────────────────── */
export default function ConcurrencyVisualizer() {
  const isMobile = useIsMobile();
  const [scenario, setScenario] = useState<Scenario>('race');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Race Condition state */
  const [raceStep, setRaceStep] = useState(0);
  const [withLock, setWithLock] = useState(false);
  const raceSteps = buildRaceSteps(withLock);

  /* Deadlock state */
  const [deadlockStep, setDeadlockStep] = useState(0);
  const [resolved, setResolved] = useState(false);
  const deadlockSteps = buildDeadlockSteps(resolved);

  /* Producer-Consumer state */
  const [buffer, setBuffer] = useState<number[]>([]);
  const [pcLog, setPcLog] = useState<string[]>([]);
  const [prodSpeed, setProdSpeed] = useState(1);
  const [consSpeed, setConsSpeed] = useState(1);
  const [pcRunning, setPcRunning] = useState(false);
  const pcRef = useRef<{ prod: ReturnType<typeof setInterval> | null; cons: ReturnType<typeof setInterval> | null }>({ prod: null, cons: null });
  const bufferMax = 5;
  const nextItemRef = useRef(1);

  /* Dining Philosophers state */
  const [philStates, setPhilStates] = useState<PhilosopherState[]>(Array(5).fill('thinking'));
  const [forks, setForks] = useState<(number | null)[]>(Array(5).fill(null));
  const [philRunning, setPhilRunning] = useState(false);
  const [philDeadlock, setPhilDeadlock] = useState(false);
  const philTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Auto-play for Race and Deadlock ─── */
  const currentStep = scenario === 'race' ? raceStep : deadlockStep;
  const maxStep = scenario === 'race' ? raceSteps.length - 1 : deadlockSteps.length - 1;

  useEffect(() => {
    if (!playing) { if (timerRef.current) clearTimeout(timerRef.current); return; }
    if (scenario !== 'race' && scenario !== 'deadlock') { setPlaying(false); return; }
    if (currentStep >= maxStep) { setPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      if (scenario === 'race') setRaceStep(s => Math.min(s + 1, raceSteps.length - 1));
      else setDeadlockStep(s => Math.min(s + 1, deadlockSteps.length - 1));
    }, 1200 / speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, currentStep, maxStep, speed, scenario, raceSteps.length, deadlockSteps.length]);

  const stepForward = useCallback(() => {
    if (scenario === 'race') setRaceStep(s => Math.min(s + 1, raceSteps.length - 1));
    else if (scenario === 'deadlock') setDeadlockStep(s => Math.min(s + 1, deadlockSteps.length - 1));
  }, [scenario, raceSteps.length, deadlockSteps.length]);

  const resetScenario = useCallback(() => {
    setPlaying(false);
    setRaceStep(0);
    setDeadlockStep(0);
    setBuffer([]);
    setPcLog([]);
    nextItemRef.current = 1;
    setPcRunning(false);
    if (pcRef.current.prod) clearInterval(pcRef.current.prod);
    if (pcRef.current.cons) clearInterval(pcRef.current.cons);
    setPhilStates(Array(5).fill('thinking'));
    setForks(Array(5).fill(null));
    setPhilRunning(false);
    setPhilDeadlock(false);
    if (philTimerRef.current) clearInterval(philTimerRef.current);
  }, []);

  /* ─── Producer-Consumer logic ─── */
  const startPC = useCallback(() => {
    setPcRunning(true);
    pcRef.current.prod = setInterval(() => {
      setBuffer(prev => {
        if (prev.length >= bufferMax) {
          setPcLog(l => [...l.slice(-9), 'Producer: buffer FULL, waiting...']);
          return prev;
        }
        const item = nextItemRef.current++;
        setPcLog(l => [...l.slice(-9), `Producer: added item ${item}`]);
        return [...prev, item];
      });
    }, 2000 / prodSpeed);
    pcRef.current.cons = setInterval(() => {
      setBuffer(prev => {
        if (prev.length === 0) {
          setPcLog(l => [...l.slice(-9), 'Consumer: buffer EMPTY, waiting...']);
          return prev;
        }
        const item = prev[0];
        setPcLog(l => [...l.slice(-9), `Consumer: removed item ${item}`]);
        return prev.slice(1);
      });
    }, 2500 / consSpeed);
  }, [prodSpeed, consSpeed]);

  const stopPC = useCallback(() => {
    setPcRunning(false);
    if (pcRef.current.prod) clearInterval(pcRef.current.prod);
    if (pcRef.current.cons) clearInterval(pcRef.current.cons);
  }, []);

  useEffect(() => () => { stopPC(); if (philTimerRef.current) clearInterval(philTimerRef.current); }, [stopPC]);

  /* Restart intervals when speed changes while running */
  useEffect(() => {
    if (!pcRunning) return;
    stopPC();
    setPcRunning(true);
    pcRef.current.prod = setInterval(() => {
      setBuffer(prev => {
        if (prev.length >= bufferMax) {
          setPcLog(l => [...l.slice(-9), 'Producer: buffer FULL, waiting...']);
          return prev;
        }
        const item = nextItemRef.current++;
        setPcLog(l => [...l.slice(-9), `Producer: added item ${item}`]);
        return [...prev, item];
      });
    }, 2000 / prodSpeed);
    pcRef.current.cons = setInterval(() => {
      setBuffer(prev => {
        if (prev.length === 0) {
          setPcLog(l => [...l.slice(-9), 'Consumer: buffer EMPTY, waiting...']);
          return prev;
        }
        const item = prev[0];
        setPcLog(l => [...l.slice(-9), `Consumer: removed item ${item}`]);
        return prev.slice(1);
      });
    }, 2500 / consSpeed);
    return () => { if (pcRef.current.prod) clearInterval(pcRef.current.prod); if (pcRef.current.cons) clearInterval(pcRef.current.cons); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodSpeed, consSpeed]);

  /* ─── Dining Philosophers logic ─── */
  const runPhilosophers = useCallback((causeDeadlock: boolean) => {
    setPhilRunning(true);
    setPhilDeadlock(false);
    setPhilStates(Array(5).fill('thinking'));
    setForks(Array(5).fill(null));
    let tick = 0;
    philTimerRef.current = setInterval(() => {
      tick++;
      if (causeDeadlock && tick === 3) {
        /* All pick up left fork simultaneously */
        setPhilStates(Array(5).fill('hungry'));
        setForks([0, 1, 2, 3, 4]);
        setTimeout(() => {
          setPhilStates(Array(5).fill('waiting'));
          setPhilDeadlock(true);
          if (philTimerRef.current) clearInterval(philTimerRef.current);
          setPhilRunning(false);
        }, 1000 / speed);
        return;
      }
      setPhilStates(prev => {
        const next = [...prev];
        setForks(prevF => {
          const nf = [...prevF];
          for (let i = 0; i < 5; i++) {
            const left = i;
            const right = (i + 1) % 5;
            if (next[i] === 'eating') {
              /* Finish eating */
              next[i] = 'thinking';
              nf[left] = null;
              nf[right] = null;
            } else if (next[i] === 'thinking' && Math.random() < 0.4) {
              next[i] = 'hungry';
            } else if (next[i] === 'hungry') {
              /* Asymmetric solution: philosopher 4 picks right first */
              const first = i === 4 ? right : left;
              const second = i === 4 ? left : right;
              if (nf[first] === null && nf[second] === null) {
                nf[first] = i;
                nf[second] = i;
                next[i] = 'eating';
              }
            }
          }
          return nf;
        });
        return next;
      });
    }, 1000 / speed);
  }, [speed]);

  const stopPhilosophers = useCallback(() => {
    if (philTimerRef.current) clearInterval(philTimerRef.current);
    setPhilRunning(false);
  }, []);

  /* ─── Render helpers ─── */
  const renderControls = () => {
    if (scenario === 'producer-consumer' || scenario === 'philosophers') return null;
    const step = scenario === 'race' ? raceStep : deadlockStep;
    const max = scenario === 'race' ? raceSteps.length - 1 : deadlockSteps.length - 1;
    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <button style={btnBase} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button style={btnBase} onClick={stepForward} disabled={step >= max}>Step</button>
        <button style={btnBase} onClick={resetScenario}>Reset</button>
        <label style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-3)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          Speed
          <input type="range" min={0.5} max={3} step={0.5} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 70 }} />
          <span style={{ fontWeight: 600 }}>{speed}x</span>
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-4)', marginLeft: 'auto' }}>
          Step {step + 1} / {max + 1}
        </span>
      </div>
    );
  };

  /* ─── Race Condition Panel ─── */
  const renderRace = () => {
    const step = raceSteps[raceStep];
    const expectedFinal = 2;
    const isLast = raceStep === raceSteps.length - 1;
    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...sectionLabel, marginBottom: 0 }}>Mode:</span>
          <button style={!withLock ? btnActive : btnBase} onClick={() => { setWithLock(false); setRaceStep(0); setPlaying(false); }}>Without Lock</button>
          <button style={withLock ? btnActive : btnBase} onClick={() => { setWithLock(true); setRaceStep(0); setPlaying(false); }}>With Lock (Mutex)</button>
        </div>
        {renderControls()}
        {/* Shared counter */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={sectionLabel}>Shared Counter</span>
          <motion.div
            key={step.shared}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            style={{
              display: 'inline-block',
              fontSize: '2rem',
              fontWeight: 800,
              color: step.isError ? COLORS.red : COLORS.blue,
              background: 'var(--sl-color-bg)',
              border: `2px solid ${step.isError ? COLORS.red : COLORS.blue}`,
              borderRadius: '10px',
              padding: '0.25rem 1.25rem',
              minWidth: 60,
            }}
          >
            {step.shared}
          </motion.div>
        </div>
        {/* Thread timelines */}
        <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobile ? 'column' : 'row', marginBottom: '1rem' }}>
          {(['A', 'B'] as const).map((t) => {
            const label = t === 'A' ? step.threadA : step.threadB;
            const active = step.highlight === t || step.highlight === 'both';
            const color = t === 'A' ? COLORS.blue : COLORS.purple;
            return (
              <div key={t} style={{ flex: 1, border: `2px solid ${active ? color : 'var(--sl-color-gray-5)'}`, borderRadius: '8px', padding: '0.75rem', background: active ? `${color}15` : 'transparent', transition: 'all 0.3s' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color, marginBottom: '0.35rem' }}>Thread {t}</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${raceStep}-${t}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: step.isError && active ? COLORS.red : 'var(--sl-color-white)' }}
                  >
                    {label}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        {/* Description */}
        <motion.div
          key={raceStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: step.isError ? `${COLORS.red}18` : `${COLORS.blue}12`,
            border: `1px solid ${step.isError ? COLORS.red : COLORS.blue}40`,
            fontSize: '0.82rem',
            color: 'var(--sl-color-white)',
            lineHeight: 1.5,
            marginBottom: '0.75rem',
          }}
        >
          {step.description}
        </motion.div>
        {/* Expected vs actual */}
        {isLast && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: `${COLORS.green}15`, border: `1px solid ${COLORS.green}`, fontSize: '0.82rem' }}>
              <strong>Expected:</strong> {expectedFinal}
            </div>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: step.shared === expectedFinal ? `${COLORS.green}15` : `${COLORS.red}15`, border: `1px solid ${step.shared === expectedFinal ? COLORS.green : COLORS.red}`, fontSize: '0.82rem' }}>
              <strong>Actual:</strong> {step.shared} {step.shared === expectedFinal ? ' -- Correct!' : ' -- WRONG! Lost update'}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── Deadlock Panel ─── */
  const renderDeadlock = () => {
    const step = deadlockSteps[deadlockStep];
    const boxStyle = (color: string, active: boolean): React.CSSProperties => ({
      width: isMobile ? 110 : 130,
      padding: '0.75rem',
      borderRadius: '10px',
      border: `2px solid ${color}`,
      background: active ? `${color}18` : 'transparent',
      textAlign: 'center',
      fontWeight: 700,
      fontSize: '0.8rem',
      transition: 'all 0.3s',
    });
    const lockStyle = (held: boolean, wanted: boolean): React.CSSProperties => ({
      width: isMobile ? 60 : 70,
      height: isMobile ? 60 : 70,
      borderRadius: '50%',
      border: `3px solid ${held ? COLORS.red : wanted ? COLORS.yellow : 'var(--sl-color-gray-5)'}`,
      background: held ? `${COLORS.red}20` : wanted ? `${COLORS.yellow}15` : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '0.72rem',
      transition: 'all 0.3s',
    });
    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...sectionLabel, marginBottom: 0 }}>Mode:</span>
          <button style={!resolved ? btnActive : btnBase} onClick={() => { setResolved(false); setDeadlockStep(0); setPlaying(false); }}>Deadlock Scenario</button>
          <button style={resolved ? btnActive : btnBase} onClick={() => { setResolved(true); setDeadlockStep(0); setPlaying(false); }}>Resolved (Lock Ordering)</button>
        </div>
        {renderControls()}
        {/* Diagram */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.75rem' : '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={boxStyle(COLORS.blue, !!step.aHolds || !!step.aWants)}>
            Thread A
            {step.aHolds && <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 4, color: COLORS.green }}>Holds: {step.aHolds}</div>}
            {step.aWants && <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 2, color: COLORS.yellow }}>Wants: {step.aWants}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <div style={lockStyle(!!(step.aHolds?.includes('1') || step.bHolds?.includes('1')), !!(step.aWants?.includes('1') || step.bWants?.includes('1')))}>
              Lock 1
            </div>
            <div style={lockStyle(!!(step.aHolds?.includes('2') || step.bHolds?.includes('2')), !!(step.aWants?.includes('2') || step.bWants?.includes('2')))}>
              Lock 2
            </div>
          </div>
          <div style={boxStyle(COLORS.purple, !!step.bHolds || !!step.bWants)}>
            Thread B
            {step.bHolds && <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 4, color: COLORS.green }}>Holds: {step.bHolds}</div>}
            {step.bWants && <div style={{ fontSize: '0.68rem', fontWeight: 400, marginTop: 2, color: COLORS.yellow }}>Wants: {step.bWants}</div>}
          </div>
        </div>
        {/* Deadlock banner */}
        <AnimatePresence>
          {step.isDeadlock && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                padding: '0.75rem',
                borderRadius: '8px',
                background: `${COLORS.red}20`,
                border: `2px solid ${COLORS.red}`,
                color: COLORS.red,
                fontWeight: 800,
                fontSize: '1.1rem',
                marginBottom: '0.75rem',
                letterSpacing: '0.04em',
              }}
            >
              DEADLOCK DETECTED
            </motion.div>
          )}
        </AnimatePresence>
        {/* Description */}
        <motion.div
          key={deadlockStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: step.isDeadlock ? `${COLORS.red}18` : `${COLORS.blue}12`,
            border: `1px solid ${step.isDeadlock ? COLORS.red : COLORS.blue}40`,
            fontSize: '0.82rem',
            color: 'var(--sl-color-white)',
            lineHeight: 1.5,
          }}
        >
          {step.description}
        </motion.div>
      </div>
    );
  };

  /* ─── Producer-Consumer Panel ─── */
  const renderProducerConsumer = () => (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {!pcRunning ? (
          <button style={btnActive} onClick={startPC}>Start</button>
        ) : (
          <button style={{ ...btnBase, borderColor: COLORS.red, color: COLORS.red }} onClick={stopPC}>Stop</button>
        )}
        <button style={btnBase} onClick={resetScenario}>Reset</button>
        <label style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          Producer
          <input type="range" min={0.5} max={3} step={0.5} value={prodSpeed} onChange={e => setProdSpeed(Number(e.target.value))} style={{ width: 60 }} />
          <span style={{ fontWeight: 600 }}>{prodSpeed}x</span>
        </label>
        <label style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          Consumer
          <input type="range" min={0.5} max={3} step={0.5} value={consSpeed} onChange={e => setConsSpeed(Number(e.target.value))} style={{ width: 60 }} />
          <span style={{ fontWeight: 600 }}>{consSpeed}x</span>
        </label>
      </div>
      {/* Buffer visualization */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <div style={sectionLabel}>Bounded Buffer (capacity {bufferMax})</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {Array.from({ length: bufferMax }).map((_, i) => {
            const item = buffer[i];
            const full = buffer.length >= bufferMax;
            const empty = buffer.length === 0;
            return (
              <motion.div
                key={i}
                layout
                style={{
                  width: isMobile ? 44 : 54,
                  height: isMobile ? 44 : 54,
                  borderRadius: '8px',
                  border: `2px solid ${item != null ? COLORS.green : full ? COLORS.red : empty ? COLORS.yellow : 'var(--sl-color-gray-5)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  background: item != null ? `${COLORS.green}18` : 'transparent',
                  transition: 'all 0.25s',
                }}
              >
                <AnimatePresence mode="wait">
                  {item != null && (
                    <motion.span
                      key={item}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      {item}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        {buffer.length >= bufferMax && (
          <div style={{ color: COLORS.red, fontWeight: 700, fontSize: '0.78rem', marginTop: '0.4rem' }}>Buffer FULL</div>
        )}
        {buffer.length === 0 && pcRunning && (
          <div style={{ color: COLORS.yellow, fontWeight: 700, fontSize: '0.78rem', marginTop: '0.4rem' }}>Buffer EMPTY</div>
        )}
      </div>
      {/* Thread labels */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS.blue }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Producer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS.pink }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Consumer</span>
        </div>
      </div>
      {/* Activity log */}
      <div style={{
        background: 'var(--sl-color-bg)',
        border: '1px solid var(--sl-color-gray-5)',
        borderRadius: '8px',
        padding: '0.6rem 0.75rem',
        maxHeight: 160,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.74rem',
        lineHeight: 1.7,
      }}>
        {pcLog.length === 0 && <span style={{ color: 'var(--sl-color-gray-4)' }}>Press Start to begin...</span>}
        {pcLog.map((msg, i) => (
          <div key={i} style={{ color: msg.startsWith('Producer') ? COLORS.blue : COLORS.pink }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Dining Philosophers Panel ─── */
  const renderPhilosophers = () => {
    const cx = isMobile ? 120 : 150;
    const cy = isMobile ? 120 : 150;
    const radius = isMobile ? 90 : 115;
    const forkRadius = isMobile ? 55 : 70;
    const philNames = ['P0', 'P1', 'P2', 'P3', 'P4'];
    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {!philRunning && !philDeadlock && (
            <button style={btnActive} onClick={() => runPhilosophers(false)}>Run (Safe)</button>
          )}
          {!philRunning && !philDeadlock && (
            <button style={{ ...btnBase, borderColor: COLORS.red, color: COLORS.red }} onClick={() => runPhilosophers(true)}>Cause Deadlock</button>
          )}
          {philRunning && (
            <button style={{ ...btnBase, borderColor: COLORS.red, color: COLORS.red }} onClick={stopPhilosophers}>Stop</button>
          )}
          <button style={btnBase} onClick={resetScenario}>Reset</button>
        </div>
        {/* Circle diagram */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <svg width={cx * 2} height={cy * 2} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
            {/* Forks */}
            {Array.from({ length: 5 }).map((_, i) => {
              const angle = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
              const fx = cx + forkRadius * Math.cos(angle);
              const fy = cy + forkRadius * Math.sin(angle);
              const held = forks[i] !== null;
              return (
                <g key={`f${i}`}>
                  <line
                    x1={fx - 7} y1={fy - 10} x2={fx + 7} y2={fy + 10}
                    stroke={held ? COLORS.red : 'var(--sl-color-gray-4)'}
                    strokeWidth={held ? 3 : 2}
                    strokeLinecap="round"
                  />
                  <text x={fx + 10} y={fy + 3} fontSize="9" fill="var(--sl-color-gray-4)" fontWeight={600}>F{i}</text>
                </g>
              );
            })}
            {/* Philosophers */}
            {philNames.map((name, i) => {
              const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              const px = cx + radius * Math.cos(angle);
              const py = cy + radius * Math.sin(angle);
              const state = philStates[i];
              const color = PHILOSOPHER_COLORS[state];
              return (
                <g key={name}>
                  <circle cx={px} cy={py} r={isMobile ? 22 : 26} fill={`${color}30`} stroke={color} strokeWidth={2.5} />
                  <text x={px} y={py - 5} textAnchor="middle" fontSize="11" fontWeight={700} fill={color}>{name}</text>
                  <text x={px} y={py + 9} textAnchor="middle" fontSize="8" fill={color}>{state}</text>
                </g>
              );
            })}
          </svg>
        </div>
        {/* Deadlock banner */}
        <AnimatePresence>
          {philDeadlock && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                padding: '0.75rem',
                borderRadius: '8px',
                background: `${COLORS.red}20`,
                border: `2px solid ${COLORS.red}`,
                color: COLORS.red,
                fontWeight: 800,
                fontSize: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              DEADLOCK! All philosophers hold left fork, wait for right.
            </motion.div>
          )}
        </AnimatePresence>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(Object.entries(PHILOSOPHER_COLORS) as [PhilosopherState, string][]).map(([state, color]) => (
            <div key={state} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ textTransform: 'capitalize' }}>{state}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── Main render ─── */
  return (
    <div style={{
      border: '1px solid var(--sl-color-gray-5)',
      borderRadius: '12px',
      padding: '1.25rem',
      fontFamily: 'var(--sl-font, system-ui, sans-serif)',
      color: 'var(--sl-color-white)',
      overflow: 'hidden',
    }}>
      {/* Title */}
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--sl-color-white)' }}>
        Concurrency Visualizer
      </h3>
      {/* Scenario tabs */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        marginBottom: '1.25rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
      }}>
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            onClick={() => { setScenario(s.key); resetScenario(); }}
            style={{
              ...(scenario === s.key ? btnActive : btnBase),
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: isMobile ? '0.72rem' : '0.8rem',
              padding: isMobile ? '0.3rem 0.55rem' : '0.35rem 0.75rem',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Active panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {scenario === 'race' && renderRace()}
          {scenario === 'deadlock' && renderDeadlock()}
          {scenario === 'producer-consumer' && renderProducerConsumer()}
          {scenario === 'philosophers' && renderPhilosophers()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
