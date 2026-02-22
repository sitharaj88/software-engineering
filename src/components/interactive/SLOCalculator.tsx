import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SLOLevel {
  label: string;
  value: number;
  nines: string;
}

const SLO_PRESETS: SLOLevel[] = [
  { label: '99%', value: 99, nines: 'Two nines' },
  { label: '99.5%', value: 99.5, nines: 'Two and a half nines' },
  { label: '99.9%', value: 99.9, nines: 'Three nines' },
  { label: '99.95%', value: 99.95, nines: 'Three and a half nines' },
  { label: '99.99%', value: 99.99, nines: 'Four nines' },
  { label: '99.999%', value: 99.999, nines: 'Five nines' },
];

const COMPARISON_LEVELS = [99, 99.5, 99.9, 99.95, 99.99, 99.999];

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

function formatDuration(minutes: number): string {
  if (minutes < 1) {
    const seconds = minutes * 60;
    return seconds < 0.01 ? `${(seconds * 1000).toFixed(2)}ms` : `${seconds.toFixed(2)}s`;
  }
  if (minutes < 60) return `${minutes.toFixed(2)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(2)} hrs`;
  const days = hours / 24;
  return `${days.toFixed(2)} days`;
}

function getNinesLabel(slo: number): string {
  if (slo >= 99.999) return 'Five nines';
  if (slo >= 99.99) return 'Four nines';
  if (slo >= 99.95) return 'Three and a half nines';
  if (slo >= 99.9) return 'Three nines';
  if (slo >= 99.5) return 'Two and a half nines';
  if (slo >= 99) return 'Two nines';
  if (slo >= 90) return 'One nine';
  return 'Below one nine';
}

function getNinesCount(slo: number): number {
  if (slo >= 99.999) return 5;
  if (slo >= 99.99) return 4;
  if (slo >= 99.95) return 3.5;
  if (slo >= 99.9) return 3;
  if (slo >= 99.5) return 2.5;
  if (slo >= 99) return 2;
  if (slo >= 90) return 1;
  return 0;
}

export default function SLOCalculator() {
  const isMobile = useIsMobile();
  const [slo, setSlo] = useState(99.9);
  const [sloInput, setSloInput] = useState('99.9');
  const [errorRate, setErrorRate] = useState(0.5);
  const [requestsPerMonth, setRequestsPerMonth] = useState(1000000);

  const handleSloChange = useCallback((value: number) => {
    const clamped = Math.min(99.999, Math.max(90, value));
    setSlo(clamped);
    setSloInput(String(clamped));
  }, []);

  const handleSloInputChange = (val: string) => {
    setSloInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 90 && num <= 99.999) {
      setSlo(num);
    }
  };

  // Error budget calculations
  const budget = useMemo(() => {
    const errorBudgetPercent = 100 - slo;
    const minutesPerDay = 24 * 60;
    const minutesPerMonth = minutesPerDay * 30;
    const minutesPerYear = minutesPerDay * 365;

    const downtimePerDay = (errorBudgetPercent / 100) * minutesPerDay;
    const downtimePerMonth = (errorBudgetPercent / 100) * minutesPerMonth;
    const downtimePerYear = (errorBudgetPercent / 100) * minutesPerYear;

    const allowedFailures = Math.floor((errorBudgetPercent / 100) * requestsPerMonth);

    return {
      errorBudgetPercent,
      downtimePerDay,
      downtimePerMonth,
      downtimePerYear,
      allowedFailures,
    };
  }, [slo, requestsPerMonth]);

  // Burn rate calculations
  const burnRate = useMemo(() => {
    const budgetPercent = 100 - slo;
    const currentErrorPercent = errorRate;

    // Burn rate = current error rate / error budget
    const rate = currentErrorPercent / budgetPercent;

    // Time to exhaust budget at current rate
    const minutesPerMonth = 30 * 24 * 60;
    const budgetMinutes = (budgetPercent / 100) * minutesPerMonth;
    const consumptionRate = currentErrorPercent / 100; // fraction per minute of runtime producing errors
    const timeToExhaust = consumptionRate > 0 ? budgetMinutes / (consumptionRate * minutesPerMonth) * minutesPerMonth : Infinity;

    const budgetConsumed = Math.min(100, rate * 100);

    return {
      rate,
      budgetConsumed,
      timeToExhaust,
      isOverBurning: rate > 1,
    };
  }, [slo, errorRate]);

  const ninesLabel = getNinesLabel(slo);
  const ninesCount = getNinesCount(slo);

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

  const statCard = (label: string, value: string, sublabel: string, color: string): React.CSSProperties => ({
    flex: '1 1 140px',
    padding: '0.7rem 0.8rem',
    borderRadius: '8px',
    background: `${color}10`,
    border: `1px solid ${color}40`,
  });

  const getSloColor = (value: number): string => {
    if (value >= 99.99) return '#10b981';
    if (value >= 99.9) return '#22d3ee';
    if (value >= 99.5) return '#0066cc';
    if (value >= 99) return '#f59e0b';
    return '#ef4444';
  };

  const sloColor = getSloColor(slo);

  // Slider converts between log-scale for better UX at high end
  const sloToSlider = (s: number) => {
    // Map 90-99.999 to 0-1000 with log scale for the nines
    if (s <= 99) return ((s - 90) / 9) * 333;
    if (s <= 99.9) return 333 + ((s - 99) / 0.9) * 222;
    if (s <= 99.99) return 555 + ((s - 99.9) / 0.09) * 222;
    return 777 + ((s - 99.99) / 0.009) * 223;
  };

  const sliderToSlo = (v: number) => {
    if (v <= 333) return 90 + (v / 333) * 9;
    if (v <= 555) return 99 + ((v - 333) / 222) * 0.9;
    if (v <= 777) return 99.9 + ((v - 555) / 222) * 0.09;
    return 99.99 + ((v - 777) / 223) * 0.009;
  };

  const sliderValue = sloToSlider(slo);

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>SLO / Error Budget Calculator</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Calculate error budgets, allowed downtime, and burn rates for your service level objectives
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* SLO Target input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            SLO Target
          </div>

          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {SLO_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => handleSloChange(p.value)}
                style={pillBtn(Math.abs(slo - p.value) < 0.001)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Slider + numeric input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <input
              type="range"
              min={0}
              max={1000}
              value={sliderValue}
              onChange={e => {
                const val = sliderToSlo(Number(e.target.value));
                const rounded = Math.round(val * 1000) / 1000;
                handleSloChange(rounded);
              }}
              style={{ flex: 1, accentColor: sloColor }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input
                type="text"
                value={sloInput}
                onChange={e => handleSloInputChange(e.target.value)}
                style={{
                  width: 80,
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--sl-color-gray-5)',
                  background: 'var(--sl-color-gray-7, #0d1117)',
                  color: 'var(--sl-color-text)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>%</span>
            </div>
          </div>

          {/* Nines display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              background: `${sloColor}15`,
              border: `1.5px solid ${sloColor}`,
              fontSize: '0.82rem',
              fontWeight: 700,
              color: sloColor,
            }}>
              {ninesLabel} ({ninesCount} 9s)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)' }}>
              Error Budget: <strong style={{ color: sloColor }}>{budget.errorBudgetPercent.toFixed(3)}%</strong>
            </div>
          </div>
        </div>

        {/* Error budget stats */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Allowed Downtime
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Per Day', value: formatDuration(budget.downtimePerDay), raw: budget.downtimePerDay, color: '#0066cc' },
              { label: 'Per Month', value: formatDuration(budget.downtimePerMonth), raw: budget.downtimePerMonth, color: '#8b5cf6' },
              { label: 'Per Year', value: formatDuration(budget.downtimePerYear), raw: budget.downtimePerYear, color: '#ec4899' },
            ].map(s => (
              <div key={s.label} style={statCard(s.label, s.value, '', s.color)}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allowed failures */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Allowed Failures
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              background: '#f59e0b12',
              border: '1px solid #f59e0b40',
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Failed Requests / Month
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                {budget.allowedFailures.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--sl-color-gray-3)', marginTop: '0.15rem' }}>
                out of {requestsPerMonth.toLocaleString()} requests
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sl-color-gray-3)' }}>Monthly Requests:</label>
              <select
                value={requestsPerMonth}
                onChange={e => setRequestsPerMonth(Number(e.target.value))}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--sl-color-gray-5)',
                  background: 'var(--sl-color-gray-7, #0d1117)',
                  color: 'var(--sl-color-text)',
                  fontSize: '0.8rem',
                }}
              >
                <option value={10000}>10,000</option>
                <option value={100000}>100,000</option>
                <option value={1000000}>1,000,000</option>
                <option value={10000000}>10,000,000</option>
                <option value={100000000}>100,000,000</option>
                <option value={1000000000}>1,000,000,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Burn rate calculator */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Burn Rate Calculator
          </div>
          <div style={{
            padding: '0.9rem',
            borderRadius: '8px',
            background: 'var(--sl-color-gray-6)',
            border: '1px solid var(--sl-color-gray-5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Current Error Rate:
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.01}
                value={errorRate}
                onChange={e => setErrorRate(Number(e.target.value))}
                style={{ flex: 1, minWidth: 100, accentColor: burnRate.isOverBurning ? '#ef4444' : '#10b981' }}
              />
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: burnRate.isOverBurning ? '#ef4444' : '#10b981',
                minWidth: 55,
                textAlign: 'right',
              }}>
                {errorRate.toFixed(2)}%
              </span>
            </div>

            {/* Burn rate gauge */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)' }}>Budget Consumption</span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: burnRate.isOverBurning ? '#ef4444' : burnRate.budgetConsumed > 70 ? '#f59e0b' : '#10b981',
                }}>
                  {burnRate.budgetConsumed.toFixed(1)}%
                </span>
              </div>
              <div style={{
                height: 16,
                borderRadius: 8,
                background: 'var(--sl-color-gray-5)',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <motion.div
                  animate={{ width: `${Math.min(100, burnRate.budgetConsumed)}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: '100%',
                    borderRadius: 8,
                    background: burnRate.isOverBurning
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : burnRate.budgetConsumed > 70
                        ? 'linear-gradient(90deg, #f59e0b, #ea580c)'
                        : 'linear-gradient(90deg, #10b981, #059669)',
                  }}
                />
                {/* Marker at 100% */}
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: -3,
                  bottom: -3,
                  width: 2,
                  background: '#ef4444',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.15rem', fontSize: '0.6rem', color: 'var(--sl-color-gray-4)' }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Burn rate stats */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{
                flex: '1 1 120px',
                padding: '0.5rem 0.7rem',
                borderRadius: '6px',
                background: burnRate.isOverBurning ? '#ef444415' : '#10b98115',
                border: `1px solid ${burnRate.isOverBurning ? '#ef444440' : '#10b98140'}`,
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' }}>
                  Burn Rate
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: burnRate.isOverBurning ? '#ef4444' : '#10b981',
                }}>
                  {burnRate.rate.toFixed(2)}x
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--sl-color-gray-4)' }}>
                  {burnRate.isOverBurning ? 'Exceeding budget!' : 'Within budget'}
                </div>
              </div>
              <div style={{
                flex: '1 1 140px',
                padding: '0.5rem 0.7rem',
                borderRadius: '6px',
                background: 'var(--sl-color-gray-7, #0d1117)',
                border: '1px solid var(--sl-color-gray-5)',
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' }}>
                  Budget Exhausted In
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: burnRate.timeToExhaust < 1440 ? '#ef4444' : burnRate.timeToExhaust < 10080 ? '#f59e0b' : 'var(--sl-color-text)',
                }}>
                  {burnRate.rate === 0 ? 'Never' : formatDuration(burnRate.timeToExhaust)}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--sl-color-gray-4)' }}>
                  at current error rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            SLO Comparison Table
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 700 }}>SLO</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 700 }}>Nines</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem', fontWeight: 700 }}>Downtime/Day</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem', fontWeight: 700 }}>Downtime/Month</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.6rem', fontWeight: 700 }}>Downtime/Year</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_LEVELS.map(level => {
                  const errorPct = 100 - level;
                  const perDay = (errorPct / 100) * 1440;
                  const perMonth = (errorPct / 100) * 43200;
                  const perYear = (errorPct / 100) * 525600;
                  const isActive = Math.abs(slo - level) < 0.001;
                  const color = getSloColor(level);

                  return (
                    <tr
                      key={level}
                      style={{
                        borderBottom: '1px solid var(--sl-color-gray-5)',
                        background: isActive ? `${color}12` : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSloChange(level)}
                    >
                      <td style={{ padding: '0.5rem 0.6rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color,
                          fontFamily: 'monospace',
                        }}>
                          {level}%
                        </span>
                        {isActive && (
                          <span style={{
                            marginLeft: '0.4rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: `${color}25`,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color,
                          }}>
                            CURRENT
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', color: 'var(--sl-color-gray-3)' }}>
                        {getNinesLabel(level)}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatDuration(perDay)}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatDuration(perMonth)}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatDuration(perYear)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
