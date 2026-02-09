import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DSType = 'stack' | 'queue' | 'linkedlist' | 'bst';

interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
  highlight?: boolean;
}

// ─── Stack Component ───
function StackViz() {
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
    setMessage(`Pushed ${val}`);
  };

  const pop = () => {
    if (stack.length === 0) { setMessage('Stack underflow! Stack is empty'); return; }
    const val = stack[stack.length - 1];
    setStack(stack.slice(0, -1));
    setPopped(val);
    setMessage(`Popped ${val}`);
  };

  const peek = () => {
    if (stack.length === 0) { setMessage('Stack is empty'); return; }
    setMessage(`Top element: ${stack[stack.length - 1]}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && push()} placeholder="Value" style={{ padding: '0.4rem 0.8rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'var(--sl-color-bg)', color: 'var(--sl-color-text)', width: 80, fontSize: '0.9rem' }} />
        <button onClick={push} style={btnStyle('#10b981')}>Push</button>
        <button onClick={pop} style={btnStyle('#ef4444')}>Pop</button>
        <button onClick={peek} style={btnStyle('#0066cc')}>Peek</button>
        <button onClick={() => { setStack([]); setMessage('Stack cleared'); setPopped(null); }} style={btnStyle('#6b7280')}>Clear</button>
      </div>
      {message && <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', background: 'var(--sl-color-gray-6)', color: 'var(--sl-color-text)' }}>{message}</div>}
      <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 4, minHeight: 200 }}>
        <div style={{ width: 120, padding: '0.3rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--sl-color-gray-3)', borderTop: '3px solid var(--sl-color-gray-4)' }}>Bottom</div>
        <AnimatePresence>
          {stack.map((val, i) => (
            <motion.div key={`${i}-${val}`}
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              style={{ width: 120, padding: '0.6rem', textAlign: 'center', background: i === stack.length - 1 ? '#0066cc' : 'var(--sl-color-gray-5)', color: i === stack.length - 1 ? '#fff' : 'var(--sl-color-text)', borderRadius: '0.375rem', fontWeight: 600, fontSize: '1rem', position: 'relative' }}>
              {val}
              {i === stack.length - 1 && <span style={{ position: 'absolute', right: -50, fontSize: '0.7rem', color: '#0066cc' }}>← TOP</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {stack.length === 0 && <div style={{ color: 'var(--sl-color-gray-3)', fontSize: '0.9rem', padding: '2rem' }}>Stack is empty</div>}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>Size: {stack.length}/10 {popped !== null && ` | Last popped: ${popped}`}</div>
    </div>
  );
}

// ─── Queue Component ───
function QueueViz() {
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

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enqueue()} placeholder="Value" style={{ padding: '0.4rem 0.8rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'var(--sl-color-bg)', color: 'var(--sl-color-text)', width: 80, fontSize: '0.9rem' }} />
        <button onClick={enqueue} style={btnStyle('#10b981')}>Enqueue</button>
        <button onClick={dequeue} style={btnStyle('#ef4444')}>Dequeue</button>
        <button onClick={() => { setQueue([]); setMessage('Queue cleared'); }} style={btnStyle('#6b7280')}>Clear</button>
      </div>
      {message && <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', background: 'var(--sl-color-gray-6)' }}>{message}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 80, overflowX: 'auto', padding: '1rem 0' }}>
        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>FRONT →</div>
        <AnimatePresence>
          {queue.map((val, i) => (
            <motion.div key={`${i}-${val}`}
              initial={{ opacity: 0, scale: 0.5, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -30 }}
              style={{ minWidth: 50, padding: '0.6rem', textAlign: 'center', background: i === 0 ? '#ef4444' : i === queue.length - 1 ? '#10b981' : 'var(--sl-color-gray-5)', color: (i === 0 || i === queue.length - 1) ? '#fff' : 'var(--sl-color-text)', borderRadius: '0.375rem', fontWeight: 600 }}>
              {val}
            </motion.div>
          ))}
        </AnimatePresence>
        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>← REAR</div>
        {queue.length === 0 && <div style={{ color: 'var(--sl-color-gray-3)', fontSize: '0.9rem', padding: '1rem' }}>Queue is empty</div>}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>Size: {queue.length}/10</div>
    </div>
  );
}

// ─── Linked List Component ───
function LinkedListViz() {
  const [nodes, setNodes] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [posInput, setPosInput] = useState('');
  const [message, setMessage] = useState('');

  const addHead = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    setNodes([val, ...nodes]);
    setInput('');
    setMessage(`Added ${val} at head`);
  };

  const addTail = () => {
    const val = parseInt(input);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
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
    setMessage(`Removed ${removed} at position ${pos}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Value" style={inputStyle} />
        <button onClick={addHead} style={btnStyle('#0066cc')}>Add Head</button>
        <button onClick={addTail} style={btnStyle('#10b981')}>Add Tail</button>
        <input type="number" value={posInput} onChange={(e) => setPosInput(e.target.value)} placeholder="Index" style={{ ...inputStyle, width: 60 }} />
        <button onClick={removeAt} style={btnStyle('#ef4444')}>Remove At</button>
        <button onClick={() => { setNodes([]); setMessage('List cleared'); }} style={btnStyle('#6b7280')}>Clear</button>
      </div>
      {message && <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', background: 'var(--sl-color-gray-6)' }}>{message}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '1.5rem 0', minHeight: 80 }}>
        <div style={{ fontSize: '0.7rem', color: '#0066cc', fontWeight: 600, marginRight: 8 }}>HEAD →</div>
        <AnimatePresence>
          {nodes.map((val, i) => (
            <motion.div key={`${i}`} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', border: '2px solid #0066cc', borderRadius: '0.375rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 0.8rem', fontWeight: 600, background: i === 0 ? '#0066cc' : 'transparent', color: i === 0 ? '#fff' : 'var(--sl-color-text)', minWidth: 40, textAlign: 'center' }}>{val}</div>
                <div style={{ padding: '0.5rem 0.4rem', borderLeft: '1px solid #0066cc', fontSize: '0.7rem', color: 'var(--sl-color-gray-3)', display: 'flex', alignItems: 'center' }}>
                  {i < nodes.length - 1 ? '●' : '∅'}
                </div>
              </div>
              {i < nodes.length - 1 && <div style={{ width: 24, height: 2, background: '#0066cc', position: 'relative' }}>
                <div style={{ position: 'absolute', right: -3, top: -4, color: '#0066cc', fontSize: '0.7rem' }}>→</div>
              </div>}
            </motion.div>
          ))}
        </AnimatePresence>
        {nodes.length === 0 && <div style={{ color: 'var(--sl-color-gray-3)', fontSize: '0.9rem', padding: '1rem' }}>List is empty - NULL</div>}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Length: {nodes.length}</div>
    </div>
  );
}

// ─── BST Component ───
function BSTViz() {
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
        {node.left && <line x1={`${x}%`} y1={depth * 60 + 25} x2={`${x - spread / 2}%`} y2={(depth + 1) * 60 + 25} stroke="var(--sl-color-gray-4)" strokeWidth={2} />}
        {node.right && <line x1={`${x}%`} y1={depth * 60 + 25} x2={`${x + spread / 2}%`} y2={(depth + 1) * 60 + 25} stroke="var(--sl-color-gray-4)" strokeWidth={2} />}
        <circle cx={`${x}%`} cy={depth * 60 + 25} r={20} fill={highlighted ? '#10b981' : '#0066cc'} stroke={highlighted ? '#059669' : '#004999'} strokeWidth={2} />
        <text x={`${x}%`} y={depth * 60 + 30} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{node.value}</text>
        {node.left && renderTree(node.left, depth + 1, x - spread / 2, spread / 2)}
        {node.right && renderTree(node.right, depth + 1, x + spread / 2, spread / 2)}
      </g>
    );
  };

  const getDepth = (node: TreeNode | null): number => {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left || null), getDepth(node.right || null));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInsert()} placeholder="Value" style={inputStyle} />
        <button onClick={handleInsert} style={btnStyle('#10b981')}>Insert</button>
        <button onClick={() => { setRoot(null); setMessage('Tree cleared'); setTraversal([]); }} style={btnStyle('#ef4444')}>Clear</button>
        <span style={{ color: 'var(--sl-color-gray-3)', fontSize: '0.7rem' }}>|</span>
        <button onClick={() => { setTraversal(inorder(root)); setMessage(`In-order: ${inorder(root).join(' → ')}`); }} style={btnStyle('#8b5cf6')}>In-order</button>
        <button onClick={() => { setTraversal(preorder(root)); setMessage(`Pre-order: ${preorder(root).join(' → ')}`); }} style={btnStyle('#8b5cf6')}>Pre-order</button>
        <button onClick={() => { setTraversal(postorder(root)); setMessage(`Post-order: ${postorder(root).join(' → ')}`); }} style={btnStyle('#8b5cf6')}>Post-order</button>
        <button onClick={() => { setTraversal(levelOrder(root)); setMessage(`Level-order: ${levelOrder(root).join(' → ')}`); }} style={btnStyle('#8b5cf6')}>Level-order</button>
      </div>
      {message && <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', background: 'var(--sl-color-gray-6)', fontFamily: 'monospace' }}>{message}</div>}
      <div style={{ minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', border: '1px dashed var(--sl-color-gray-5)', borderRadius: '0.5rem', padding: '1rem' }}>
        {root ? (
          <svg width="100%" height={Math.max(250, getDepth(root) * 60 + 50)} style={{ overflow: 'visible' }}>
            {renderTree(root)}
          </svg>
        ) : (
          <div style={{ color: 'var(--sl-color-gray-3)', padding: '3rem', textAlign: 'center' }}>
            Insert values to build a BST<br />
            <span style={{ fontSize: '0.8rem' }}>Try: 50, 30, 70, 20, 40, 60, 80</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared styles ───
const btnStyle = (bg: string): React.CSSProperties => ({
  padding: '0.4rem 0.8rem', borderRadius: '0.375rem', border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
});

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem', borderRadius: '0.375rem', border: '1px solid var(--sl-color-gray-4)', background: 'var(--sl-color-bg)', color: 'var(--sl-color-text)', width: 80, fontSize: '0.9rem',
};

// ─── Main Component ───
const DS_TABS: Record<DSType, { label: string; description: string }> = {
  stack: { label: 'Stack', description: 'LIFO - Last In, First Out' },
  queue: { label: 'Queue', description: 'FIFO - First In, First Out' },
  linkedlist: { label: 'Linked List', description: 'Sequential nodes with pointers' },
  bst: { label: 'Binary Search Tree', description: 'Ordered hierarchical structure' },
};

export default function DataStructureVisualizer({ defaultDS = 'stack' }: { defaultDS?: DSType }) {
  const [activeDS, setActiveDS] = useState<DSType>(defaultDS);

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Data Structure Visualizer</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>{DS_TABS[activeDS].description}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(Object.keys(DS_TABS) as DSType[]).map((ds) => (
              <button key={ds} onClick={() => setActiveDS(ds)}
                style={{ padding: '0.3rem 0.7rem', borderRadius: '0.375rem', border: activeDS === ds ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)', background: activeDS === ds ? '#0066cc' : 'transparent', color: activeDS === ds ? '#fff' : 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                {DS_TABS[ds].label}
              </button>
            ))}
          </div>
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
