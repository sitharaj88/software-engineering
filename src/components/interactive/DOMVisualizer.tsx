import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
type Scenario = 'tree' | 'bubbling' | 'boxmodel';

interface DOMNode {
  tag: string;
  id?: string;
  className?: string;
  text?: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
  depth?: number;
}

interface BubbleEvent {
  nodeId: string;
  handler: string;
  phase: string;
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

/* ─── Data ─── */
const SAMPLE_DOM: DOMNode = {
  tag: 'html',
  children: [
    {
      tag: 'head',
      children: [
        { tag: 'title', text: 'My Page' },
        { tag: 'meta', attributes: { charset: 'utf-8' } },
      ],
    },
    {
      tag: 'body',
      children: [
        {
          tag: 'header', id: 'header',
          children: [
            { tag: 'h1', className: 'title', text: 'Welcome' },
            {
              tag: 'nav',
              children: [
                { tag: 'a', attributes: { href: '/' }, text: 'Home' },
                { tag: 'a', attributes: { href: '/about' }, text: 'About' },
              ],
            },
          ],
        },
        {
          tag: 'main', id: 'content',
          children: [
            { tag: 'h2', text: 'Article Title' },
            { tag: 'p', className: 'intro', text: 'This is an introduction paragraph.' },
            {
              tag: 'div', className: 'card',
              children: [
                { tag: 'img', attributes: { src: 'photo.jpg', alt: 'A photo' } },
                { tag: 'p', text: 'Card description text.' },
                { tag: 'button', id: 'btn', text: 'Click Me' },
              ],
            },
          ],
        },
        {
          tag: 'footer',
          children: [
            { tag: 'p', text: 'Copyright 2024' },
          ],
        },
      ],
    },
  ],
};

// Event bubbling DOM structure (nested for click events)
const BUBBLING_DOM: DOMNode = {
  tag: 'div', id: 'app', className: 'app-container',
  children: [
    {
      tag: 'section', id: 'section', className: 'content-section',
      children: [
        {
          tag: 'div', id: 'card', className: 'card',
          children: [
            {
              tag: 'div', id: 'card-body', className: 'card-body',
              children: [
                { tag: 'h3', id: 'title', text: 'Card Title' },
                { tag: 'p', id: 'text', text: 'Some card text here.' },
                { tag: 'button', id: 'action-btn', text: 'Click Me!' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const BUBBLE_HANDLERS: Record<string, string> = {
  'app': 'div#app: onClick - "App clicked!"',
  'section': 'section: onClick - "Section clicked!"',
  'card': 'div.card: onClick - "Card clicked!"',
  'card-body': 'div.card-body: onClick - "Card body clicked!"',
  'title': 'h3: onClick - "Title clicked!"',
  'text': 'p: onClick - "Text clicked!"',
  'action-btn': 'button: onClick - "Button clicked!"',
};

const SCENARIOS: { key: Scenario; label: string; description: string }[] = [
  { key: 'tree', label: 'DOM Tree', description: 'Explore the Document Object Model tree structure' },
  { key: 'bubbling', label: 'Event Bubbling', description: 'Watch events propagate through the DOM hierarchy' },
  { key: 'boxmodel', label: 'CSS Box Model', description: 'Understand content, padding, border, and margin' },
];

/* ─── Node Colors ─── */
const NODE_COLORS: Record<string, string> = {
  element: '#3b82f6',
  text: '#10b981',
  attribute: '#f59e0b',
  void: '#8b5cf6',
};

const VOID_ELEMENTS = new Set(['img', 'meta', 'br', 'hr', 'input', 'link']);

/* ─── Component ─── */
export default function DOMVisualizer() {
  const isMobile = useIsMobile();
  const [scenario, setScenario] = useState<Scenario>('tree');
  const [selectedNode, setSelectedNode] = useState<DOMNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['html', 'body', 'head', 'header', 'main', 'nav', 'div.card', 'footer']));

  // Event Bubbling state
  const [bubbleTarget, setBubbleTarget] = useState<string | null>(null);
  const [bubblePath, setBubblePath] = useState<BubbleEvent[]>([]);
  const [bubbleStep, setBubbleStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number | null>(null);

  // Box Model state
  const [boxContent, setBoxContent] = useState({ width: 200, height: 100 });
  const [boxPadding, setBoxPadding] = useState({ top: 20, right: 30, bottom: 20, left: 30 });
  const [boxBorder, setBoxBorder] = useState({ top: 3, right: 3, bottom: 3, left: 3 });
  const [boxMargin, setBoxMargin] = useState({ top: 15, right: 20, bottom: 15, left: 20 });

  // Generate node ID for tree
  const getNodeId = (node: DOMNode, parentPath = ''): string => {
    const base = node.id ? `${node.tag}#${node.id}` : node.className ? `${node.tag}.${node.className}` : node.tag;
    return parentPath ? `${parentPath}>${base}` : base;
  };

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // Event bubbling logic
  const getBubblePath = useCallback((targetId: string): BubbleEvent[] => {
    const path: BubbleEvent[] = [];
    // Build path from target to root
    const findPath = (node: DOMNode, ancestors: DOMNode[]): boolean => {
      if (node.id === targetId) {
        const fullPath = [...ancestors, node];
        // Capturing phase (root to target)
        for (let i = 0; i < fullPath.length - 1; i++) {
          const n = fullPath[i];
          if (n.id && BUBBLE_HANDLERS[n.id]) {
            path.push({ nodeId: n.id, handler: BUBBLE_HANDLERS[n.id], phase: 'Capturing' });
          }
        }
        // Target phase
        path.push({ nodeId: targetId, handler: BUBBLE_HANDLERS[targetId] || `${node.tag}: no handler`, phase: 'Target' });
        // Bubbling phase (target parent to root)
        for (let i = fullPath.length - 2; i >= 0; i--) {
          const n = fullPath[i];
          if (n.id && BUBBLE_HANDLERS[n.id]) {
            path.push({ nodeId: n.id, handler: BUBBLE_HANDLERS[n.id], phase: 'Bubbling' });
          }
        }
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findPath(child, [...ancestors, node])) return true;
        }
      }
      return false;
    };
    findPath(BUBBLING_DOM, []);
    return path;
  }, []);

  const triggerBubble = useCallback((targetId: string) => {
    if (isAnimating) return;
    const path = getBubblePath(targetId);
    setBubbleTarget(targetId);
    setBubblePath(path);
    setBubbleStep(-1);
    setIsAnimating(true);

    let step = 0;
    const advance = () => {
      if (step >= path.length) {
        setIsAnimating(false);
        return;
      }
      setBubbleStep(step);
      step++;
      animRef.current = window.setTimeout(advance, 700);
    };
    animRef.current = window.setTimeout(advance, 300);
  }, [isAnimating, getBubblePath]);

  useEffect(() => {
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  // Generate HTML string for display
  const generateHTML = (node: DOMNode, indent = 0): string => {
    const pad = '  '.repeat(indent);
    let attrs = '';
    if (node.id) attrs += ` id="${node.id}"`;
    if (node.className) attrs += ` class="${node.className}"`;
    if (node.attributes) {
      for (const [key, val] of Object.entries(node.attributes)) {
        attrs += ` ${key}="${val}"`;
      }
    }

    if (VOID_ELEMENTS.has(node.tag)) {
      return `${pad}<${node.tag}${attrs} />`;
    }

    if (node.text && (!node.children || node.children.length === 0)) {
      return `${pad}<${node.tag}${attrs}>${node.text}</${node.tag}>`;
    }

    const lines = [`${pad}<${node.tag}${attrs}>`];
    if (node.text) lines.push(`${pad}  ${node.text}`);
    if (node.children) {
      for (const child of node.children) {
        lines.push(generateHTML(child, indent + 1));
      }
    }
    lines.push(`${pad}</${node.tag}>`);
    return lines.join('\n');
  };

  // Render DOM Tree
  const renderTreeNode = (node: DOMNode, depth = 0, parentPath = ''): JSX.Element => {
    const nodeId = getNodeId(node, parentPath);
    const hasChildren = (node.children && node.children.length > 0) || !!node.text;
    const isExpanded = expandedNodes.has(nodeId);
    const isSelected = selectedNode === node;
    const isVoid = VOID_ELEMENTS.has(node.tag);
    const nodeColor = isVoid ? NODE_COLORS.void : NODE_COLORS.element;

    return (
      <div key={nodeId} style={{ marginLeft: depth > 0 ? (isMobile ? 12 : 18) : 0 }}>
        <div
          onClick={() => {
            setSelectedNode(node);
            if (hasChildren && !isVoid) toggleExpand(nodeId);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.2rem 0.4rem',
            borderRadius: 4,
            cursor: 'pointer',
            background: isSelected ? `${nodeColor}22` : 'transparent',
            border: isSelected ? `1px solid ${nodeColor}44` : '1px solid transparent',
            marginBottom: '0.1rem',
            transition: 'all 0.15s',
          }}
        >
          {/* Expand/collapse */}
          {hasChildren && !isVoid ? (
            <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', flexShrink: 0 }}>
              {isExpanded ? '\u25BC' : '\u25B6'}
            </span>
          ) : (
            <span style={{ width: 14 }} />
          )}

          {/* Node type dot */}
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor, flexShrink: 0 }} />

          {/* Tag name */}
          <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 600, color: nodeColor }}>
            {'<'}{node.tag}
            {node.id && <span style={{ color: NODE_COLORS.attribute }}> #{node.id}</span>}
            {node.className && <span style={{ color: '#ec4899' }}> .{node.className}</span>}
            {node.attributes && Object.entries(node.attributes).map(([k, v]) => (
              <span key={k} style={{ color: NODE_COLORS.attribute }}> {k}=<span style={{ color: '#10b981' }}>"{v}"</span></span>
            ))}
            {isVoid ? ' />' : '>'}
          </span>

          {/* Inline text */}
          {node.text && !node.children && (
            <span style={{ fontSize: '0.72rem', color: NODE_COLORS.text, fontFamily: 'monospace' }}>
              {node.text.length > 25 ? node.text.slice(0, 25) + '...' : node.text}
            </span>
          )}
        </div>

        {/* Children */}
        {isExpanded && !isVoid && (
          <>
            {node.text && node.children && node.children.length > 0 && (
              <div style={{ marginLeft: isMobile ? 12 : 18, padding: '0.1rem 0.4rem' }}>
                <span style={{ fontSize: '0.72rem', color: NODE_COLORS.text, fontFamily: 'monospace' }}>
                  "{node.text}"
                </span>
              </div>
            )}
            {node.children?.map((child) => renderTreeNode(child, depth + 1, nodeId))}
          </>
        )}
      </div>
    );
  };

  // Render Event Bubbling
  const renderBubbleNode = (node: DOMNode, depth = 0): JSX.Element => {
    const id = node.id || '';
    const isOnPath = bubblePath.some((e) => e.nodeId === id);
    const currentEvent = bubbleStep >= 0 ? bubblePath[bubbleStep] : null;
    const isActive = currentEvent?.nodeId === id;
    const phase = currentEvent?.phase;

    const phaseColor = phase === 'Capturing' ? '#8b5cf6' : phase === 'Target' ? '#ef4444' : '#f59e0b';

    return (
      <div key={id || node.tag + depth} style={{ marginLeft: depth > 0 ? (isMobile ? 10 : 16) : 0 }}>
        <motion.div
          onClick={() => triggerBubble(id)}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.6rem',
            borderRadius: 6,
            cursor: isAnimating ? 'default' : 'pointer',
            background: isActive ? `${phaseColor}22` : isOnPath && bubbleStep >= 0 ? 'var(--sl-color-gray-6)' : 'var(--sl-color-gray-7)',
            border: isActive ? `2px solid ${phaseColor}` : isOnPath && bubbleStep >= 0 ? '1px solid var(--sl-color-gray-4)' : '1px solid var(--sl-color-gray-5)',
            marginBottom: '0.3rem',
            transition: 'all 0.2s',
            boxShadow: isActive ? `0 0 12px ${phaseColor}33` : 'none',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 600, color: isActive ? phaseColor : 'var(--sl-color-text)' }}>
            {'<'}{node.tag}{node.id ? `#${node.id}` : ''}{node.className ? `.${node.className}` : ''}{'>'}
          </span>
          {node.text && (
            <span style={{ fontSize: '0.68rem', color: 'var(--sl-color-gray-3)' }}>{node.text}</span>
          )}
          {isActive && (
            <motion.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: phaseColor,
                background: `${phaseColor}18`,
                padding: '0.1rem 0.4rem',
                borderRadius: 4,
                marginLeft: 'auto',
              }}
            >
              {phase}
            </motion.span>
          )}
        </motion.div>
        {node.children?.map((child) => renderBubbleNode(child, depth + 1))}
      </div>
    );
  };

  // Box model slider helper
  const boxSlider = (label: string, value: number, onChange: (v: number) => void, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color, minWidth: 60 }}>{label}</span>
      <input type="range" min={0} max={50} value={value} onChange={(e) => onChange(+e.target.value)} style={{ flex: 1, maxWidth: 120 }} />
      <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color, minWidth: 28, textAlign: 'right' }}>{value}px</span>
    </div>
  );

  const totalWidth = boxMargin.left + boxBorder.left + boxPadding.left + boxContent.width + boxPadding.right + boxBorder.right + boxMargin.right;
  const totalHeight = boxMargin.top + boxBorder.top + boxPadding.top + boxContent.height + boxPadding.bottom + boxBorder.bottom + boxMargin.bottom;

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>DOM Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Explore DOM tree structure, event bubbling, and the CSS box model
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Scenario tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setScenario(s.key); setSelectedNode(null); setBubbleStep(-1); setBubblePath([]); setIsAnimating(false); }}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 6,
                minHeight: 44,
                border: scenario === s.key ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                background: scenario === s.key ? '#0066cc' : 'transparent',
                color: scenario === s.key ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--sl-color-gray-3)', margin: '0 0 1rem' }}>
          {SCENARIOS.find((s) => s.key === scenario)?.description}
        </p>

        {/* ── DOM Tree Scenario ── */}
        {scenario === 'tree' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            {/* Tree view */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                DOM Tree
              </div>
              <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid var(--sl-color-gray-5)', maxHeight: 400, overflowY: 'auto' }}>
                {renderTreeNode(SAMPLE_DOM)}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--sl-color-gray-3)', textTransform: 'capitalize' }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* HTML code panel */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                HTML Source
              </div>
              <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid var(--sl-color-gray-5)', maxHeight: 400, overflowY: 'auto' }}>
                <pre style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  fontFamily: "'Fira Code', monospace",
                  lineHeight: 1.6,
                  color: '#c9d1d9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {generateHTML(SAMPLE_DOM)}
                </pre>
              </div>

              {/* Selected node info */}
              <AnimatePresence mode="wait">
                {selectedNode && (
                  <motion.div
                    key={selectedNode.tag + (selectedNode.id || '')}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#3b82f612',
                      border: '1px solid #3b82f644',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.3rem' }}>
                      Selected: {'<'}{selectedNode.tag}{selectedNode.id ? `#${selectedNode.id}` : ''}{'>'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-2)' }}>
                      <strong>Type:</strong> {VOID_ELEMENTS.has(selectedNode.tag) ? 'Void Element' : 'Element'}<br />
                      {selectedNode.id && <><strong>ID:</strong> {selectedNode.id}<br /></>}
                      {selectedNode.className && <><strong>Class:</strong> {selectedNode.className}<br /></>}
                      {selectedNode.text && <><strong>Text:</strong> "{selectedNode.text}"<br /></>}
                      {selectedNode.children && <><strong>Children:</strong> {selectedNode.children.length} child node(s)<br /></>}
                      {selectedNode.attributes && (
                        <>
                          <strong>Attributes:</strong>{' '}
                          {Object.entries(selectedNode.attributes).map(([k, v]) => `${k}="${v}"`).join(', ')}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Event Bubbling Scenario ── */}
        {scenario === 'bubbling' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            {/* Interactive tree */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Click an element to trigger an event
              </div>
              <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid var(--sl-color-gray-5)' }}>
                {renderBubbleNode(BUBBLING_DOM)}
              </div>

              {/* Reset button */}
              <button
                onClick={() => { setBubbleStep(-1); setBubblePath([]); setBubbleTarget(null); setIsAnimating(false); if (animRef.current) clearTimeout(animRef.current); }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-text)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>

              {/* Phase legend */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {[{ phase: 'Capturing', color: '#8b5cf6' }, { phase: 'Target', color: '#ef4444' }, { phase: 'Bubbling', color: '#f59e0b' }].map((p) => (
                  <div key={p.phase} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: p.color }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--sl-color-gray-3)' }}>{p.phase}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event log */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Event Propagation Log
              </div>
              <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid var(--sl-color-gray-5)', minHeight: 200 }}>
                {bubblePath.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-4)', textAlign: 'center', padding: '2rem 0' }}>
                    Click an element on the left to see event propagation
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#10b981', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      Event: click on {'<'}{BUBBLING_DOM.children?.find((n) => {
                        const find = (node: DOMNode): DOMNode | null => {
                          if (node.id === bubbleTarget) return node;
                          if (node.children) for (const c of node.children) { const r = find(c); if (r) return r; }
                          return null;
                        };
                        return find(n);
                      })?.tag || bubbleTarget}{'>'}
                    </div>
                    {bubblePath.map((event, i) => {
                      const phaseColor = event.phase === 'Capturing' ? '#8b5cf6' : event.phase === 'Target' ? '#ef4444' : '#f59e0b';
                      const isReached = i <= bubbleStep;
                      const isCurrent = i === bubbleStep;

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isReached ? 1 : 0.3 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.3rem 0.5rem',
                            marginBottom: '0.2rem',
                            borderRadius: 4,
                            background: isCurrent ? `${phaseColor}18` : 'transparent',
                            border: isCurrent ? `1px solid ${phaseColor}44` : '1px solid transparent',
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                          }}
                        >
                          <span style={{ color: phaseColor, fontWeight: 700, minWidth: 70 }}>[{event.phase}]</span>
                          <span style={{ color: '#c9d1d9' }}>{event.handler}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'var(--sl-color-gray-6)',
                borderRadius: '0.5rem',
                border: '1px solid var(--sl-color-gray-5)',
                fontSize: '0.78rem',
                color: 'var(--sl-color-gray-2)',
                lineHeight: 1.6,
              }}>
                <strong>How Event Bubbling Works:</strong><br />
                1. <span style={{ color: '#8b5cf6' }}>Capturing Phase</span>: Event travels from the root down to the target element.<br />
                2. <span style={{ color: '#ef4444' }}>Target Phase</span>: Event reaches the element that was clicked.<br />
                3. <span style={{ color: '#f59e0b' }}>Bubbling Phase</span>: Event bubbles back up to the root, triggering handlers along the way.
              </div>
            </div>
          </div>
        )}

        {/* ── CSS Box Model Scenario ── */}
        {scenario === 'boxmodel' && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            {/* Visual box model */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>
                Box Model Visualization
              </div>

              <div style={{
                background: 'var(--sl-color-gray-7)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid var(--sl-color-gray-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                overflow: 'auto',
              }}>
                {/* Margin box */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      background: '#f59e0b22',
                      border: '1px dashed #f59e0b44',
                      padding: `${boxMargin.top}px ${boxMargin.right}px ${boxMargin.bottom}px ${boxMargin.left}px`,
                      position: 'relative',
                    }}
                  >
                    {/* Margin label */}
                    <span style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700 }}>margin</span>

                    {/* Border box */}
                    <div style={{
                      borderTop: `${boxBorder.top}px solid #8b5cf6`,
                      borderRight: `${boxBorder.right}px solid #8b5cf6`,
                      borderBottom: `${boxBorder.bottom}px solid #8b5cf6`,
                      borderLeft: `${boxBorder.left}px solid #8b5cf6`,
                      position: 'relative',
                    }}>
                      {/* Border label */}
                      {boxBorder.top > 0 && (
                        <span style={{ position: 'absolute', top: -boxBorder.top - 12, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#8b5cf6', fontWeight: 700 }}>border</span>
                      )}

                      {/* Padding box */}
                      <div style={{
                        background: '#10b98122',
                        padding: `${boxPadding.top}px ${boxPadding.right}px ${boxPadding.bottom}px ${boxPadding.left}px`,
                        position: 'relative',
                      }}>
                        {/* Padding label */}
                        {boxPadding.top > 10 && (
                          <span style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>padding</span>
                        )}

                        {/* Content box */}
                        <div style={{
                          width: boxContent.width,
                          height: boxContent.height,
                          background: '#3b82f622',
                          border: '1px dashed #3b82f644',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}>
                          <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700 }}>content</span>
                          <span style={{ fontSize: '0.62rem', color: '#3b82f6', fontFamily: 'monospace' }}>
                            {boxContent.width} x {boxContent.height}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dimension labels on sides */}
                  {boxMargin.left > 10 && (
                    <span style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '0.55rem', color: '#f59e0b', fontFamily: 'monospace' }}>
                      {boxMargin.left}px
                    </span>
                  )}
                  {boxMargin.right > 10 && (
                    <span style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.55rem', color: '#f59e0b', fontFamily: 'monospace' }}>
                      {boxMargin.right}px
                    </span>
                  )}
                </div>
              </div>

              {/* Total dimensions */}
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--sl-color-gray-3)', fontFamily: 'monospace', textAlign: 'center' }}>
                Total: {totalWidth}px x {totalHeight}px
              </div>
            </div>

            {/* Controls */}
            <div style={{ flex: isMobile ? 'none' : '0 0 280px', minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Adjust Values
              </div>

              {/* Content */}
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#3b82f612', borderRadius: '0.5rem', border: '1px solid #3b82f633' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.3rem' }}>Content</div>
                {boxSlider('Width', boxContent.width, (v) => setBoxContent((p) => ({ ...p, width: v })), '#3b82f6')}
                {boxSlider('Height', boxContent.height, (v) => setBoxContent((p) => ({ ...p, height: v })), '#3b82f6')}
              </div>

              {/* Padding */}
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#10b98112', borderRadius: '0.5rem', border: '1px solid #10b98133' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', marginBottom: '0.3rem' }}>Padding</div>
                {boxSlider('Top', boxPadding.top, (v) => setBoxPadding((p) => ({ ...p, top: v })), '#10b981')}
                {boxSlider('Right', boxPadding.right, (v) => setBoxPadding((p) => ({ ...p, right: v })), '#10b981')}
                {boxSlider('Bottom', boxPadding.bottom, (v) => setBoxPadding((p) => ({ ...p, bottom: v })), '#10b981')}
                {boxSlider('Left', boxPadding.left, (v) => setBoxPadding((p) => ({ ...p, left: v })), '#10b981')}
              </div>

              {/* Border */}
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#8b5cf612', borderRadius: '0.5rem', border: '1px solid #8b5cf633' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '0.3rem' }}>Border</div>
                {boxSlider('Top', boxBorder.top, (v) => setBoxBorder((p) => ({ ...p, top: v })), '#8b5cf6')}
                {boxSlider('Right', boxBorder.right, (v) => setBoxBorder((p) => ({ ...p, right: v })), '#8b5cf6')}
                {boxSlider('Bottom', boxBorder.bottom, (v) => setBoxBorder((p) => ({ ...p, bottom: v })), '#8b5cf6')}
                {boxSlider('Left', boxBorder.left, (v) => setBoxBorder((p) => ({ ...p, left: v })), '#8b5cf6')}
              </div>

              {/* Margin */}
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f59e0b12', borderRadius: '0.5rem', border: '1px solid #f59e0b33' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.3rem' }}>Margin</div>
                {boxSlider('Top', boxMargin.top, (v) => setBoxMargin((p) => ({ ...p, top: v })), '#f59e0b')}
                {boxSlider('Right', boxMargin.right, (v) => setBoxMargin((p) => ({ ...p, right: v })), '#f59e0b')}
                {boxSlider('Bottom', boxMargin.bottom, (v) => setBoxMargin((p) => ({ ...p, bottom: v })), '#f59e0b')}
                {boxSlider('Left', boxMargin.left, (v) => setBoxMargin((p) => ({ ...p, left: v })), '#f59e0b')}
              </div>

              {/* CSS output */}
              <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid var(--sl-color-gray-5)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', marginBottom: '0.25rem' }}>CSS</div>
                <pre style={{ margin: 0, fontSize: '0.68rem', fontFamily: "'Fira Code', monospace", color: '#c9d1d9', lineHeight: 1.5 }}>
{`.element {
  width: ${boxContent.width}px;
  height: ${boxContent.height}px;
  padding: ${boxPadding.top}px ${boxPadding.right}px
           ${boxPadding.bottom}px ${boxPadding.left}px;
  border: ${boxBorder.top}px solid purple;
  margin: ${boxMargin.top}px ${boxMargin.right}px
          ${boxMargin.bottom}px ${boxMargin.left}px;
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
