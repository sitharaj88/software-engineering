import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DSType = 'stack' | 'queue' | 'linkedlist' | 'bst';

interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
}

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

// ─── Shared styles ───
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
  marginBottom: '0.4rem',
};

const fieldLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--sl-color-gray-3)',
  marginBottom: '0.2rem',
  display: 'block',
};

const inputField: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: 6,
  border: '1.5px solid var(--sl-color-gray-4)',
  background: 'var(--sl-color-bg)',
  color: 'var(--sl-color-text)',
  fontSize: '0.85rem',
  fontWeight: 500,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
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

const btnOut = (color: string): React.CSSProperties => ({
  ...btnBase,
  background: 'transparent',
  color,
  border: `1.5px solid ${color}`,
});

const msgStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  marginBottom: '1rem',
  padding: '0.5rem 1rem',
  borderRadius: 6,
  background: 'var(--sl-color-gray-6)',
  border: '1px solid var(--sl-color-gray-5)',
  color: 'var(--sl-color-text)',
};

const emptyMsg: React.CSSProperties = {
  color: 'var(--sl-color-gray-3)',
  fontSize: '0.9rem',
  padding: '2.5rem 1rem',
  textAlign: 'center',
  width: '100%',
};

const statusText: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--sl-color-gray-3)',
  marginTop: '0.75rem',
  padding: '0 0.25rem',
};

const hrSep: React.CSSProperties = {
  height: 1,
  background: 'var(--sl-color-gray-5)',
  margin: '0.25rem 0',
};

// ─── Stack Component ───
function StackViz() {
  const isMobile = useIsMobile();
  const [stack, setStack] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [popped, setPopped] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const push = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    if (stack.length >= 10) { setMessage('Stack overflow! Max 10 elements'); return; }
    setStack([...stack, val]);
    setInput('');
    setPopped(null);
    setMessage(`Pushed ${val} onto stack`);
  };

  const pop = () => {
    if (stack.length === 0) { setMessage('Stack underflow! Stack is empty'); return; }
    const val = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    setPopped(val);
    setMessage(`Popped ${val} from stack`);
  };

  const peek = () => {
    if (stack.length === 0) { setMessage('Stack is empty'); return; }
    setMessage(`Top element: ${stack[stack.length - 1]}`);
  };

  const clear = () => { setStack([]); setMessage('Stack cleared'); setPopped(null); };

  return (
    <div>
      <div style={controlBox}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={sectionLabel}>Push Value</div>
              <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && push()}
                placeholder="Enter a number" style={inputField} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={push} style={{ ...btn('#10b981'), flex: 1 }}>Push</button>
              <button onClick={pop} style={{ ...btnOut('#ef4444'), flex: 1 }}>Pop</button>
              <button onClick={peek} style={{ ...btn('#0066cc'), flex: 1 }}>Peek</button>
            </div>
            <button onClick={clear} style={{ ...btnOut('#6b7280'), width: '100%' }}>Clear</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <div style={{ minWidth: 160 }}>
              <div style={fieldLabel}>Value</div>
              <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && push()}
                placeholder="Enter a number" style={{ ...inputField, width: 160 }} />
            </div>
            <button onClick={push} style={btn('#10b981')}>Push</button>
            <button onClick={pop} style={btnOut('#ef4444')}>Pop</button>
            <button onClick={peek} style={btn('#0066cc')}>Peek</button>
            <div style={{ flex: 1 }} />
            <button onClick={clear} style={btnOut('#6b7280')}>Clear</button>
          </div>
        )}
      </div>
      {message && <div style={msgStyle}>{message}</div>}
      <div style={{
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
        gap: 3, minHeight: 240, padding: '1rem',
        border: '1px dashed var(--sl-color-gray-5)', borderRadius: '0.5rem',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 160, height: '100%',
          borderLeft: '3px solid var(--sl-color-gray-4)',
          borderRight: '3px solid var(--sl-color-gray-4)',
          borderBottom: '3px solid var(--sl-color-gray-4)',
          borderRadius: '0 0 0.5rem 0.5rem', pointerEvents: 'none',
        }} />
        <AnimatePresence>
          {stack.map((val, i) => (
            <motion.div key={`${i}-${val}`}
              initial={{ opacity: 0, scale: 0.8, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                width: 140, padding: '0.65rem 1rem', textAlign: 'center',
                background: i === stack.length - 1 ? '#0066cc' : 'var(--sl-color-gray-5)',
                color: i === stack.length - 1 ? '#fff' : 'var(--sl-color-text)',
                borderRadius: '0.4rem', fontWeight: 700, fontSize: '1rem',
                position: 'relative', zIndex: 1,
              }}>
              {val}
              {i === stack.length - 1 && (
                <span style={{ position: 'absolute', left: '100%', marginLeft: 12, fontSize: '0.75rem', color: '#0066cc', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  TOP
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {stack.length === 0 && <div style={emptyMsg}>Stack is empty — push an element</div>}
      </div>
      <div style={statusText}>
        Size: {stack.length} / 10
        {popped !== null && <span> &middot; Last popped: <strong>{popped}</strong></span>}
      </div>
    </div>
  );
}

// ─── Queue Component ───
function QueueViz() {
  const isMobile = useIsMobile();
  const [queue, setQueue] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');

  const enqueue = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    if (queue.length >= 10) { setMessage('Queue is full! Max 10 elements'); return; }
    setQueue([...queue, val]);
    setInput('');
    setMessage(`Enqueued ${val}`);
  };

  const dequeue = () => {
    if (queue.length === 0) { setMessage('Queue is empty!'); return; }
    setMessage(`Dequeued ${queue[0]}`);
    setQueue(queue.slice(1));
  };

  const clear = () => { setQueue([]); setMessage('Queue cleared'); };

  return (
    <div>
      <div style={controlBox}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={sectionLabel}>Enqueue Value</div>
              <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enqueue()}
                placeholder="Enter a number" style={inputField} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={enqueue} style={{ ...btn('#10b981'), flex: 1 }}>Enqueue</button>
              <button onClick={dequeue} style={{ ...btnOut('#ef4444'), flex: 1 }}>Dequeue</button>
            </div>
            <button onClick={clear} style={{ ...btnOut('#6b7280'), width: '100%' }}>Clear</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <div style={{ minWidth: 160 }}>
              <div style={fieldLabel}>Value</div>
              <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enqueue()}
                placeholder="Enter a number" style={{ ...inputField, width: 160 }} />
            </div>
            <button onClick={enqueue} style={btn('#10b981')}>Enqueue</button>
            <button onClick={dequeue} style={btnOut('#ef4444')}>Dequeue</button>
            <div style={{ flex: 1 }} />
            <button onClick={clear} style={btnOut('#6b7280')}>Clear</button>
          </div>
        )}
      </div>
      {message && <div style={msgStyle}>{message}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0, minHeight: 100,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '1.5rem 1rem',
        border: '1px dashed var(--sl-color-gray-5)', borderRadius: '0.5rem',
      }}>
        {queue.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>FRONT</span>
            <svg width="16" height="20" viewBox="0 0 16 20"><polygon points="8,20 2,10 14,10" fill="#ef4444" /></svg>
          </div>
        )}
        <AnimatePresence>
          {queue.map((val, i) => (
            <motion.div key={`${i}-${val}`}
              initial={{ opacity: 0, scale: 0.5, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <svg width="20" height="16" viewBox="0 0 20 16" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="8" x2="14" y2="8" stroke="var(--sl-color-gray-4)" strokeWidth="2" />
                  <polygon points="14,4 20,8 14,12" fill="var(--sl-color-gray-4)" />
                </svg>
              )}
              <div style={{
                minWidth: 52, padding: '0.65rem 0.8rem', textAlign: 'center',
                background: i === 0 ? '#ef4444' : i === queue.length - 1 ? '#10b981' : '#0066cc',
                color: '#fff', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
              }}>
                {val}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {queue.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>REAR</span>
            <svg width="16" height="20" viewBox="0 0 16 20"><polygon points="8,20 2,10 14,10" fill="#10b981" /></svg>
          </div>
        )}
        {queue.length === 0 && <div style={emptyMsg}>Queue is empty — enqueue an element</div>}
      </div>
      <div style={statusText}>
        Size: {queue.length} / 10
        {queue.length > 0 && <span> &middot; Front: <strong>{queue[0]}</strong> &middot; Rear: <strong>{queue[queue.length - 1]}</strong></span>}
      </div>
    </div>
  );
}

// ─── Linked List Component ───
function LinkedListViz() {
  const isMobile = useIsMobile();
  const [nodes, setNodes] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [posInput, setPosInput] = useState('');
  const [message, setMessage] = useState('');

  const addHead = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    if (nodes.length >= 8) { setMessage('Max 8 nodes for visualization'); return; }
    setNodes([val, ...nodes]);
    setInput('');
    setMessage(`Added ${val} at head`);
  };

  const addTail = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    if (nodes.length >= 8) { setMessage('Max 8 nodes for visualization'); return; }
    setNodes([...nodes, val]);
    setInput('');
    setMessage(`Added ${val} at tail`);
  };

  const removeAt = () => {
    const pos = parseInt(posInput);
    if (isNaN(pos) || pos < 0 || pos >= nodes.length) { setMessage('Invalid position'); return; }
    const removed = nodes[pos];
    setNodes(nodes.filter((_, i) => i !== pos));
    setPosInput('');
    setMessage(`Removed ${removed} at index ${pos}`);
  };

  const clear = () => { setNodes([]); setMessage('List cleared'); };

  return (
    <div>
      <div style={controlBox}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={sectionLabel}>Add Node</div>
              <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTail()}
                placeholder="Enter a value" style={{ ...inputField, marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={addHead} style={{ ...btn('#0066cc'), flex: 1 }}>Add Head</button>
                <button onClick={addTail} style={{ ...btn('#10b981'), flex: 1 }}>Add Tail</button>
              </div>
            </div>
            <div style={hrSep} />
            <div>
              <div style={sectionLabel}>Remove Node</div>
              <input type="number" value={posInput} onChange={(e) => setPosInput(e.target.value)}
                placeholder="Enter index" style={{ ...inputField, marginBottom: '0.5rem' }} />
              <button onClick={removeAt} style={{ ...btnOut('#ef4444'), width: '100%' }}>Remove at Index</button>
            </div>
            <div style={hrSep} />
            <button onClick={clear} style={{ ...btnOut('#6b7280'), width: '100%' }}>Clear All</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={sectionLabel}>Add Node</div>
                <div style={fieldLabel}>Value</div>
                <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTail()}
                  placeholder="Enter a value" style={{ ...inputField, marginBottom: '0.5rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={addHead} style={{ ...btn('#0066cc'), flex: 1 }}>Add Head</button>
                  <button onClick={addTail} style={{ ...btn('#10b981'), flex: 1 }}>Add Tail</button>
                </div>
              </div>
              <div>
                <div style={sectionLabel}>Remove Node</div>
                <div style={fieldLabel}>Index</div>
                <input type="number" value={posInput} onChange={(e) => setPosInput(e.target.value)}
                  placeholder="Enter index" style={{ ...inputField, marginBottom: '0.5rem' }} />
                <button onClick={removeAt} style={{ ...btnOut('#ef4444'), width: '100%' }}>Remove at Index</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={clear} style={btnOut('#6b7280')}>Clear All</button>
            </div>
          </div>
        )}
      </div>
      {message && <div style={msgStyle}>{message}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '1.5rem 1rem', minHeight: 110,
        border: '1px dashed var(--sl-color-gray-5)', borderRadius: '0.5rem',
      }}>
        {nodes.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#0066cc', fontWeight: 700, marginRight: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>HEAD</div>
        )}
        <AnimatePresence>
          {nodes.map((val, i) => (
            <motion.div key={`node-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {i > 0 && (
                <svg width="32" height="16" viewBox="0 0 32 16" style={{ flexShrink: 0, display: 'block' }}>
                  <line x1="0" y1="8" x2="24" y2="8" stroke="#0066cc" strokeWidth="2" />
                  <polygon points="24,3 32,8 24,13" fill="#0066cc" />
                </svg>
              )}
              <div style={{
                display: 'flex', borderRadius: '0.5rem', overflow: 'hidden',
                border: '2px solid #0066cc', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              }}>
                <div style={{
                  padding: '0.65rem 1.1rem', fontWeight: 700, fontSize: '1.05rem',
                  background: i === 0 ? '#0066cc' : 'var(--sl-color-bg)',
                  color: i === 0 ? '#fff' : 'var(--sl-color-text)',
                  minWidth: 52, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {val}
                </div>
                <div style={{
                  width: 40, borderLeft: '2px solid #0066cc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sl-color-bg)',
                }}>
                  {i < nodes.length - 1 ? (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0066cc' }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <line x1="4" y1="14" x2="14" y2="2" stroke="var(--sl-color-gray-3)" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {nodes.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', marginLeft: 10, whiteSpace: 'nowrap', fontWeight: 700, flexShrink: 0 }}>NULL</div>
        )}
        {nodes.length === 0 && <div style={emptyMsg}>List is empty — add nodes to visualize</div>}
      </div>
      <div style={statusText}>Length: {nodes.length}</div>
    </div>
  );
}

// ─── BST Component ───
function BSTViz() {
  const isMobile = useIsMobile();
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [traversal, setTraversal] = useState<number[]>([]);

  const insert = useCallback((node: TreeNode | null, val: number): TreeNode => {
    if (!node) return { value: val };
    if (val < node.value) return { ...node, left: insert(node.left || null, val) };
    if (val > node.value) return { ...node, right: insert(node.right || null, val) };
    return node;
  }, []);

  const handleInsert = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    setRoot((prev) => insert(prev, val));
    setInput('');
    setMessage(`Inserted ${val}`);
    setTraversal([]);
  };

  const inorder = useCallback((node: TreeNode | null, result: number[] = []): number[] => {
    if (!node) return result;
    inorder(node.left || null, result);
    result.push(node.value);
    inorder(node.right || null, result);
    return result;
  }, []);

  const preorder = useCallback((node: TreeNode | null, result: number[] = []): number[] => {
    if (!node) return result;
    result.push(node.value);
    preorder(node.left || null, result);
    preorder(node.right || null, result);
    return result;
  }, []);

  const postorder = useCallback((node: TreeNode | null, result: number[] = []): number[] => {
    if (!node) return result;
    postorder(node.left || null, result);
    postorder(node.right || null, result);
    result.push(node.value);
    return result;
  }, []);

  const levelOrder = useCallback((node: TreeNode | null): number[] => {
    if (!node) return [];
    const result: number[] = [];
    const queue: TreeNode[] = [node];
    while (queue.length) {
      const curr = queue.shift()!;
      result.push(curr.value);
      if (curr.left) queue.push(curr.left);
      if (curr.right) queue.push(curr.right);
    }
    return result;
  }, []);

  const renderTree = (node: TreeNode | null, depth = 0, x = 50, spread = 25): JSX.Element | null => {
    if (!node) return null;
    const highlighted = traversal.includes(node.value);
    return (
      <g key={`${node.value}-${depth}-${x}`}>
        {node.left && <line x1={`${x}%`} y1={depth * 65 + 28} x2={`${x - spread / 2}%`} y2={(depth + 1) * 65 + 28} stroke="var(--sl-color-gray-4)" strokeWidth={2} />}
        {node.right && <line x1={`${x}%`} y1={depth * 65 + 28} x2={`${x + spread / 2}%`} y2={(depth + 1) * 65 + 28} stroke="var(--sl-color-gray-4)" strokeWidth={2} />}
        <circle cx={`${x}%`} cy={depth * 65 + 28} r={22} fill={highlighted ? '#10b981' : '#0066cc'} stroke={highlighted ? '#059669' : '#004999'} strokeWidth={2.5} />
        <text x={`${x}%`} y={depth * 65 + 33} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">{node.value}</text>
        {node.left && renderTree(node.left, depth + 1, x - spread / 2, spread / 2)}
        {node.right && renderTree(node.right, depth + 1, x + spread / 2, spread / 2)}
      </g>
    );
  };

  const getDepth = (node: TreeNode | null): number => {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left || null), getDepth(node.right || null));
  };

  const clearTree = () => { setRoot(null); setMessage('Tree cleared'); setTraversal([]); };

  return (
    <div>
      <div style={controlBox}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={sectionLabel}>Insert</div>
              <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                placeholder="Enter a value" style={{ ...inputField, marginBottom: '0.5rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleInsert} style={{ ...btn('#10b981'), flex: 1 }}>Insert</button>
                <button onClick={clearTree} style={{ ...btnOut('#ef4444'), flex: 1 }}>Clear</button>
              </div>
            </div>
            <div style={hrSep} />
            <div>
              <div style={sectionLabel}>Traversals</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button onClick={() => { setTraversal(inorder(root)); setMessage(`In-order: ${inorder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>In-order</button>
                <button onClick={() => { setTraversal(preorder(root)); setMessage(`Pre-order: ${preorder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>Pre-order</button>
                <button onClick={() => { setTraversal(postorder(root)); setMessage(`Post-order: ${postorder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>Post-order</button>
                <button onClick={() => { setTraversal(levelOrder(root)); setMessage(`Level-order: ${levelOrder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>Level-order</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={sectionLabel}>Insert</div>
                <div style={fieldLabel}>Value</div>
                <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                  placeholder="Enter a value" style={{ ...inputField, marginBottom: '0.5rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleInsert} style={{ ...btn('#10b981'), flex: 1 }}>Insert</button>
                  <button onClick={clearTree} style={{ ...btnOut('#ef4444'), flex: 1 }}>Clear</button>
                </div>
              </div>
              <div>
                <div style={sectionLabel}>Traversals</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '1.35rem' }}>
                  <button onClick={() => { setTraversal(inorder(root)); setMessage(`In-order: ${inorder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>In-order</button>
                  <button onClick={() => { setTraversal(preorder(root)); setMessage(`Pre-order: ${preorder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>Pre-order</button>
                  <button onClick={() => { setTraversal(postorder(root)); setMessage(`Post-order: ${postorder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>Post-order</button>
                  <button onClick={() => { setTraversal(levelOrder(root)); setMessage(`Level-order: ${levelOrder(root).join(' \u2192 ')}`); }} style={btn('#8b5cf6')}>Level-order</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {message && <div style={{ ...msgStyle, fontFamily: 'monospace' }}>{message}</div>}
      <div style={{ minHeight: 260, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', border: '1px dashed var(--sl-color-gray-5)', borderRadius: '0.5rem', padding: '1rem' }}>
        {root ? (
          <svg width="100%" height={Math.max(260, getDepth(root) * 65 + 55)} style={{ overflow: 'visible' }}>
            {renderTree(root)}
          </svg>
        ) : (
          <div style={{ ...emptyMsg, padding: '3rem 1rem' }}>
            Insert values to build a BST<br />
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Try: 50, 30, 70, 20, 40, 60, 80</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───
const DS_TABS: Record<DSType, { label: string; description: string }> = {
  stack: { label: 'Stack', description: 'LIFO - Last In, First Out' },
  queue: { label: 'Queue', description: 'FIFO - First In, First Out' },
  linkedlist: { label: 'Linked List', description: 'Sequential nodes with pointers' },
  bst: { label: 'Binary Search Tree', description: 'Ordered hierarchical structure' },
};

export default function DataStructureVisualizer({ defaultDS = 'stack' }: { defaultDS?: DSType }) {
  const isMobile = useIsMobile();
  const [activeDS, setActiveDS] = useState<DSType>(defaultDS);

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: 12, overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <div style={{ marginBottom: '0.6rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Data Structure Visualizer</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>{DS_TABS[activeDS].description}</p>
        </div>
        <div style={{
          display: 'flex', gap: '0.4rem',
          ...(isMobile
            ? { overflowX: 'auto' as const, WebkitOverflowScrolling: 'touch' as const, paddingBottom: 2 }
            : { flexWrap: 'wrap' as const }),
        }}>
          {(Object.keys(DS_TABS) as DSType[]).map((ds) => (
            <button key={ds} onClick={() => setActiveDS(ds)}
              style={{
                padding: '0.5rem 1rem', borderRadius: 6,
                border: activeDS === ds ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                background: activeDS === ds ? '#0066cc' : 'transparent',
                color: activeDS === ds ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.15s', whiteSpace: 'nowrap', minHeight: 44, flexShrink: 0,
              }}>
              {DS_TABS[ds].label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {activeDS === 'stack' && <StackViz />}
        {activeDS === 'queue' && <QueueViz />}
        {activeDS === 'linkedlist' && <LinkedListViz />}
        {activeDS === 'bst' && <BSTViz />}
      </div>
    </div>
  );
}
