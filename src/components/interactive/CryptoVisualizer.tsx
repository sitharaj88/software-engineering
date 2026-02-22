import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
type Scenario = 'symmetric' | 'asymmetric' | 'tls' | 'hashing';

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

/* ─── Simple visual "encryption" helpers ─── */
function simpleEncrypt(text: string, key: number): string {
  return text
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        return String.fromCharCode(((code - 32 + key) % 95) + 32);
      }
      return ch;
    })
    .join('');
}

function simpleHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(16, '0');
}

function toHexDisplay(text: string): string {
  return text
    .split('')
    .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}

/* ─── TLS Handshake Steps ─── */
interface TLSStep {
  label: string;
  sender: 'client' | 'server' | 'both';
  description: string;
  detail: string;
  color: string;
}

const TLS_STEPS: TLSStep[] = [
  {
    label: 'ClientHello',
    sender: 'client',
    description: 'Client initiates the handshake',
    detail: 'Client sends: supported TLS versions (1.3), cipher suites (AES-256-GCM, ChaCha20), client random nonce, and supported key exchange groups.',
    color: '#3b82f6',
  },
  {
    label: 'ServerHello',
    sender: 'server',
    description: 'Server responds with chosen parameters',
    detail: 'Server selects: TLS 1.3, cipher suite AES-256-GCM-SHA384, server random nonce, and chosen key share group (x25519).',
    color: '#10b981',
  },
  {
    label: 'Server Certificate',
    sender: 'server',
    description: 'Server proves its identity',
    detail: 'Server sends its X.509 certificate chain. Client validates the certificate against trusted Certificate Authorities (CAs).',
    color: '#10b981',
  },
  {
    label: 'Key Exchange',
    sender: 'both',
    description: 'Both sides compute shared secret',
    detail: 'Using Elliptic Curve Diffie-Hellman (ECDHE), both parties independently compute the same shared secret without ever transmitting it.',
    color: '#f59e0b',
  },
  {
    label: 'Session Keys Derived',
    sender: 'both',
    description: 'Encryption keys are generated',
    detail: 'Using HKDF (HMAC-based Key Derivation Function), both sides derive symmetric session keys from the shared secret for encrypting application data.',
    color: '#8b5cf6',
  },
  {
    label: 'Encrypted Communication',
    sender: 'both',
    description: 'All data is now encrypted',
    detail: 'Application data is encrypted using AES-256-GCM with the derived session keys. Both sides can now exchange data securely.',
    color: '#ef4444',
  },
];

/* ─── Scenario Definitions ─── */
const SCENARIOS: { key: Scenario; label: string; description: string }[] = [
  { key: 'symmetric', label: 'Symmetric Encryption', description: 'Same key encrypts and decrypts - like a shared padlock' },
  { key: 'asymmetric', label: 'Asymmetric Encryption', description: 'Public key encrypts, private key decrypts - like a mailbox' },
  { key: 'tls', label: 'TLS Handshake', description: 'How browsers establish secure HTTPS connections' },
  { key: 'hashing', label: 'Hashing', description: 'One-way transformation - demonstrate the avalanche effect' },
];

/* ─── Component ─── */
export default function CryptoVisualizer() {
  const isMobile = useIsMobile();
  const [scenario, setScenario] = useState<Scenario>('symmetric');

  // Symmetric state
  const [symPlaintext, setSymPlaintext] = useState('Hello, World!');
  const [symKey, setSymKey] = useState(7);
  const [symAnimStep, setSymAnimStep] = useState(-1);
  const [symIsAnimating, setSymIsAnimating] = useState(false);

  // Asymmetric state
  const [asymPlaintext, setAsymPlaintext] = useState('Secret message');
  const [asymStep, setAsymStep] = useState(-1);
  const [asymIsAnimating, setAsymIsAnimating] = useState(false);

  // TLS state
  const [tlsStep, setTlsStep] = useState(-1);
  const [tlsIsAnimating, setTlsIsAnimating] = useState(false);

  // Hashing state
  const [hashInput1, setHashInput1] = useState('Hello');
  const [hashInput2, setHashInput2] = useState('Hellp');

  const animRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  // Symmetric animation
  const runSymmetricAnim = useCallback(() => {
    if (symIsAnimating) return;
    setSymIsAnimating(true);
    setSymAnimStep(0);
    let step = 0;
    const advance = () => {
      step++;
      if (step > 3) {
        setSymIsAnimating(false);
        return;
      }
      setSymAnimStep(step);
      animRef.current = window.setTimeout(advance, 1200);
    };
    animRef.current = window.setTimeout(advance, 1200);
  }, [symIsAnimating]);

  // Asymmetric animation
  const runAsymmetricAnim = useCallback(() => {
    if (asymIsAnimating) return;
    setAsymIsAnimating(true);
    setAsymStep(0);
    let step = 0;
    const advance = () => {
      step++;
      if (step > 5) {
        setAsymIsAnimating(false);
        return;
      }
      setAsymStep(step);
      animRef.current = window.setTimeout(advance, 1200);
    };
    animRef.current = window.setTimeout(advance, 1200);
  }, [asymIsAnimating]);

  // TLS animation
  const runTLSAnim = useCallback(() => {
    if (tlsIsAnimating) return;
    setTlsIsAnimating(true);
    setTlsStep(0);
    let step = 0;
    const advance = () => {
      step++;
      if (step >= TLS_STEPS.length) {
        setTlsIsAnimating(false);
        return;
      }
      setTlsStep(step);
      animRef.current = window.setTimeout(advance, 1500);
    };
    animRef.current = window.setTimeout(advance, 1500);
  }, [tlsIsAnimating]);

  const resetAnim = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    setSymAnimStep(-1);
    setSymIsAnimating(false);
    setAsymStep(-1);
    setAsymIsAnimating(false);
    setTlsStep(-1);
    setTlsIsAnimating(false);
  }, []);

  const ciphertext = simpleEncrypt(symPlaintext, symKey);
  const asymCiphertext = simpleEncrypt(asymPlaintext, 13);
  const hash1 = simpleHash(hashInput1);
  const hash2 = simpleHash(hashInput2);

  // Count differing chars in hash
  const hashDiffCount = hash1.split('').filter((ch, i) => ch !== hash2[i]).length;
  const hashDiffPercent = Math.round((hashDiffCount / hash1.length) * 100);

  const dataBox = (label: string, content: string, color: string, isActive = false): JSX.Element => (
    <motion.div
      animate={isActive ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.5 }}
      style={{
        background: `${color}12`,
        border: `2px solid ${isActive ? color : `${color}44`}`,
        borderRadius: '0.5rem',
        padding: '0.6rem 0.75rem',
        boxShadow: isActive ? `0 0 12px ${color}33` : 'none',
        transition: 'all 0.3s',
      }}
    >
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--sl-color-text)', wordBreak: 'break-all', lineHeight: 1.5 }}>
        {content}
      </div>
    </motion.div>
  );

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Cryptography Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Explore symmetric & asymmetric encryption, TLS handshakes, and hashing
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Scenario tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setScenario(s.key); resetAnim(); }}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 6,
                minHeight: 44,
                border: scenario === s.key ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                background: scenario === s.key ? '#0066cc' : 'transparent',
                color: scenario === s.key ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.72rem' : '0.82rem',
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

        {/* ── Symmetric Encryption ── */}
        {scenario === 'symmetric' && (
          <div>
            {/* Input */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '0.25rem' }}>
                  Plaintext Message
                </label>
                <input
                  type="text"
                  value={symPlaintext}
                  onChange={(e) => setSymPlaintext(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 6,
                    border: '1px solid var(--sl-color-gray-4)',
                    background: 'var(--sl-color-gray-7)',
                    color: '#10b981',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: isMobile ? 'none' : '0 0 160px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '0.25rem' }}>
                  Key (shift: {symKey})
                </label>
                <input
                  type="range"
                  min={1}
                  max={94}
                  value={symKey}
                  onChange={(e) => setSymKey(+e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Animate button */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={runSymmetricAnim}
                disabled={symIsAnimating}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 6,
                  border: 'none',
                  background: symIsAnimating ? 'var(--sl-color-gray-5)' : '#0066cc',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: symIsAnimating ? 'not-allowed' : 'pointer',
                  opacity: symIsAnimating ? 0.5 : 1,
                }}
              >
                Encrypt & Decrypt
              </button>
              <button
                onClick={resetAnim}
                style={{
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
            </div>

            {/* Flow visualization */}
            <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid var(--sl-color-gray-5)' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '0.75rem' }}>
                {/* Plaintext */}
                {dataBox('Plaintext', symPlaintext, '#10b981', symAnimStep === 0)}

                {/* Arrow + Key */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--sl-color-gray-4)' }}>
                    {isMobile ? '\u2193' : '\u2192'}
                  </div>
                  <motion.div
                    animate={symAnimStep === 1 ? { scale: [1, 1.15, 1] } : {}}
                    style={{
                      background: '#f59e0b22',
                      border: `2px solid ${symAnimStep === 1 ? '#f59e0b' : '#f59e0b44'}`,
                      borderRadius: '0.5rem',
                      padding: '0.35rem 0.6rem',
                      margin: '0.25rem 0',
                      boxShadow: symAnimStep === 1 ? '0 0 12px #f59e0b33' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Key</div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>
                      shift({symKey})
                    </div>
                  </motion.div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)' }}>AES-like</div>
                  <div style={{ fontSize: '1rem', color: 'var(--sl-color-gray-4)' }}>
                    {isMobile ? '\u2193' : '\u2192'}
                  </div>
                </div>

                {/* Ciphertext */}
                {dataBox('Ciphertext', symAnimStep >= 2 ? ciphertext : '???', '#ef4444', symAnimStep === 2)}

                {/* Arrow + same Key */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--sl-color-gray-4)' }}>
                    {isMobile ? '\u2193' : '\u2192'}
                  </div>
                  <motion.div
                    animate={symAnimStep === 3 ? { scale: [1, 1.15, 1] } : {}}
                    style={{
                      background: '#f59e0b22',
                      border: `2px solid ${symAnimStep === 3 ? '#f59e0b' : '#f59e0b44'}`,
                      borderRadius: '0.5rem',
                      padding: '0.35rem 0.6rem',
                      margin: '0.25rem 0',
                      boxShadow: symAnimStep === 3 ? '0 0 12px #f59e0b33' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Same Key</div>
                    <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>
                      shift({symKey})
                    </div>
                  </motion.div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)' }}>Decrypt</div>
                  <div style={{ fontSize: '1rem', color: 'var(--sl-color-gray-4)' }}>
                    {isMobile ? '\u2193' : '\u2192'}
                  </div>
                </div>

                {/* Decrypted */}
                {dataBox('Decrypted', symAnimStep >= 3 ? symPlaintext : '???', '#10b981', symAnimStep === 3)}
              </div>

              {/* Hex representation */}
              <div style={{ marginTop: '1rem', padding: '0.6rem', background: '#0d1117', borderRadius: 6, overflowX: 'auto' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.25rem', fontWeight: 600 }}>HEX REPRESENTATION</div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'monospace' }}>
                  <span style={{ color: '#10b981' }}>Plain: </span>
                  <span style={{ color: '#c9d1d9' }}>{toHexDisplay(symPlaintext)}</span>
                </div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'monospace' }}>
                  <span style={{ color: '#ef4444' }}>Cipher: </span>
                  <span style={{ color: '#c9d1d9' }}>{toHexDisplay(ciphertext)}</span>
                </div>
              </div>
            </div>

            {/* Key concept */}
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#f59e0b12', border: '1px solid #f59e0b33', borderRadius: '0.5rem', fontSize: '0.78rem', color: 'var(--sl-color-gray-2)', lineHeight: 1.5 }}>
              <strong style={{ color: '#f59e0b' }}>Key Concept:</strong> In symmetric encryption (e.g., AES), the <strong>same key</strong> is used for both encryption and decryption. The challenge is securely sharing this key between parties.
            </div>
          </div>
        )}

        {/* ── Asymmetric Encryption ── */}
        {scenario === 'asymmetric' && (
          <div>
            {/* Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '0.25rem' }}>
                Alice's Message to Bob
              </label>
              <input
                type="text"
                value={asymPlaintext}
                onChange={(e) => setAsymPlaintext(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 400,
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  border: '1px solid var(--sl-color-gray-4)',
                  background: 'var(--sl-color-gray-7)',
                  color: '#10b981',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={runAsymmetricAnim}
                disabled={asymIsAnimating}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 6,
                  border: 'none',
                  background: asymIsAnimating ? 'var(--sl-color-gray-5)' : '#0066cc',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: asymIsAnimating ? 'not-allowed' : 'pointer',
                  opacity: asymIsAnimating ? 0.5 : 1,
                }}
              >
                Send Message
              </button>
              <button
                onClick={resetAnim}
                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', background: 'var(--sl-color-gray-5)', color: 'var(--sl-color-text)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>

            {/* Two parties visualization */}
            <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid var(--sl-color-gray-5)' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                {/* Alice */}
                <div style={{
                  flex: 1,
                  background: '#3b82f612',
                  border: `2px solid ${asymStep <= 1 ? '#3b82f6' : '#3b82f644'}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: asymStep <= 1 && asymStep >= 0 ? '0 0 12px #3b82f633' : 'none',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Alice (Sender)
                  </div>

                  <div style={{ marginBottom: '0.4rem' }}>
                    {dataBox('Her Message', asymPlaintext, '#10b981', asymStep === 0)}
                  </div>

                  <AnimatePresence>
                    {asymStep >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.2rem', textAlign: 'center' }}>
                          Encrypts with Bob's Public Key
                        </div>
                        {dataBox("Bob's Public Key", 'PUB-BOB-x25519', '#f59e0b', asymStep === 1)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Message in transit */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minWidth: isMobile ? '100%' : 120 }}>
                  <AnimatePresence>
                    {asymStep >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center' }}
                      >
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.2rem' }}>
                          {isMobile ? '\u2193 In Transit \u2193' : '\u2192 In Transit \u2192'}
                        </div>
                        {dataBox('Encrypted', asymCiphertext, '#ef4444', asymStep === 2)}
                        <div style={{ fontSize: '0.62rem', color: '#ef4444', marginTop: '0.2rem' }}>
                          Only Bob's private key can decrypt
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bob */}
                <div style={{
                  flex: 1,
                  background: '#10b98112',
                  border: `2px solid ${asymStep >= 3 ? '#10b981' : '#10b98144'}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  boxShadow: asymStep >= 3 ? '0 0 12px #10b98133' : 'none',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Bob (Receiver)
                  </div>

                  {/* Bob's key pair */}
                  <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
                    <div style={{ flex: 1 }}>
                      {dataBox('Public Key', 'PUB-BOB', '#f59e0b', false)}
                    </div>
                    <div style={{ flex: 1 }}>
                      {dataBox('Private Key', 'PRIV-BOB', '#ef4444', asymStep === 4)}
                    </div>
                  </div>

                  <AnimatePresence>
                    {asymStep >= 4 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.2rem', textAlign: 'center' }}>
                          Decrypts with his Private Key
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {asymStep >= 5 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {dataBox('Decrypted Message', asymPlaintext, '#10b981', asymStep === 5)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Step description */}
              <AnimatePresence mode="wait">
                {asymStep >= 0 && (
                  <motion.div
                    key={asymStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--sl-color-gray-6)',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      color: 'var(--sl-color-gray-2)',
                      textAlign: 'center',
                    }}
                  >
                    {[
                      'Alice writes her plaintext message.',
                      "Alice encrypts the message using Bob's public key (available to everyone).",
                      "The encrypted message travels through the network. Even if intercepted, it's unreadable.",
                      "Bob receives the encrypted message.",
                      "Bob uses his private key (known only to him) to decrypt the message.",
                      "Bob successfully reads Alice's original message!",
                    ][asymStep]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#8b5cf612', border: '1px solid #8b5cf633', borderRadius: '0.5rem', fontSize: '0.78rem', color: 'var(--sl-color-gray-2)', lineHeight: 1.5 }}>
              <strong style={{ color: '#8b5cf6' }}>Key Concept:</strong> Asymmetric encryption (e.g., RSA, ECC) uses a <strong>key pair</strong>: a public key for encryption and a private key for decryption. The public key can be shared freely; only the private key can decrypt messages.
            </div>
          </div>
        )}

        {/* ── TLS Handshake ── */}
        {scenario === 'tls' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={runTLSAnim}
                disabled={tlsIsAnimating}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 6,
                  border: 'none',
                  background: tlsIsAnimating ? 'var(--sl-color-gray-5)' : '#0066cc',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: tlsIsAnimating ? 'not-allowed' : 'pointer',
                  opacity: tlsIsAnimating ? 0.5 : 1,
                }}
              >
                Start Handshake
              </button>
              <button
                onClick={() => {
                  setTlsStep((prev) => {
                    if (prev < TLS_STEPS.length - 1) return prev + 1;
                    return prev;
                  });
                  setTlsIsAnimating(false);
                  if (animRef.current) clearTimeout(animRef.current);
                }}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 6,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Step
              </button>
              <button
                onClick={resetAnim}
                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', background: 'var(--sl-color-gray-5)', color: 'var(--sl-color-text)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>

            <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid var(--sl-color-gray-5)' }}>
              {/* Client / Server columns */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{
                  background: '#3b82f622',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>Client</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--sl-color-gray-3)' }}>Browser</div>
                </div>
                <div style={{
                  background: '#10b98122',
                  border: '2px solid #10b981',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>Server</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--sl-color-gray-3)' }}>Website</div>
                </div>
              </div>

              {/* Steps */}
              {TLS_STEPS.map((step, i) => {
                const isReached = i <= tlsStep;
                const isCurrent = i === tlsStep;
                const arrowDir = step.sender === 'client' ? '\u2192' : step.sender === 'server' ? '\u2190' : '\u2194';

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isReached ? 1 : 0.25 }}
                    style={{
                      display: 'flex',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      marginBottom: '0.3rem',
                      borderRadius: 6,
                      background: isCurrent ? `${step.color}15` : 'transparent',
                      border: isCurrent ? `2px solid ${step.color}` : '1px solid transparent',
                      boxShadow: isCurrent ? `0 0 10px ${step.color}22` : 'none',
                      transition: 'all 0.3s',
                      flexDirection: isMobile ? 'column' : 'row',
                    }}
                  >
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isReached ? step.color : 'var(--sl-color-gray-5)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>

                    <span style={{ fontSize: '1rem', color: isReached ? step.color : 'var(--sl-color-gray-4)', flexShrink: 0 }}>
                      {arrowDir}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isReached ? step.color : 'var(--sl-color-gray-4)' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--sl-color-gray-3)' }}>
                        {step.description}
                      </div>
                    </div>

                    {step.sender !== 'both' && (
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '999px',
                        background: step.sender === 'client' ? '#3b82f622' : '#10b98122',
                        color: step.sender === 'client' ? '#3b82f6' : '#10b981',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {step.sender}
                      </span>
                    )}
                  </motion.div>
                );
              })}

              {/* Detail panel */}
              <AnimatePresence mode="wait">
                {tlsStep >= 0 && (
                  <motion.div
                    key={tlsStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: `${TLS_STEPS[tlsStep].color}12`,
                      border: `1px solid ${TLS_STEPS[tlsStep].color}44`,
                      borderRadius: '0.5rem',
                      fontSize: '0.78rem',
                      color: 'var(--sl-color-gray-2)',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong style={{ color: TLS_STEPS[tlsStep].color }}>{TLS_STEPS[tlsStep].label}:</strong>{' '}
                    {TLS_STEPS[tlsStep].detail}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Hashing ── */}
        {scenario === 'hashing' && (
          <div>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10b981', display: 'block', marginBottom: '0.25rem' }}>
                  Input A
                </label>
                <input
                  type="text"
                  value={hashInput1}
                  onChange={(e) => setHashInput1(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 6,
                    border: '1px solid #10b98144',
                    background: 'var(--sl-color-gray-7)',
                    color: '#10b981',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#3b82f6', display: 'block', marginBottom: '0.25rem' }}>
                  Input B (try changing one character)
                </label>
                <input
                  type="text"
                  value={hashInput2}
                  onChange={(e) => setHashInput2(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 6,
                    border: '1px solid #3b82f644',
                    background: 'var(--sl-color-gray-7)',
                    color: '#3b82f6',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Hash comparison */}
            <div style={{ background: 'var(--sl-color-gray-7)', borderRadius: '0.5rem', padding: '1rem', border: '1px solid var(--sl-color-gray-5)' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                {/* Input A flow */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Input A
                  </div>
                  {dataBox('Input', hashInput1, '#10b981', true)}
                  <div style={{ textAlign: 'center', padding: '0.3rem 0', color: 'var(--sl-color-gray-4)' }}>{'\u2193'}</div>
                  <div style={{
                    background: '#0d1117',
                    borderRadius: 6,
                    padding: '0.5rem',
                    textAlign: 'center',
                    marginBottom: '0.3rem',
                  }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.2rem' }}>SHA-256 (simulated)</div>
                    <div style={{ fontSize: '0.6rem', color: '#f59e0b' }}>{'f(x) \u2192 H(x)'}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.3rem 0', color: 'var(--sl-color-gray-4)' }}>{'\u2193'}</div>
                  <div style={{
                    background: '#ef444412',
                    border: '2px solid #ef4444',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Hash Output A</div>
                    <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#ef4444', wordBreak: 'break-all', letterSpacing: '0.05em' }}>
                      {hash1.split('').map((ch, i) => (
                        <span key={i} style={{ color: hash1[i] !== hash2[i] ? '#ef4444' : '#ef444488' }}>{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Input B flow */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Input B
                  </div>
                  {dataBox('Input', hashInput2, '#3b82f6', true)}
                  <div style={{ textAlign: 'center', padding: '0.3rem 0', color: 'var(--sl-color-gray-4)' }}>{'\u2193'}</div>
                  <div style={{
                    background: '#0d1117',
                    borderRadius: 6,
                    padding: '0.5rem',
                    textAlign: 'center',
                    marginBottom: '0.3rem',
                  }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.2rem' }}>SHA-256 (simulated)</div>
                    <div style={{ fontSize: '0.6rem', color: '#f59e0b' }}>{'f(x) \u2192 H(x)'}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.3rem 0', color: 'var(--sl-color-gray-4)' }}>{'\u2193'}</div>
                  <div style={{
                    background: '#8b5cf612',
                    border: '2px solid #8b5cf6',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Hash Output B</div>
                    <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#8b5cf6', wordBreak: 'break-all', letterSpacing: '0.05em' }}>
                      {hash2.split('').map((ch, i) => (
                        <span key={i} style={{ color: hash2[i] !== hash1[i] ? '#8b5cf6' : '#8b5cf688' }}>{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Avalanche effect indicator */}
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', marginBottom: '0.3rem' }}>
                  Avalanche Effect
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div style={{ width: isMobile ? 120 : 200, height: 12, background: 'var(--sl-color-gray-5)', borderRadius: 6, overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${hashDiffPercent}%` }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      style={{ height: '100%', background: hashInput1 === hashInput2 ? '#10b981' : '#ef4444', borderRadius: 6 }}
                    />
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: hashInput1 === hashInput2 ? '#10b981' : '#ef4444',
                    fontFamily: 'monospace',
                  }}>
                    {hashInput1 === hashInput2 ? 'Identical' : `${hashDiffPercent}% different`}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--sl-color-gray-3)', marginTop: '0.3rem' }}>
                  {hashDiffCount} of {hash1.length} hash characters differ
                </div>
              </div>
            </div>

            {/* Key properties */}
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
              {[
                { title: 'Deterministic', desc: 'Same input always produces the same hash', color: '#3b82f6' },
                { title: 'One-Way', desc: 'Cannot reverse a hash back to the original input', color: '#ef4444' },
                { title: 'Avalanche Effect', desc: 'A tiny input change creates a completely different hash', color: '#f59e0b' },
                { title: 'Fixed Length', desc: 'Output is always the same length regardless of input size', color: '#10b981' },
              ].map((prop) => (
                <div
                  key={prop.title}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.6rem',
                    background: `${prop.color}12`,
                    border: `1px solid ${prop.color}33`,
                    borderRadius: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: prop.color, marginBottom: '0.15rem' }}>
                    {prop.title}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-2)', lineHeight: 1.4 }}>
                    {prop.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
