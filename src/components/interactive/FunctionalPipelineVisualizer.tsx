import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
type PlayState = 'idle' | 'playing' | 'paused' | 'done';

interface PipelineOp {
  type: 'map' | 'filter' | 'reduce' | 'flatMap';
  label: string;
  description: string;
  fn: (arr: any[]) => any[];
  color: string;
  icon: string;
}

interface Preset {
  name: string;
  description: string;
  input: any[];
  ops: PipelineOp[];
}

/* ─── Hook ─── */
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

/* ─── Available Operations ─── */
const AVAILABLE_OPS: PipelineOp[] = [
  { type: 'map', label: 'x * 2', description: 'Double each value', fn: (arr) => arr.map((x: number) => x * 2), color: '#3b82f6', icon: 'f(x)' },
  { type: 'map', label: 'x + 10', description: 'Add 10 to each', fn: (arr) => arr.map((x: number) => x + 10), color: '#3b82f6', icon: 'f(x)' },
  { type: 'map', label: 'x²', description: 'Square each value', fn: (arr) => arr.map((x: number) => x * x), color: '#3b82f6', icon: 'f(x)' },
  { type: 'map', label: 'toUpperCase', description: 'Uppercase strings', fn: (arr) => arr.map((x: string) => (typeof x === 'string' ? x.toUpperCase() : x)), color: '#3b82f6', icon: 'f(x)' },
  { type: 'filter', label: 'even', description: 'Keep even numbers', fn: (arr) => arr.filter((x: number) => x % 2 === 0), color: '#10b981', icon: '?' },
  { type: 'filter', label: '> 10', description: 'Keep values > 10', fn: (arr) => arr.filter((x: number) => x > 10), color: '#10b981', icon: '?' },
  { type: 'filter', label: 'odd', description: 'Keep odd numbers', fn: (arr) => arr.filter((x: number) => x % 2 !== 0), color: '#10b981', icon: '?' },
  { type: 'filter', label: 'len > 3', description: 'Keep strings longer than 3', fn: (arr) => arr.filter((x: string) => (typeof x === 'string' ? x.length > 3 : true)), color: '#10b981', icon: '?' },
  { type: 'reduce', label: 'sum', description: 'Sum all values', fn: (arr) => [arr.reduce((a: number, b: number) => a + b, 0)], color: '#f59e0b', icon: 'Σ' },
  { type: 'reduce', label: 'max', description: 'Find maximum', fn: (arr) => [arr.length ? Math.max(...arr) : 0], color: '#f59e0b', icon: 'Σ' },
  { type: 'reduce', label: 'join', description: 'Join into string', fn: (arr) => [arr.join(', ')], color: '#f59e0b', icon: 'Σ' },
  { type: 'flatMap', label: '[x, x*2]', description: 'Duplicate & double', fn: (arr) => arr.flatMap((x: number) => [x, x * 2]), color: '#8b5cf6', icon: '⊕' },
  { type: 'flatMap', label: 'split chars', description: 'Split strings to chars', fn: (arr) => arr.flatMap((x: string) => (typeof x === 'string' ? x.split('') : [x])), color: '#8b5cf6', icon: '⊕' },
];

/* ─── Presets ─── */
const PRESETS: Preset[] = [
  {
    name: 'Double & Filter Even',
    description: 'Double all numbers, then keep only even results',
    input: [1, 2, 3, 4, 5, 6, 7, 8],
    ops: [
      AVAILABLE_OPS[0], // x * 2
      AVAILABLE_OPS[4], // filter even
      AVAILABLE_OPS[8], // sum
    ],
  },
  {
    name: 'Word Count Pipeline',
    description: 'Process words: uppercase, filter long words, join',
    input: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'],
    ops: [
      AVAILABLE_OPS[3], // toUpperCase
      AVAILABLE_OPS[7], // len > 3
      AVAILABLE_OPS[10], // join
    ],
  },
  {
    name: 'Student Grade Pipeline',
    description: 'Square scores, filter passing (>10), find max',
    input: [1, 2, 3, 4, 5, 6],
    ops: [
      AVAILABLE_OPS[2], // x²
      AVAILABLE_OPS[5], // > 10
      AVAILABLE_OPS[9], // max
    ],
  },
];

/* ─── Component ─── */
export default function FunctionalPipelineVisualizer() {
  const isMobile = useIsMobile();
  const [activePreset, setActivePreset] = useState(0);
  const [pipeline, setPipeline] = useState<PipelineOp[]>(PRESETS[0].ops);
  const [inputData, setInputData] = useState<any[]>(PRESETS[0].input);
  const [currentStep, setCurrentStep] = useState(-1);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [speed, setSpeed] = useState(50);
  const [showBuilder, setShowBuilder] = useState(false);
  const animRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  // Compute intermediate results for all stages
  const stages = useCallback(() => {
    const result: { op: PipelineOp | null; data: any[]; filtered?: Map<number, boolean> }[] = [
      { op: null, data: inputData },
    ];
    let current = [...inputData];
    for (const op of pipeline) {
      if (op.type === 'filter') {
        const filtered = new Map<number, boolean>();
        current.forEach((item, idx) => {
          const passes = op.fn([item]).length > 0;
          filtered.set(idx, passes);
        });
        current = op.fn(current);
        result.push({ op, data: current, filtered });
      } else {
        current = op.fn(current);
        result.push({ op, data: current });
      }
    }
    return result;
  }, [inputData, pipeline]);

  const allStages = stages();

  const loadPreset = useCallback((idx: number) => {
    cancelRef.current = true;
    if (animRef.current) clearTimeout(animRef.current);
    setActivePreset(idx);
    setPipeline(PRESETS[idx].ops);
    setInputData(PRESETS[idx].input);
    setCurrentStep(-1);
    setPlayState('idle');
    setShowBuilder(false);
  }, []);

  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= pipeline.length) {
        setPlayState('done');
        return pipeline.length - 1;
      }
      return next;
    });
  }, [pipeline.length]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev <= 0) return -1;
      return prev - 1;
    });
    setPlayState('idle');
  }, []);

  const play = useCallback(() => {
    cancelRef.current = false;
    setPlayState('playing');
    const delay = Math.max(400, 2000 - speed * 18);

    const advance = (step: number) => {
      if (cancelRef.current) return;
      if (step >= pipeline.length) {
        setCurrentStep(pipeline.length - 1);
        setPlayState('done');
        return;
      }
      setCurrentStep(step);
      animRef.current = window.setTimeout(() => advance(step + 1), delay);
    };

    advance(currentStep < 0 ? 0 : currentStep + 1);
  }, [currentStep, pipeline.length, speed]);

  const pause = useCallback(() => {
    cancelRef.current = true;
    if (animRef.current) clearTimeout(animRef.current);
    setPlayState('paused');
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    if (animRef.current) clearTimeout(animRef.current);
    setCurrentStep(-1);
    setPlayState('idle');
  }, []);

  const addOp = useCallback((op: PipelineOp) => {
    setPipeline((prev) => [...prev, op]);
    setCurrentStep(-1);
    setPlayState('idle');
  }, []);

  const removeOp = useCallback((idx: number) => {
    setPipeline((prev) => prev.filter((_, i) => i !== idx));
    setCurrentStep(-1);
    setPlayState('idle');
  }, []);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const typeColors: Record<string, string> = {
    map: '#3b82f6',
    filter: '#10b981',
    reduce: '#f59e0b',
    flatMap: '#8b5cf6',
  };

  const formatItem = (item: any): string => {
    if (typeof item === 'string') return `"${item}"`;
    return String(item);
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Functional Pipeline Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Watch data flow through map, filter, reduce, and flatMap operations
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Preset Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => loadPreset(i)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 6,
                minHeight: 44,
                border: activePreset === i ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                background: activePreset === i ? '#0066cc' : 'transparent',
                color: activePreset === i ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 6,
              minHeight: 44,
              border: showBuilder ? '2px solid #8b5cf6' : '1px solid var(--sl-color-gray-4)',
              background: showBuilder ? '#8b5cf6' : 'transparent',
              color: showBuilder ? '#fff' : 'var(--sl-color-text)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            + Build Custom
          </button>
        </div>

        {/* Preset description */}
        <p style={{ fontSize: '0.82rem', color: 'var(--sl-color-gray-3)', margin: '0 0 1rem' }}>
          {PRESETS[activePreset].description}
        </p>

        {/* Pipeline Builder */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '1rem' }}
            >
              <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid var(--sl-color-gray-5)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Add Operations
                </div>
                {(['map', 'filter', 'reduce', 'flatMap'] as const).map((type) => (
                  <div key={type} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: typeColors[type], textTransform: 'uppercase' }}>{type}</span>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {AVAILABLE_OPS.filter((op) => op.type === type).map((op, i) => (
                        <button
                          key={`${type}-${i}`}
                          onClick={() => addOp(op)}
                          title={op.description}
                          style={{
                            height: '1.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '999px',
                            padding: '0 0.7rem',
                            border: `1px solid ${op.color}44`,
                            background: `${op.color}15`,
                            color: op.color,
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                        >
                          {op.icon} {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current pipeline */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Pipeline Chain
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--sl-color-gray-5)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
              data
            </span>
            {pipeline.map((op, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ color: 'var(--sl-color-gray-4)', fontSize: '0.9rem' }}>.</span>
                <motion.span
                  layout
                  style={{
                    background: currentStep >= i ? `${op.color}25` : 'var(--sl-color-gray-5)',
                    border: currentStep === i ? `2px solid ${op.color}` : '1px solid transparent',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: currentStep >= i ? op.color : 'var(--sl-color-text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: currentStep === i ? `0 0 8px ${op.color}44` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  .{op.type}({op.label})
                  {showBuilder && (
                    <button
                      onClick={() => removeOp(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0 0.15rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                      title="Remove operation"
                    >
                      x
                    </button>
                  )}
                </motion.span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button
            onClick={stepBackward}
            disabled={currentStep < 0 || playState === 'playing'}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 6,
              border: 'none',
              background: currentStep < 0 || playState === 'playing' ? 'var(--sl-color-gray-5)' : '#0066cc',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: currentStep < 0 || playState === 'playing' ? 'not-allowed' : 'pointer',
              opacity: currentStep < 0 || playState === 'playing' ? 0.5 : 1,
            }}
          >
            Step Back
          </button>
          {playState === 'playing' ? (
            <button
              onClick={pause}
              style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Pause
            </button>
          ) : (
            <button
              onClick={play}
              disabled={playState === 'done'}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 6,
                border: 'none',
                background: playState === 'done' ? 'var(--sl-color-gray-5)' : '#10b981',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: playState === 'done' ? 'not-allowed' : 'pointer',
                opacity: playState === 'done' ? 0.5 : 1,
              }}
            >
              {currentStep >= 0 ? 'Resume' : 'Auto Play'}
            </button>
          )}
          <button
            onClick={stepForward}
            disabled={currentStep >= pipeline.length - 1 || playState === 'playing'}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 6,
              border: 'none',
              background: currentStep >= pipeline.length - 1 || playState === 'playing' ? 'var(--sl-color-gray-5)' : '#0066cc',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: currentStep >= pipeline.length - 1 || playState === 'playing' ? 'not-allowed' : 'pointer',
              opacity: currentStep >= pipeline.length - 1 || playState === 'playing' ? 0.5 : 1,
            }}
          >
            Step Forward
          </button>
          <button
            onClick={reset}
            style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', background: 'var(--sl-color-gray-5)', color: 'var(--sl-color-text)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Reset
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sl-color-gray-3)' }}>Speed</label>
            <input
              type="range"
              min={10}
              max={100}
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              style={{ width: isMobile ? 60 : 80 }}
            />
          </div>
        </div>

        {/* Visualization Area */}
        <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid var(--sl-color-gray-5)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', overflowX: 'auto' }}>
            {allStages.map((stage, stageIdx) => {
              const isVisible = stageIdx === 0 || stageIdx <= currentStep + 1;
              const isActive = stageIdx === currentStep + 1;
              const prevStage = stageIdx > 0 ? allStages[stageIdx - 1] : null;

              return (
                <div key={stageIdx} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row' }}>
                  {/* Stage box */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: isVisible ? 1 : 0.3, scale: isVisible ? 1 : 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      minWidth: isMobile ? '100%' : 140,
                      background: isActive ? `${stage.op?.color || '#6b7280'}12` : 'var(--sl-color-gray-6)',
                      border: isActive ? `2px solid ${stage.op?.color || '#6b7280'}` : '1px solid var(--sl-color-gray-5)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      boxShadow: isActive ? `0 0 12px ${stage.op?.color || '#6b7280'}33` : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    {/* Stage header */}
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: stage.op?.color || 'var(--sl-color-gray-3)',
                      textTransform: 'uppercase',
                      marginBottom: '0.4rem',
                      textAlign: 'center',
                    }}>
                      {stageIdx === 0 ? 'Input' : `.${stage.op!.type}(${stage.op!.label})`}
                    </div>

                    {/* Data items */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center', minHeight: '2rem' }}>
                      <AnimatePresence mode="popLayout">
                        {isVisible && stage.data.map((item, itemIdx) => (
                          <motion.span
                            key={`${stageIdx}-${itemIdx}-${item}`}
                            initial={{ opacity: 0, y: -10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.25, delay: itemIdx * 0.05 }}
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              background: stage.op?.type === 'reduce' ? '#f59e0b22' : '#3b82f622',
                              color: stage.op?.type === 'reduce' ? '#f59e0b' : 'var(--sl-color-text)',
                              border: `1px solid ${stage.op?.type === 'reduce' ? '#f59e0b44' : '#3b82f644'}`,
                            }}
                          >
                            {formatItem(item)}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Filtered items indicator */}
                    {stage.filtered && isVisible && (
                      <div style={{ marginTop: '0.4rem', borderTop: '1px dashed var(--sl-color-gray-5)', paddingTop: '0.3rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.2rem', textAlign: 'center' }}>
                          Filtered out:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', justifyContent: 'center' }}>
                          {prevStage && prevStage.data.map((item, idx) => {
                            if (stage.filtered!.get(idx)) return null;
                            return (
                              <motion.span
                                key={`filtered-${idx}`}
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0.5 }}
                                style={{
                                  display: 'inline-block',
                                  padding: '0.15rem 0.35rem',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontFamily: 'monospace',
                                  background: '#ef444422',
                                  color: '#ef4444',
                                  textDecoration: 'line-through',
                                }}
                              >
                                {formatItem(item)}
                              </motion.span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Count */}
                    <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', textAlign: 'center', marginTop: '0.3rem' }}>
                      {isVisible ? `${stage.data.length} item${stage.data.length !== 1 ? 's' : ''}` : '...'}
                    </div>
                  </motion.div>

                  {/* Arrow between stages */}
                  {stageIdx < allStages.length - 1 && (
                    <div style={{
                      color: 'var(--sl-color-gray-4)',
                      fontSize: '1.2rem',
                      transform: isMobile ? 'rotate(90deg)' : 'none',
                      flexShrink: 0,
                      textAlign: 'center',
                      width: isMobile ? '100%' : 'auto',
                    }}>
                      {isVisible && isActive ? (
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          {'\u2192'}
                        </motion.span>
                      ) : (
                        '\u2192'
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step explanation */}
        <AnimatePresence mode="wait">
          {currentStep >= 0 && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: `${pipeline[currentStep]?.color || '#6b7280'}12`,
                border: `1px solid ${pipeline[currentStep]?.color || '#6b7280'}44`,
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: pipeline[currentStep]?.color || 'var(--sl-color-text)', marginBottom: '0.25rem' }}>
                Step {currentStep + 1}: .{pipeline[currentStep]?.type}({pipeline[currentStep]?.label})
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-2)' }}>
                {pipeline[currentStep]?.description}.{' '}
                {allStages[currentStep + 1] && (
                  <span>
                    {allStages[currentStep].data.length} items {'\u2192'} {allStages[currentStep + 1].data.length} items
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)', fontFamily: 'monospace', marginTop: '0.3rem' }}>
                [{allStages[currentStep].data.map(formatItem).join(', ')}] {'\u2192'} [{allStages[currentStep + 1]?.data.map(formatItem).join(', ')}]
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code representation */}
        <div style={{ marginTop: '1rem', background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '0.75rem 1rem', border: '1px solid var(--sl-color-gray-5)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Code Equivalent
          </div>
          <pre style={{ margin: 0, fontSize: '0.78rem', fontFamily: "'Fira Code', 'Cascadia Code', monospace', monospace", overflowX: 'auto', lineHeight: 1.6 }}>
            <code>
              <span style={{ color: '#c678dd' }}>const</span> <span style={{ color: '#61afef' }}>result</span> <span style={{ color: 'var(--sl-color-gray-3)' }}>=</span> [{inputData.map(formatItem).join(', ')}]{'\n'}
              {pipeline.map((op, i) => (
                <span key={i}>
                  {'  '}<span style={{ color: currentStep >= i ? op.color : 'var(--sl-color-gray-4)' }}>.{op.type}</span>
                  <span style={{ color: 'var(--sl-color-gray-3)' }}>(</span>
                  <span style={{ color: '#98c379' }}>{op.label}</span>
                  <span style={{ color: 'var(--sl-color-gray-3)' }}>)</span>
                  {i < pipeline.length - 1 ? '\n' : ';'}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
