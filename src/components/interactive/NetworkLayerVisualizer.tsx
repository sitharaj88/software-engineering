import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModelType = 'osi' | 'tcpip';
type AnimStage = 'idle' | 'encapsulating' | 'transit' | 'decapsulating' | 'done';

interface LayerInfo {
  num: number;
  name: string;
  protocols: string;
  dataUnit: string;
  devices: string;
  description: string;
  color: string;
  adds: string;
}

const OSI_LAYERS: LayerInfo[] = [
  { num: 7, name: 'Application', protocols: 'HTTP, FTP, SMTP, DNS', dataUnit: 'Data', devices: 'Gateway, Proxy', description: 'Provides network services directly to end-user applications. Handles high-level protocols and user authentication.', color: '#ef4444', adds: 'App Header' },
  { num: 6, name: 'Presentation', protocols: 'SSL/TLS, JPEG, ASCII', dataUnit: 'Data', devices: 'Gateway', description: 'Translates data formats, handles encryption/decryption, and data compression between the application and network.', color: '#f59e0b', adds: 'Encryption' },
  { num: 5, name: 'Session', protocols: 'NetBIOS, RPC, PPTP', dataUnit: 'Data', devices: 'Gateway', description: 'Manages sessions between applications. Establishes, maintains, and terminates connections.', color: '#10b981', adds: 'Session ID' },
  { num: 4, name: 'Transport', protocols: 'TCP, UDP, SCTP', dataUnit: 'Segment', devices: 'Load Balancer', description: 'Ensures reliable end-to-end delivery with flow control, error checking, and segmentation.', color: '#0066cc', adds: 'TCP Header' },
  { num: 3, name: 'Network', protocols: 'IP, ICMP, OSPF, BGP', dataUnit: 'Packet', devices: 'Router', description: 'Handles logical addressing and routing. Determines the best path for data across networks.', color: '#8b5cf6', adds: 'IP Header' },
  { num: 2, name: 'Data Link', protocols: 'Ethernet, Wi-Fi, PPP', dataUnit: 'Frame', devices: 'Switch, Bridge', description: 'Provides node-to-node data transfer and handles error detection via MAC addressing and framing.', color: '#ec4899', adds: 'Frame H/T' },
  { num: 1, name: 'Physical', protocols: 'USB, DSL, Bluetooth', dataUnit: 'Bits', devices: 'Hub, Repeater', description: 'Transmits raw bitstream over physical medium. Defines electrical and physical specs.', color: '#6b7280', adds: 'Signal' },
];

const TCPIP_LAYERS: LayerInfo[] = [
  { num: 4, name: 'Application', protocols: 'HTTP, FTP, SMTP, DNS, SSH', dataUnit: 'Data', devices: 'Gateway, Proxy', description: 'Combines OSI layers 5-7. Provides application-level protocols and services to end users.', color: '#ef4444', adds: 'App Header' },
  { num: 3, name: 'Transport', protocols: 'TCP, UDP', dataUnit: 'Segment', devices: 'Load Balancer', description: 'End-to-end communication with reliability (TCP) or speed (UDP). Handles port-based multiplexing.', color: '#0066cc', adds: 'TCP Header' },
  { num: 2, name: 'Internet', protocols: 'IP, ICMP, ARP, IGMP', dataUnit: 'Packet', devices: 'Router', description: 'Logical addressing and routing across interconnected networks using IP addresses.', color: '#8b5cf6', adds: 'IP Header' },
  { num: 1, name: 'Network Access', protocols: 'Ethernet, Wi-Fi, PPP', dataUnit: 'Frame', devices: 'Switch, NIC', description: 'Combines OSI layers 1-2. Handles physical addressing, framing, and media access.', color: '#10b981', adds: 'Frame H/T' },
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

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'var(--sl-color-gray-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
};

export default function NetworkLayerVisualizer() {
  const [model, setModel] = useState<ModelType>('osi');
  const [stage, setStage] = useState<AnimStage>('idle');
  const [activeLayerIdx, setActiveLayerIdx] = useState(-1);
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [speed, setSpeed] = useState(50);
  const [encapHeaders, setEncapHeaders] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const layers = model === 'osi' ? OSI_LAYERS : TCPIP_LAYERS;
  const stepDelay = Math.max(200, 1200 - speed * 10);

  const reset = useCallback(() => {
    setStage('idle');
    setActiveLayerIdx(-1);
    setEncapHeaders([]);
    setSelectedLayer(null);
  }, []);

  const runAnimation = useCallback(async () => {
    const currentLayers = model === 'osi' ? OSI_LAYERS : TCPIP_LAYERS;
    const delay = Math.max(200, 1200 - speed * 10);
    setStage('encapsulating');
    setEncapHeaders([]);

    for (let i = 0; i < currentLayers.length; i++) {
      setActiveLayerIdx(i);
      setEncapHeaders((prev) => [...prev, currentLayers[i].adds]);
      await new Promise((r) => setTimeout(r, delay));
    }

    setStage('transit');
    setActiveLayerIdx(-1);
    await new Promise((r) => setTimeout(r, delay * 1.5));

    setStage('decapsulating');
    for (let i = currentLayers.length - 1; i >= 0; i--) {
      setActiveLayerIdx(i);
      setEncapHeaders((prev) => prev.slice(0, -1));
      await new Promise((r) => setTimeout(r, delay));
    }

    setStage('done');
    setActiveLayerIdx(-1);
  }, [model, speed]);

  const handleSend = useCallback(() => {
    if (stage !== 'idle' && stage !== 'done') return;
    reset();
    setTimeout(() => runAnimation(), 50);
  }, [stage, reset, runAnimation]);

  const container: React.CSSProperties = {
    border: '1px solid var(--sl-color-gray-5)',
    borderRadius: '12px',
    padding: '1.25rem',
    fontFamily: 'system-ui, sans-serif',
    color: 'var(--sl-color-gray-1, #e2e8f0)',
    background: 'var(--sl-color-gray-6)',
    overflow: 'hidden',
  };

  const heading: React.CSSProperties = {
    fontSize: isMobile ? '1rem' : '1.2rem',
    fontWeight: 700,
    marginBottom: '1rem',
    textAlign: 'center',
  };

  const controlBar: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  };

  const btn = (bg: string, disabled = false): React.CSSProperties => ({
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
  });

  const toggleBtn = (active: boolean): React.CSSProperties => ({
    ...btn(active ? '#0066cc' : 'var(--sl-color-gray-5)'),
    opacity: 1,
    cursor: 'pointer',
  });

  const twoCol: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '1rem',
    alignItems: 'stretch',
  };

  const colStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const layerBox = (layer: LayerInfo, idx: number, side: 'sender' | 'receiver'): React.CSSProperties => {
    const isActive =
      (stage === 'encapsulating' && side === 'sender' && idx === activeLayerIdx) ||
      (stage === 'decapsulating' && side === 'receiver' && idx === activeLayerIdx);
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.45rem 0.6rem',
      borderRadius: '6px',
      border: `2px solid ${isActive ? layer.color : 'transparent'}`,
      background: isActive ? `${layer.color}22` : 'var(--sl-color-gray-5)',
      cursor: 'pointer',
      transition: 'all 0.25s',
      marginBottom: '0.3rem',
      boxShadow: isActive ? `0 0 12px ${layer.color}55` : 'none',
    };
  };

  const layerNum: (color: string) => React.CSSProperties = (color) => ({
    width: '1.6rem',
    height: '1.6rem',
    borderRadius: '50%',
    background: color,
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.72rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const layerName: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '0.78rem',
    lineHeight: 1.2,
  };

  const layerProto: React.CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--sl-color-gray-3)',
    lineHeight: 1.2,
  };

  const packetArea: React.CSSProperties = {
    margin: '1rem 0',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'var(--sl-color-gray-5)',
    minHeight: '3.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '0.2rem',
  };

  const headerChip = (color: string): React.CSSProperties => ({
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    background: `${color}33`,
    border: `1px solid ${color}`,
    fontSize: '0.65rem',
    fontWeight: 600,
    color,
    whiteSpace: 'nowrap',
  });

  const detailPanel: React.CSSProperties = {
    marginTop: '1rem',
    padding: '0.9rem',
    borderRadius: '8px',
    background: 'var(--sl-color-gray-5)',
    border: '1px solid var(--sl-color-gray-5)',
  };

  const detailTitle: React.CSSProperties = {
    fontSize: '0.9rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const detailRow: React.CSSProperties = {
    fontSize: '0.75rem',
    marginBottom: '0.3rem',
    lineHeight: 1.5,
    color: 'var(--sl-color-gray-3)',
  };

  const renderLayerStack = (side: 'sender' | 'receiver') => (
    <div style={colStyle}>
      <div style={sectionLabel}>{side === 'sender' ? 'Sender (Encapsulation)' : 'Receiver (Decapsulation)'}</div>
      {layers.map((layer, idx) => (
        <motion.div
          key={`${model}-${side}-${layer.num}`}
          style={layerBox(layer, idx, side)}
          onClick={() => setSelectedLayer(selectedLayer?.num === layer.num ? null : layer)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: side === 'sender' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <div style={layerNum(layer.color)}>{layer.num}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={layerName}>{layer.name}</div>
            <div style={layerProto}>{layer.protocols}</div>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--sl-color-gray-3)', textAlign: 'right' }}>
            {layer.dataUnit}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const packetColors = layers.map((l) => l.color);

  const renderPacketView = () => {
    if (stage === 'idle') {
      return <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>Click "Send Data" to start encapsulation</span>;
    }
    if (stage === 'done') {
      return (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}
        >
          Data delivered successfully!
        </motion.span>
      );
    }
    if (stage === 'transit') {
      return (
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          animate={{ x: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>
            Transmitting across network...
          </span>
          {encapHeaders.map((h, i) => (
            <span key={i} style={headerChip(packetColors[i] || '#888')}>{h}</span>
          ))}
        </motion.div>
      );
    }

    return (
      <AnimatePresence mode="popLayout">
        {encapHeaders.length > 0 && [...encapHeaders].reverse().map((h, ri) => {
          const origIdx = encapHeaders.length - 1 - ri;
          return (
            <motion.span
              key={`${h}-${origIdx}`}
              style={headerChip(packetColors[origIdx] || '#888')}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {h}
            </motion.span>
          );
        })}
        <motion.span
          key="payload"
          style={{
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            background: '#0066cc44',
            border: '1px solid #0066cc',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#0066cc',
          }}
          layout
        >
          DATA
        </motion.span>
        {stage === 'encapsulating' && encapHeaders.length >= layers.length - 1 && (
          <motion.span
            key="trailer"
            style={headerChip(packetColors[layers.length - 1] || '#888')}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            Trailer
          </motion.span>
        )}
      </AnimatePresence>
    );
  };

  const stageLabel = (): string => {
    switch (stage) {
      case 'idle': return 'Ready';
      case 'encapsulating': return `Encapsulating at Layer ${layers[activeLayerIdx]?.name ?? ''}`;
      case 'transit': return 'In Transit';
      case 'decapsulating': return `Decapsulating at Layer ${layers[activeLayerIdx]?.name ?? ''}`;
      case 'done': return 'Delivered';
    }
  };

  const isRunning = stage === 'encapsulating' || stage === 'transit' || stage === 'decapsulating';

  return (
    <div style={container}>
      <div style={heading}>
        {model === 'osi' ? 'OSI Model' : 'TCP/IP Model'} &mdash; Packet Encapsulation
      </div>

      <div style={controlBar}>
        <button style={toggleBtn(model === 'osi')} onClick={() => { if (!isRunning) { setModel('osi'); reset(); } }}>
          OSI (7 Layers)
        </button>
        <button style={toggleBtn(model === 'tcpip')} onClick={() => { if (!isRunning) { setModel('tcpip'); reset(); } }}>
          TCP/IP (4 Layers)
        </button>

        <span style={{ width: '1px', height: '1.4rem', background: 'var(--sl-color-gray-5)', margin: '0 0.2rem' }} />

        <button style={btn('#10b981', isRunning)} onClick={handleSend} disabled={isRunning}>
          Send Data
        </button>
        <button style={btn('#ef4444', isRunning)} onClick={reset} disabled={isRunning}>
          Reset
        </button>

        <span style={{ width: '1px', height: '1.4rem', background: 'var(--sl-color-gray-5)', margin: '0 0.2rem' }} />

        <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--sl-color-gray-3)' }}>
          Speed
          <input
            type="range"
            min={10}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={isRunning}
            style={{ width: '5rem', accentColor: '#0066cc' }}
          />
        </label>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '0.5rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: isRunning ? '#f59e0b' : stage === 'done' ? '#10b981' : 'var(--sl-color-gray-3)',
      }}>
        {stageLabel()}
      </div>

      <div style={packetArea}>
        {renderPacketView()}
      </div>

      <div style={twoCol}>
        {renderLayerStack('sender')}

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          padding: '0 0.3rem',
          minWidth: isMobile ? undefined : '2.5rem',
        }}>
          <motion.div
            animate={isRunning ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.5 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ fontSize: '1.2rem' }}
          >
            {isMobile ? (stage === 'decapsulating' ? '\u2191' : '\u2193') : (stage === 'decapsulating' ? '\u2190' : '\u2192')}
          </motion.div>
          <div style={{
            width: isMobile ? '3rem' : '2px',
            height: isMobile ? '2px' : '3rem',
            background: isRunning ? '#f59e0b' : 'var(--sl-color-gray-5)',
            transition: 'background 0.3s',
          }} />
          <motion.div
            animate={isRunning ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.5 }}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
            style={{ fontSize: '1.2rem' }}
          >
            {isMobile ? (stage === 'decapsulating' ? '\u2191' : '\u2193') : (stage === 'decapsulating' ? '\u2190' : '\u2192')}
          </motion.div>
        </div>

        {renderLayerStack('receiver')}
      </div>

      <AnimatePresence>
        {selectedLayer && (
          <motion.div
            key={selectedLayer.num}
            style={detailPanel}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={detailTitle}>
              <span style={{
                width: '1.4rem',
                height: '1.4rem',
                borderRadius: '50%',
                background: selectedLayer.color,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {selectedLayer.num}
              </span>
              Layer {selectedLayer.num}: {selectedLayer.name}
            </div>
            <div style={detailRow}>{selectedLayer.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1rem', marginTop: '0.5rem' }}>
              <div style={detailRow}><strong>Protocols:</strong> {selectedLayer.protocols}</div>
              <div style={detailRow}><strong>Data Unit:</strong> {selectedLayer.dataUnit}</div>
              <div style={detailRow}><strong>Devices:</strong> {selectedLayer.devices}</div>
              <div style={detailRow}><strong>Adds:</strong> {selectedLayer.adds}</div>
            </div>
            <button
              onClick={() => setSelectedLayer(null)}
              style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--sl-color-gray-5)',
                background: 'transparent',
                color: 'var(--sl-color-gray-3)',
                fontSize: '0.7rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
