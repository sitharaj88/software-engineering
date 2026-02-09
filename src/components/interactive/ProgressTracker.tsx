import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Topic {
  id: string;
  name: string;
  category: string;
  url: string;
}

const TOPICS: Topic[] = [
  { id: 'big-o', name: 'Big O Notation', category: 'Fundamentals', url: '/dsa/fundamentals/big-o-notation/' },
  { id: 'time-complexity', name: 'Time Complexity', category: 'Fundamentals', url: '/dsa/fundamentals/time-complexity/' },
  { id: 'space-complexity', name: 'Space Complexity', category: 'Fundamentals', url: '/dsa/fundamentals/space-complexity/' },
  { id: 'arrays', name: 'Arrays', category: 'Linear', url: '/dsa/arrays/' },
  { id: 'two-pointers', name: 'Two Pointers', category: 'Linear', url: '/dsa/arrays/two-pointers/' },
  { id: 'sliding-window', name: 'Sliding Window', category: 'Linear', url: '/dsa/arrays/sliding-window/' },
  { id: 'strings', name: 'Strings', category: 'Linear', url: '/dsa/strings/' },
  { id: 'linked-lists', name: 'Linked Lists', category: 'Linear', url: '/dsa/linked-lists/' },
  { id: 'stacks', name: 'Stacks', category: 'Linear', url: '/dsa/stacks/' },
  { id: 'queues', name: 'Queues', category: 'Linear', url: '/dsa/queues/' },
  { id: 'hash-tables', name: 'Hash Tables', category: 'Non-Linear', url: '/dsa/hash-tables/' },
  { id: 'trees', name: 'Trees', category: 'Non-Linear', url: '/dsa/trees/' },
  { id: 'heaps', name: 'Heaps', category: 'Non-Linear', url: '/dsa/heaps/' },
  { id: 'graphs', name: 'Graphs', category: 'Non-Linear', url: '/dsa/graphs/' },
  { id: 'sorting', name: 'Sorting', category: 'Algorithms', url: '/dsa/sorting/' },
  { id: 'binary-search', name: 'Binary Search', category: 'Algorithms', url: '/dsa/searching/binary-search/' },
  { id: 'recursion', name: 'Recursion', category: 'Algorithms', url: '/dsa/recursion/' },
  { id: 'backtracking', name: 'Backtracking', category: 'Algorithms', url: '/dsa/backtracking/' },
  { id: 'dynamic-programming', name: 'Dynamic Programming', category: 'Algorithms', url: '/dsa/dynamic-programming/' },
  { id: 'greedy', name: 'Greedy', category: 'Algorithms', url: '/dsa/greedy/' },
];

const STORAGE_KEY = 'seh-progress';

export default function ProgressTracker() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCompleted(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const save = (newSet: Set<string>) => {
    setCompleted(newSet);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...newSet])); } catch {}
  };

  const toggle = (id: string) => {
    const newSet = new Set(completed);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    save(newSet);
  };

  const categories = useMemo(() => {
    const cats = new Map<string, Topic[]>();
    for (const t of TOPICS) {
      if (!cats.has(t.category)) cats.set(t.category, []);
      cats.get(t.category)!.push(t);
    }
    return cats;
  }, []);

  const totalCompleted = completed.size;
  const totalTopics = TOPICS.length;
  const percentage = Math.round((totalCompleted / totalTopics) * 100);

  const catColors: Record<string, string> = {
    Fundamentals: '#8b5cf6',
    Linear: '#3b82f6',
    'Non-Linear': '#10b981',
    Algorithms: '#f59e0b',
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Learning Progress</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>Track your journey through the curriculum</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: percentage >= 80 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#0066cc' }}>{percentage}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>{totalCompleted}/{totalTopics} topics</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop: '0.75rem', height: 8, background: 'var(--sl-color-gray-5)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${percentage}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: percentage >= 80 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#0066cc', borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Category progress */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {Array.from(categories.entries()).map(([cat, topics]) => {
            const catCompleted = topics.filter((t) => completed.has(t.id)).length;
            const catPct = Math.round((catCompleted / topics.length) * 100);
            const color = catColors[cat] || '#6b7280';
            return (
              <div key={cat} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: `1px solid ${color}30`, background: `${color}08` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{cat}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>{catCompleted}/{topics.length}</span>
                </div>
                <div style={{ height: 4, background: `${color}20`, borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${catPct}%` }} transition={{ duration: 0.5 }}
                    style={{ height: '100%', background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Topic checklist */}
        {Array.from(categories.entries()).map(([cat, topics]) => {
          const color = catColors[cat] || '#6b7280';
          return (
            <div key={cat} style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color, margin: '0 0 0.5rem' }}>{cat}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.3rem' }}>
                {topics.map((topic) => {
                  const isCompleted = completed.has(topic.id);
                  return (
                    <div key={topic.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '0.375rem', cursor: 'pointer', background: isCompleted ? `${color}10` : 'transparent', border: `1px solid ${isCompleted ? color + '30' : 'transparent'}`, transition: 'all 0.2s' }}
                      onClick={() => toggle(topic.id)}>
                      <div style={{ width: 20, height: 20, borderRadius: '0.25rem', border: `2px solid ${isCompleted ? color : 'var(--sl-color-gray-4)'}`, background: isCompleted ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, transition: 'all 0.2s' }}>
                        {isCompleted && '✓'}
                      </div>
                      <a href={topic.url} onClick={(e) => e.stopPropagation()} style={{ fontSize: '0.85rem', color: 'var(--sl-color-text)', textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.7 : 1 }}>
                        {topic.name}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--sl-color-gray-5)', paddingTop: '1rem' }}>
          <button onClick={() => save(new Set(TOPICS.map((t) => t.id)))}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.8rem' }}>
            Mark All Complete
          </button>
          <button onClick={() => save(new Set())}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'transparent', color: 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.8rem' }}>
            Reset Progress
          </button>
        </div>
      </div>
    </div>
  );
}
