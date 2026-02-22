import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO' | 'Random';

interface CacheEntry {
  key: string;
  insertOrder: number;
  lastAccess: number;
  accessCount: number;
  flash: 'hit' | 'miss' | 'evict' | null;
}

interface AccessResult {
  key: string;
  hit: boolean;
  evicted: string | null;
  reason: string;
}

const POLICIES: { key: EvictionPolicy; label: string; description: string }[] = [
  { key: 'LRU', label: 'LRU', description: 'Least Recently Used: Evicts the item that has not been accessed for the longest time.' },
  { key: 'LFU', label: 'LFU', description: 'Least Frequently Used: Evicts the item with the fewest total accesses.' },
  { key: 'FIFO', label: 'FIFO', description: 'First In First Out: Evicts the item that was added to the cache earliest.' },
  { key: 'Random', label: 'Random', description: 'Random: Evicts a random item from the cache. Simple but surprisingly effective.' },
];

const DEFAULT_REFERENCE_STRING = ['A', 'B', 'C', 'D', 'A', 'B', 'E', 'A', 'B', 'C', 'D', 'E', 'F', 'A', 'C', 'B', 'D', 'E', 'F', 'A'];

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

export default function CacheVisualizer() {
  const isMobile = useIsMobile();
  const [policy, setPolicy] = useState<EvictionPolicy>('LRU');
  const [cacheSize, setCacheSize] = useState(4);
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [history, setHistory] = useState<AccessResult[]>([]);
  const [referenceString] = useState(DEFAULT_REFERENCE_STRING);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const accessCounter = useRef(0);
  const insertCounter = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const findEvictionTarget = useCallback((currentCache: CacheEntry[], pol: EvictionPolicy): number => {
    if (currentCache.length === 0) return -1;
    switch (pol) {
      case 'LRU': {
        let minAccess = Infinity;
        let idx = 0;
        for (let i = 0; i < currentCache.length; i++) {
          if (currentCache[i].lastAccess < minAccess) {
            minAccess = currentCache[i].lastAccess;
            idx = i;
          }
        }
        return idx;
      }
      case 'LFU': {
        let minFreq = Infinity;
        let minAccess = Infinity;
        let idx = 0;
        for (let i = 0; i < currentCache.length; i++) {
          if (currentCache[i].accessCount < minFreq ||
              (currentCache[i].accessCount === minFreq && currentCache[i].lastAccess < minAccess)) {
            minFreq = currentCache[i].accessCount;
            minAccess = currentCache[i].lastAccess;
            idx = i;
          }
        }
        return idx;
      }
      case 'FIFO': {
        let minInsert = Infinity;
        let idx = 0;
        for (let i = 0; i < currentCache.length; i++) {
          if (currentCache[i].insertOrder < minInsert) {
            minInsert = currentCache[i].insertOrder;
            idx = i;
          }
        }
        return idx;
      }
      case 'Random':
        return Math.floor(Math.random() * currentCache.length);
    }
  }, []);

  const getEvictionReason = useCallback((pol: EvictionPolicy, entry: CacheEntry): string => {
    switch (pol) {
      case 'LRU': return `least recently accessed (last access: step ${entry.lastAccess})`;
      case 'LFU': return `least frequently accessed (${entry.accessCount} accesses)`;
      case 'FIFO': return `oldest entry (inserted at step ${entry.insertOrder})`;
      case 'Random': return 'randomly selected for eviction';
    }
  }, []);

  const accessKey = useCallback((key: string) => {
    accessCounter.current++;
    const now = accessCounter.current;

    setCache(prev => {
      const existing = prev.findIndex(e => e.key === key);

      if (existing !== -1) {
        // HIT
        setHits(h => h + 1);
        const updated = prev.map((e, i) =>
          i === existing
            ? { ...e, lastAccess: now, accessCount: e.accessCount + 1, flash: 'hit' as const }
            : { ...e, flash: null }
        );
        setHistory(h => [...h, { key, hit: true, evicted: null, reason: `HIT - "${key}" found in cache` }]);

        // Clear flash after delay
        setTimeout(() => {
          setCache(c => c.map(e => e.key === key ? { ...e, flash: null } : e));
        }, 600);

        return updated;
      }

      // MISS
      setMisses(m => m + 1);

      let evictedKey: string | null = null;
      let reason = '';
      let newCache = [...prev.map(e => ({ ...e, flash: null }))];

      if (newCache.length >= cacheSize) {
        // Need to evict
        const evictIdx = findEvictionTarget(newCache, policy);
        const evicted = newCache[evictIdx];
        evictedKey = evicted.key;
        reason = `MISS - "${key}" not in cache. Evicted "${evictedKey}" (${getEvictionReason(policy, evicted)})`;

        // Mark evicted briefly
        newCache[evictIdx] = { ...newCache[evictIdx], flash: 'evict' };
        setTimeout(() => {
          setCache(c => {
            const updated = c.filter(e => e.key !== evictedKey);
            insertCounter.current++;
            const newEntry: CacheEntry = {
              key,
              insertOrder: insertCounter.current,
              lastAccess: now,
              accessCount: 1,
              flash: 'miss',
            };
            const result = [...updated, newEntry];
            setTimeout(() => {
              setCache(cc => cc.map(e => e.key === key ? { ...e, flash: null } : e));
            }, 600);
            return result;
          });
        }, 400);

        setHistory(h => [...h, { key, hit: false, evicted: evictedKey, reason }]);
        return newCache;
      }

      // No eviction needed, just add
      insertCounter.current++;
      const newEntry: CacheEntry = {
        key,
        insertOrder: insertCounter.current,
        lastAccess: now,
        accessCount: 1,
        flash: 'miss',
      };
      reason = `MISS - "${key}" not in cache. Added to empty slot.`;
      setHistory(h => [...h, { key, hit: false, evicted: null, reason }]);

      setTimeout(() => {
        setCache(c => c.map(e => e.key === key ? { ...e, flash: null } : e));
      }, 600);

      return [...newCache, newEntry];
    });
  }, [cacheSize, policy, findEvictionTarget, getEvictionReason]);

  const step = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= referenceString.length) {
      setPlaying(false);
      return;
    }
    setCurrentIndex(nextIdx);
    accessKey(referenceString[nextIdx]);
  }, [currentIndex, referenceString, accessKey]);

  // Auto-play
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    if (currentIndex >= referenceString.length - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(200, 1500 - speed * 13);
    timerRef.current = setTimeout(step, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, currentIndex, referenceString.length, speed, step]);

  const reset = useCallback(() => {
    setCache([]);
    setHits(0);
    setMisses(0);
    setHistory([]);
    setCurrentIndex(-1);
    setPlaying(false);
    accessCounter.current = 0;
    insertCounter.current = 0;
  }, []);

  const hitRatio = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0.0';

  const pillBtn = (active: boolean): React.CSSProperties => ({
    height: '1.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '0 0.75rem',
    border: active ? '2px solid #0066cc' : '2px solid var(--sl-color-gray-4)',
    background: active ? '#0066cc' : 'transparent',
    color: active ? '#fff' : 'var(--sl-color-text)',
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontWeight: 600,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  });

  const actionBtn = (bg: string, disabled = false): React.CSSProperties => ({
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    border: 'none',
    background: disabled ? 'var(--sl-color-gray-5)' : bg,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    minHeight: 36,
  });

  const getFlashColor = (flash: CacheEntry['flash']) => {
    if (flash === 'hit') return '#10b981';
    if (flash === 'miss') return '#f59e0b';
    if (flash === 'evict') return '#ef4444';
    return 'var(--sl-color-gray-5)';
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Cache Eviction Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Compare LRU, LFU, FIFO, and Random eviction policies step by step
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Policy selector */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Eviction Policy
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {POLICIES.map(p => (
              <button
                key={p.key}
                onClick={() => { setPolicy(p.key); reset(); }}
                style={pillBtn(policy === p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policy description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={policy}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '6px',
              background: '#0066cc12',
              border: '1px solid #0066cc30',
              fontSize: '0.78rem',
              color: 'var(--sl-color-gray-2)',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}
          >
            {POLICIES.find(p => p.key === policy)?.description}
          </motion.div>
        </AnimatePresence>

        {/* Cache size control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Cache Size:</label>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {[2, 3, 4, 5, 6].map(s => (
              <button
                key={s}
                onClick={() => { setCacheSize(s); reset(); }}
                style={pillBtn(cacheSize === s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Playback controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <button
            style={actionBtn(playing ? '#ef4444' : '#10b981')}
            onClick={() => {
              if (currentIndex >= referenceString.length - 1) {
                reset();
                setTimeout(() => setPlaying(true), 50);
              } else {
                setPlaying(p => !p);
              }
            }}
          >
            {playing ? 'Pause' : currentIndex >= referenceString.length - 1 ? 'Replay' : 'Play'}
          </button>
          <button
            style={actionBtn('#0066cc', playing || currentIndex >= referenceString.length - 1)}
            onClick={step}
            disabled={playing || currentIndex >= referenceString.length - 1}
          >
            Step
          </button>
          <button style={actionBtn('var(--sl-color-gray-4)')} onClick={reset}>
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
              style={{ width: isMobile ? '4rem' : '5rem', accentColor: '#0066cc' }}
            />
          </label>
        </div>

        {/* Reference string */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Access Sequence ({currentIndex + 1}/{referenceString.length})
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {referenceString.map((key, i) => {
              const isPast = i <= currentIndex;
              const isCurrent = i === currentIndex;
              const isNext = i === currentIndex + 1;
              const wasHit = history[i]?.hit;
              return (
                <motion.div
                  key={i}
                  animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: isCurrent
                      ? '2px solid #0066cc'
                      : isNext
                        ? '2px dashed #0066cc50'
                        : isPast
                          ? `2px solid ${wasHit ? '#10b98180' : '#ef444480'}`
                          : '1px solid var(--sl-color-gray-5)',
                    background: isCurrent
                      ? '#0066cc30'
                      : isPast
                        ? wasHit ? '#10b98118' : '#ef444418'
                        : 'transparent',
                    color: isCurrent ? '#0066cc' : isPast
                      ? wasHit ? '#10b981' : '#ef4444'
                      : 'var(--sl-color-gray-3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {key}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Cache slots */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Cache ({cache.length}/{cacheSize} slots used)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Array.from({ length: cacheSize }).map((_, i) => {
              const entry = cache[i];
              const flashColor = entry ? getFlashColor(entry.flash) : 'var(--sl-color-gray-5)';
              return (
                <motion.div
                  key={i}
                  layout
                  style={{
                    width: isMobile ? 70 : 90,
                    minHeight: isMobile ? 70 : 80,
                    borderRadius: '10px',
                    border: `2px solid ${entry ? flashColor : 'var(--sl-color-gray-5)'}`,
                    background: entry?.flash ? `${flashColor}20` : entry ? 'var(--sl-color-gray-6)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    transition: 'all 0.25s',
                    boxShadow: entry?.flash ? `0 0 12px ${flashColor}40` : 'none',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {entry ? (
                      <motion.div
                        key={entry.key}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{ textAlign: 'center' }}
                      >
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: flashColor !== 'var(--sl-color-gray-5)' ? flashColor : 'var(--sl-color-text)' }}>
                          {entry.key}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--sl-color-gray-3)', marginTop: '0.15rem', lineHeight: 1.4 }}>
                          <div>freq: {entry.accessCount}</div>
                          <div>last: {entry.lastAccess}</div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        style={{ fontSize: '0.7rem', color: 'var(--sl-color-gray-4)' }}
                      >
                        empty
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {[
            { label: 'Hits', value: hits, color: '#10b981' },
            { label: 'Misses', value: misses, color: '#ef4444' },
            { label: 'Hit Ratio', value: `${hitRatio}%`, color: '#0066cc' },
          ].map(s => (
            <div
              key={s.label}
              style={{
                flex: '1 1 80px',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                background: `${s.color}12`,
                border: `1px solid ${s.color}40`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>
                {s.value}
              </div>
            </div>
          ))}
          {/* Hit ratio bar */}
          <div style={{ flex: '2 1 180px', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--sl-color-gray-6)', border: '1px solid var(--sl-color-gray-5)' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Hit / Miss Distribution
            </div>
            <div style={{ height: 12, borderRadius: 6, background: 'var(--sl-color-gray-5)', overflow: 'hidden', display: 'flex' }}>
              <motion.div
                animate={{ width: `${hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0}%` }}
                style={{ height: '100%', background: '#10b981', borderRadius: '6px 0 0 6px' }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                animate={{ width: `${hits + misses > 0 ? (misses / (hits + misses)) * 100 : 0}%` }}
                style={{ height: '100%', background: '#ef4444' }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', fontSize: '0.65rem' }}>
              <span style={{ color: '#10b981' }}>Hit {hitRatio}%</span>
              <span style={{ color: '#ef4444' }}>Miss {hits + misses > 0 ? (100 - parseFloat(hitRatio)).toFixed(1) : '0.0'}%</span>
            </div>
          </div>
        </div>

        {/* History log */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Access History
          </div>
          <div style={{
            background: 'var(--sl-color-gray-7, #0d1117)',
            border: '1px solid var(--sl-color-gray-5)',
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
            maxHeight: 160,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.72rem',
            lineHeight: 1.7,
          }}>
            {history.length === 0 && (
              <span style={{ color: 'var(--sl-color-gray-4)' }}>Click Play or Step to begin accessing the cache...</span>
            )}
            {history.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ color: h.hit ? '#10b981' : '#ef4444' }}
              >
                <span style={{ color: 'var(--sl-color-gray-4)', marginRight: '0.4rem' }}>
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                <span style={{
                  display: 'inline-block',
                  padding: '0 0.3rem',
                  borderRadius: '3px',
                  background: h.hit ? '#10b98120' : '#ef444420',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  marginRight: '0.3rem',
                }}>
                  {h.hit ? 'HIT' : 'MISS'}
                </span>
                {h.reason}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
