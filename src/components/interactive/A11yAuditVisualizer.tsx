import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─── */
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface A11yIssue {
  id: string;
  element: string;
  issue: string;
  wcag: string;
  explanation: string;
  fix: string;
  category: string;
  severity: 'critical' | 'serious' | 'moderate';
}

interface PageScenario {
  name: string;
  difficulty: Difficulty;
  description: string;
  issues: A11yIssue[];
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

/* ─── Page Scenarios ─── */
const PAGES: PageScenario[] = [
  {
    name: 'Blog Homepage',
    difficulty: 'beginner',
    description: 'A simple blog homepage with common accessibility mistakes',
    issues: [
      {
        id: 'missing-alt',
        element: 'Hero Image',
        issue: 'Missing alt text on image',
        wcag: 'WCAG 1.1.1 (Non-text Content)',
        explanation: 'Images must have alternative text that describes their content or function. Screen readers cannot interpret images without alt text, making the content inaccessible to blind users.',
        fix: 'Add alt="A developer working at a desk with dual monitors" to the img tag.',
        category: 'Images',
        severity: 'critical',
      },
      {
        id: 'low-contrast',
        element: 'Subtitle Text',
        issue: 'Low color contrast (2.1:1 ratio)',
        wcag: 'WCAG 1.4.3 (Contrast Minimum)',
        explanation: 'The light gray text (#aaa) on white background (#fff) has a contrast ratio of only 2.1:1. The minimum required ratio is 4.5:1 for normal text. Users with low vision cannot read this text.',
        fix: 'Change the text color from #aaa to #595959 to achieve a 7:1 contrast ratio.',
        category: 'Color',
        severity: 'serious',
      },
      {
        id: 'missing-label',
        element: 'Email Input',
        issue: 'Form input missing associated label',
        wcag: 'WCAG 1.3.1 (Info and Relationships)',
        explanation: 'The email input field uses only placeholder text instead of a proper <label> element. Placeholder text disappears when the user starts typing and is not reliably announced by screen readers.',
        fix: 'Add <label for="email">Email Address</label> before the input element.',
        category: 'Forms',
        severity: 'critical',
      },
      {
        id: 'heading-skip',
        element: 'Section Heading',
        issue: 'Heading levels skip from h1 to h4',
        wcag: 'WCAG 1.3.1 (Info and Relationships)',
        explanation: 'The page jumps from an <h1> directly to an <h4>, skipping <h2> and <h3>. Screen reader users rely on heading hierarchy to understand page structure and navigate content.',
        fix: 'Change <h4> to <h2> to maintain proper heading hierarchy.',
        category: 'Structure',
        severity: 'moderate',
      },
      {
        id: 'no-skip-link',
        element: 'Page Navigation',
        issue: 'No skip-to-content link',
        wcag: 'WCAG 2.4.1 (Bypass Blocks)',
        explanation: 'Keyboard users must tab through every navigation link before reaching the main content. A skip link allows them to bypass repetitive navigation.',
        fix: 'Add <a href="#main-content" class="skip-link">Skip to main content</a> as the first focusable element.',
        category: 'Navigation',
        severity: 'serious',
      },
    ],
  },
  {
    name: 'E-commerce Product Page',
    difficulty: 'intermediate',
    description: 'A product page with more subtle accessibility problems',
    issues: [
      {
        id: 'decorative-alt',
        element: 'Product Image',
        issue: 'Decorative image has non-descriptive alt text',
        wcag: 'WCAG 1.1.1 (Non-text Content)',
        explanation: 'The product image has alt="image123.jpg" which provides no useful information. Alt text should describe the content meaningfully for screen reader users.',
        fix: 'Change to alt="Blue wireless headphones with noise cancellation, side view".',
        category: 'Images',
        severity: 'serious',
      },
      {
        id: 'click-here',
        element: 'Link Text',
        issue: 'Non-descriptive link text "Click here"',
        wcag: 'WCAG 2.4.4 (Link Purpose)',
        explanation: 'Links labeled "Click here" or "Read more" are meaningless when read out of context. Screen reader users often navigate by listing all links on a page.',
        fix: 'Change "Click here for details" to "View product specifications" or use aria-label.',
        category: 'Links',
        severity: 'serious',
      },
      {
        id: 'missing-aria',
        element: 'Rating Stars',
        issue: 'Interactive star rating missing ARIA labels',
        wcag: 'WCAG 4.1.2 (Name, Role, Value)',
        explanation: 'The star rating widget uses only visual stars without any text alternative or ARIA attributes. Screen readers cannot convey the rating value or allow interaction.',
        fix: 'Add role="radiogroup", aria-label="Product rating", and aria-label="X out of 5 stars" to each star.',
        category: 'ARIA',
        severity: 'critical',
      },
      {
        id: 'color-only',
        element: 'Stock Status',
        issue: 'Information conveyed by color alone',
        wcag: 'WCAG 1.4.1 (Use of Color)',
        explanation: 'The stock status uses only a green/red dot to indicate availability. Color-blind users cannot distinguish between in-stock and out-of-stock items.',
        fix: 'Add text labels "In Stock" / "Out of Stock" alongside the colored indicators.',
        category: 'Color',
        severity: 'serious',
      },
      {
        id: 'focus-missing',
        element: 'Add to Cart Button',
        issue: 'Custom button has no visible focus indicator',
        wcag: 'WCAG 2.4.7 (Focus Visible)',
        explanation: 'The styled button removes the default focus outline with outline:none but provides no alternative focus style. Keyboard users cannot see which element is focused.',
        fix: 'Add a visible focus style: button:focus-visible { outline: 3px solid #0066cc; outline-offset: 2px; }.',
        category: 'Keyboard',
        severity: 'critical',
      },
      {
        id: 'auto-carousel',
        element: 'Image Carousel',
        issue: 'Auto-playing carousel with no pause control',
        wcag: 'WCAG 2.2.2 (Pause, Stop, Hide)',
        explanation: 'The auto-rotating image carousel has no way to pause it. This can be disorienting for users with cognitive disabilities and makes it impossible for screen readers to read the content in time.',
        fix: 'Add a visible pause/play button. Pause auto-rotation when the carousel receives focus or hover.',
        category: 'Motion',
        severity: 'moderate',
      },
    ],
  },
  {
    name: 'Dashboard Application',
    difficulty: 'advanced',
    description: 'A complex dashboard with advanced accessibility challenges',
    issues: [
      {
        id: 'modal-trap',
        element: 'Settings Modal',
        issue: 'Modal dialog does not trap focus',
        wcag: 'WCAG 2.4.3 (Focus Order)',
        explanation: 'When the modal opens, keyboard focus can escape behind it to the page content. Users can interact with elements they cannot see, causing confusion and errors.',
        fix: 'Implement focus trapping: on open, move focus to modal; on Tab at last element, cycle to first; on Escape, close and return focus to trigger.',
        category: 'Keyboard',
        severity: 'critical',
      },
      {
        id: 'live-region',
        element: 'Notification Badge',
        issue: 'Dynamic content updates not announced',
        wcag: 'WCAG 4.1.3 (Status Messages)',
        explanation: 'When new notifications arrive, the badge count updates visually but screen readers are not informed. Users miss important status changes.',
        fix: 'Add aria-live="polite" and role="status" to the notification container. Use aria-atomic="true" for complete re-reads.',
        category: 'ARIA',
        severity: 'serious',
      },
      {
        id: 'data-table',
        element: 'Data Table',
        issue: 'Table missing proper headers and scope',
        wcag: 'WCAG 1.3.1 (Info and Relationships)',
        explanation: 'The data table uses <td> for header cells instead of <th>. Without proper headers, screen readers cannot associate data cells with their column/row labels.',
        fix: 'Use <th scope="col"> for column headers and <th scope="row"> for row headers. Add <caption> for the table title.',
        category: 'Structure',
        severity: 'serious',
      },
      {
        id: 'chart-a11y',
        element: 'Analytics Chart',
        issue: 'Chart has no text alternative',
        wcag: 'WCAG 1.1.1 (Non-text Content)',
        explanation: 'The SVG chart has no accessible description. Screen reader users get no information about the data trends being visualized.',
        fix: 'Add role="img" and aria-label with a data summary. Provide a linked data table alternative.',
        category: 'Images',
        severity: 'critical',
      },
      {
        id: 'dropdown-keyboard',
        element: 'Dropdown Menu',
        issue: 'Custom dropdown not keyboard accessible',
        wcag: 'WCAG 2.1.1 (Keyboard)',
        explanation: 'The custom dropdown menu only opens on mouse hover. Keyboard and touch-only users cannot access the menu items. All functionality must be operable via keyboard.',
        fix: 'Implement keyboard support: Enter/Space to toggle, Arrow keys to navigate, Escape to close. Use role="menu" and role="menuitem".',
        category: 'Keyboard',
        severity: 'critical',
      },
      {
        id: 'error-handling',
        element: 'Form Validation',
        issue: 'Error messages not programmatically associated',
        wcag: 'WCAG 3.3.1 (Error Identification)',
        explanation: 'Form validation errors appear visually near the field but are not programmatically linked. Screen readers do not announce the error when the field is focused.',
        fix: 'Use aria-describedby to link error messages to their fields. Add aria-invalid="true" to invalid fields. Use role="alert" for error containers.',
        category: 'Forms',
        severity: 'serious',
      },
      {
        id: 'lang-attr',
        element: 'Page HTML',
        issue: 'Missing lang attribute on html element',
        wcag: 'WCAG 3.1.1 (Language of Page)',
        explanation: 'The <html> element is missing the lang attribute. Screen readers need this to select the correct speech synthesis engine. Without it, content may be mispronounced.',
        fix: 'Add lang="en" (or the appropriate language code) to the <html> element.',
        category: 'Structure',
        severity: 'serious',
      },
    ],
  },
];

/* ─── Severity badge colors ─── */
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  serious: '#f59e0b',
  moderate: '#3b82f6',
};

const CATEGORY_ICONS: Record<string, string> = {
  Images: '\uD83D\uDDBC',
  Color: '\uD83C\uDFA8',
  Forms: '\uD83D\uDCDD',
  Structure: '\uD83C\uDFD7',
  Navigation: '\uD83E\uDDED',
  Links: '\uD83D\uDD17',
  ARIA: '\u267F',
  Keyboard: '\u2328',
  Motion: '\u25B6',
};

/* ─── Component ─── */
export default function A11yAuditVisualizer() {
  const isMobile = useIsMobile();
  const [activePage, setActivePage] = useState(0);
  const [foundIssues, setFoundIssues] = useState<Set<string>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<A11yIssue | null>(null);
  const [showFixed, setShowFixed] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<Set<string>>(new Set());
  const [showAllHints, setShowAllHints] = useState(false);

  const page = PAGES[activePage];
  const totalIssues = page.issues.length;
  const foundCount = page.issues.filter((i) => foundIssues.has(i.id)).length;
  const allFound = foundCount === totalIssues;

  const changePage = useCallback((idx: number) => {
    setActivePage(idx);
    setFoundIssues(new Set());
    setSelectedIssue(null);
    setShowFixed(false);
    setHintsRevealed(new Set());
    setShowAllHints(false);
  }, []);

  const findIssue = useCallback((issue: A11yIssue) => {
    setFoundIssues((prev) => new Set(prev).add(issue.id));
    setSelectedIssue(issue);
    setShowFixed(false);
  }, []);

  const revealHint = useCallback((id: string) => {
    setHintsRevealed((prev) => new Set(prev).add(id));
  }, []);

  const difficultyColor: Record<Difficulty, string> = {
    beginner: '#10b981',
    intermediate: '#f59e0b',
    advanced: '#ef4444',
  };

  // Render the simulated "webpage" for the current scenario
  const renderSimulatedPage = () => {
    if (activePage === 0) {
      // Blog Homepage
      return (
        <div style={{ background: '#ffffff', color: '#333', borderRadius: '0.5rem', overflow: 'hidden', fontSize: '0.78rem' }}>
          {/* Nav */}
          <div
            onClick={() => findIssue(page.issues[4])} // no-skip-link
            style={{ background: '#2d3748', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: foundIssues.has('no-skip-link') ? '2px solid #10b981' : '2px solid transparent' }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>MyBlog</span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['Home', 'About', 'Posts', 'Contact'].map((l) => (
                <span key={l} style={{ color: '#cbd5e0', fontSize: '0.72rem', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
            {foundIssues.has('no-skip-link') && <span style={{ position: 'absolute', right: 8, top: 4, color: '#10b981', fontSize: '0.6rem' }}>Found!</span>}
          </div>

          {/* Hero */}
          <div
            onClick={() => findIssue(page.issues[0])} // missing-alt
            style={{ background: '#e2e8f0', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', border: foundIssues.has('missing-alt') ? '2px solid #10b981' : '2px solid transparent' }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#a0aec0' }}>[Image: no alt text]</div>
              <div style={{ width: 60, height: 40, background: '#cbd5e0', borderRadius: 4, margin: '0.3rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {'\uD83D\uDDBC'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '1rem' }}>
            <h1 style={{ fontSize: '1rem', color: '#1a202c', margin: '0 0 0.3rem' }}>Welcome to My Blog</h1>

            {/* Low contrast text */}
            <div
              onClick={() => findIssue(page.issues[1])} // low-contrast
              style={{ cursor: 'pointer', border: foundIssues.has('low-contrast') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.2rem' }}
            >
              <p style={{ color: '#aaaaaa', fontSize: '0.72rem', margin: '0 0 0.5rem' }}>
                This subtitle text has very low contrast against the white background
              </p>
            </div>

            {/* Heading skip */}
            <div
              onClick={() => findIssue(page.issues[3])} // heading-skip
              style={{ cursor: 'pointer', border: foundIssues.has('heading-skip') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.2rem', margin: '0.3rem 0' }}
            >
              <h4 style={{ fontSize: '0.82rem', color: '#2d3748', margin: 0 }}>Latest Posts</h4>
              <span style={{ fontSize: '0.6rem', color: '#a0aec0' }}>{'<h4>'} - skipped h2, h3</span>
            </div>

            <p style={{ fontSize: '0.72rem', color: '#4a5568', margin: '0.3rem 0' }}>Check out our latest articles on web development.</p>

            {/* Form without label */}
            <div
              onClick={() => findIssue(page.issues[2])} // missing-label
              style={{ marginTop: '0.5rem', cursor: 'pointer', border: foundIssues.has('missing-label') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.3rem' }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#2d3748', marginBottom: '0.2rem' }}>Subscribe to newsletter</div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <input
                  type="text"
                  placeholder="Enter your email..."
                  readOnly
                  style={{ padding: '0.3rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.7rem', flex: 1, background: '#f7fafc', color: '#333' }}
                />
                <button style={{ padding: '0.3rem 0.6rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'default' }}>
                  Subscribe
                </button>
              </div>
              <span style={{ fontSize: '0.6rem', color: '#a0aec0' }}>No {'<label>'} element</span>
            </div>
          </div>
        </div>
      );
    }

    if (activePage === 1) {
      // E-commerce Product Page
      return (
        <div style={{ background: '#ffffff', color: '#333', borderRadius: '0.5rem', overflow: 'hidden', fontSize: '0.78rem' }}>
          <div style={{ background: '#1a202c', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>ShopNow</span>
            <span style={{ color: '#cbd5e0', fontSize: '0.7rem' }}>Cart (3)</span>
          </div>

          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
            {/* Product image carousel area */}
            <div style={{ flex: 1 }}>
              <div
                onClick={() => findIssue(page.issues[0])} // decorative-alt
                style={{ background: '#edf2f7', height: 100, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: foundIssues.has('decorative-alt') ? '2px solid #10b981' : '2px solid transparent' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>{'\uD83C\uDFA7'}</span>
                  <div style={{ fontSize: '0.6rem', color: '#a0aec0' }}>alt="image123.jpg"</div>
                </div>
              </div>

              <div
                onClick={() => findIssue(page.issues[5])} // auto-carousel
                style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', cursor: 'pointer', border: foundIssues.has('auto-carousel') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.15rem' }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} style={{ width: 30, height: 22, background: n === 1 ? '#3182ce' : '#e2e8f0', borderRadius: 3, fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: n === 1 ? '#fff' : '#a0aec0' }}>
                    {n}
                  </div>
                ))}
                <span style={{ fontSize: '0.55rem', color: '#a0aec0', marginLeft: 4 }}>auto-plays, no pause</span>
              </div>
            </div>

            {/* Product info */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '0.9rem', margin: '0 0 0.3rem', color: '#1a202c' }}>Wireless Headphones Pro</h2>

              {/* Star rating */}
              <div
                onClick={() => findIssue(page.issues[2])} // missing-aria
                style={{ cursor: 'pointer', border: foundIssues.has('missing-aria') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.15rem', marginBottom: '0.3rem' }}
              >
                <span style={{ color: '#f6ad55' }}>{'\u2605\u2605\u2605\u2605'}</span>
                <span style={{ color: '#e2e8f0' }}>{'\u2605'}</span>
                <span style={{ fontSize: '0.6rem', color: '#a0aec0', marginLeft: '0.3rem' }}>No ARIA labels</span>
              </div>

              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a202c', margin: '0 0 0.3rem' }}>$149.99</p>

              {/* Stock status - color only */}
              <div
                onClick={() => findIssue(page.issues[3])} // color-only
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', border: foundIssues.has('color-only') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.15rem', marginBottom: '0.3rem' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#48bb78' }} />
                <span style={{ fontSize: '0.6rem', color: '#a0aec0' }}>Color only, no text label</span>
              </div>

              {/* Add to cart - no focus indicator */}
              <div
                onClick={() => findIssue(page.issues[4])} // focus-missing
                style={{ cursor: 'pointer', border: foundIssues.has('focus-missing') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.15rem', marginBottom: '0.3rem' }}
              >
                <button style={{ padding: '0.35rem 0.75rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, cursor: 'default', outline: 'none' }}>
                  Add to Cart
                </button>
                <span style={{ fontSize: '0.6rem', color: '#a0aec0', marginLeft: '0.3rem' }}>outline: none</span>
              </div>

              {/* Click here link */}
              <div
                onClick={() => findIssue(page.issues[1])} // click-here
                style={{ cursor: 'pointer', border: foundIssues.has('click-here') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.15rem' }}
              >
                <span style={{ color: '#3182ce', textDecoration: 'underline', fontSize: '0.72rem', cursor: 'pointer' }}>Click here</span>
                <span style={{ fontSize: '0.72rem', color: '#4a5568' }}> for more details</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Dashboard Application
    return (
      <div style={{ background: '#1a202c', color: '#e2e8f0', borderRadius: '0.5rem', overflow: 'hidden', fontSize: '0.78rem' }}>
        {/* Top bar */}
        <div
          onClick={() => findIssue(page.issues[6])} // lang-attr
          style={{ background: '#2d3748', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: foundIssues.has('lang-attr') ? '2px solid #10b981' : '2px solid transparent' }}
        >
          <span style={{ fontWeight: 700 }}>Dashboard</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Notification badge */}
            <div
              onClick={(e) => { e.stopPropagation(); findIssue(page.issues[1]); }} // live-region
              style={{ position: 'relative', cursor: 'pointer', border: foundIssues.has('live-region') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.1rem 0.3rem' }}
            >
              <span style={{ fontSize: '0.85rem' }}>{'\uD83D\uDD14'}</span>
              <span style={{ position: 'absolute', top: -2, right: -2, background: '#e53e3e', color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>5</span>
            </div>

            {/* Dropdown */}
            <div
              onClick={(e) => { e.stopPropagation(); findIssue(page.issues[4]); }} // dropdown-keyboard
              style={{ cursor: 'pointer', border: foundIssues.has('dropdown-keyboard') ? '2px solid #10b981' : '2px solid transparent', borderRadius: 4, padding: '0.1rem 0.3rem' }}
            >
              <span style={{ fontSize: '0.72rem' }}>Admin {'\u25BC'}</span>
              <span style={{ fontSize: '0.55rem', color: '#718096', display: 'block' }}>hover only</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
          {/* Left: Chart and Table */}
          <div style={{ flex: 1 }}>
            {/* Chart */}
            <div
              onClick={() => findIssue(page.issues[3])} // chart-a11y
              style={{ background: '#2d3748', padding: '0.5rem', borderRadius: 6, marginBottom: '0.5rem', cursor: 'pointer', border: foundIssues.has('chart-a11y') ? '2px solid #10b981' : '2px solid transparent' }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.3rem' }}>Revenue Trend</div>
              <svg viewBox="0 0 200 50" style={{ width: '100%', height: 50 }}>
                <polyline points="10,40 40,30 70,35 100,15 130,20 160,10 190,25" fill="none" stroke="#4299e1" strokeWidth="2" />
              </svg>
              <span style={{ fontSize: '0.55rem', color: '#718096' }}>No text alternative for chart data</span>
            </div>

            {/* Table */}
            <div
              onClick={() => findIssue(page.issues[2])} // data-table
              style={{ background: '#2d3748', padding: '0.5rem', borderRadius: 6, cursor: 'pointer', border: foundIssues.has('data-table') ? '2px solid #10b981' : '2px solid transparent' }}
            >
              <table style={{ width: '100%', fontSize: '0.65rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Name', 'Revenue', 'Growth'].map((h) => (
                      <td key={h} style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid #4a5568', fontWeight: 600, color: '#a0aec0' }}>{h}</td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[['Product A', '$12K', '+15%'], ['Product B', '$8K', '+5%']].map(([n, r, g], i) => (
                    <tr key={i}>
                      <td style={{ padding: '0.2rem 0.3rem' }}>{n}</td>
                      <td style={{ padding: '0.2rem 0.3rem' }}>{r}</td>
                      <td style={{ padding: '0.2rem 0.3rem', color: '#48bb78' }}>{g}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <span style={{ fontSize: '0.55rem', color: '#718096' }}>Using {'<td>'} not {'<th>'}, no scope</span>
            </div>
          </div>

          {/* Right: Modal and Form */}
          <div style={{ flex: isMobile ? 'none' : '0 0 180px' }}>
            {/* Settings Modal trigger */}
            <div
              onClick={() => findIssue(page.issues[0])} // modal-trap
              style={{ background: '#2d3748', padding: '0.5rem', borderRadius: 6, marginBottom: '0.5rem', cursor: 'pointer', border: foundIssues.has('modal-trap') ? '2px solid #10b981' : '2px solid transparent' }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>Settings</div>
              <div style={{ background: '#4a5568', padding: '0.3rem', borderRadius: 4, fontSize: '0.62rem', textAlign: 'center' }}>
                [Modal - no focus trap]
              </div>
            </div>

            {/* Form */}
            <div
              onClick={() => findIssue(page.issues[5])} // error-handling
              style={{ background: '#2d3748', padding: '0.5rem', borderRadius: 6, cursor: 'pointer', border: foundIssues.has('error-handling') ? '2px solid #10b981' : '2px solid transparent' }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>Quick Edit</div>
              <input readOnly style={{ width: '100%', padding: '0.2rem', background: '#4a5568', border: '1px solid #e53e3e', borderRadius: 3, color: '#e2e8f0', fontSize: '0.65rem', marginBottom: '0.15rem', boxSizing: 'border-box' }} value="invalid@" />
              <div style={{ fontSize: '0.58rem', color: '#fc8181' }}>Invalid email (not linked to field)</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Accessibility Audit Visualizer</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>
          Find accessibility issues in simulated webpages - click on elements to discover problems
        </p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Difficulty tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {PAGES.map((p, i) => (
            <button
              key={p.name}
              onClick={() => changePage(i)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 6,
                minHeight: 44,
                border: activePage === i ? '2px solid #0066cc' : '1px solid var(--sl-color-gray-4)',
                background: activePage === i ? '#0066cc' : 'transparent',
                color: activePage === i ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              <span>{p.name}</span>
              <span style={{
                marginLeft: '0.4rem',
                fontSize: '0.65rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '999px',
                background: activePage === i ? 'rgba(255,255,255,0.2)' : `${difficultyColor[p.difficulty]}22`,
                color: activePage === i ? '#fff' : difficultyColor[p.difficulty],
              }}>
                {p.difficulty}
              </span>
            </button>
          ))}
        </div>

        {/* Score and controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Score */}
            <div style={{
              background: allFound ? '#10b98122' : 'var(--sl-color-gray-7)',
              border: `1px solid ${allFound ? '#10b981' : 'var(--sl-color-gray-5)'}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: allFound ? '#10b981' : 'var(--sl-color-text)' }}>
                {foundCount} / {totalIssues}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--sl-color-gray-3)' }}>Issues Found</div>
            </div>

            {/* Progress */}
            <div style={{ width: isMobile ? 100 : 150 }}>
              <div style={{ height: 8, background: 'var(--sl-color-gray-5)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${(foundCount / totalIssues) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{ height: '100%', background: allFound ? '#10b981' : '#0066cc', borderRadius: 4 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setShowAllHints(!showAllHints)}
              style={{
                height: '1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                padding: '0 0.8rem',
                border: showAllHints ? '2px solid #f59e0b' : '1px solid var(--sl-color-gray-4)',
                background: showAllHints ? '#f59e0b' : 'transparent',
                color: showAllHints ? '#fff' : 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {showAllHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            <button
              onClick={() => changePage(activePage)}
              style={{
                height: '1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                padding: '0 0.8rem',
                border: '1px solid var(--sl-color-gray-4)',
                background: 'transparent',
                color: 'var(--sl-color-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {allFound && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: '#10b98118',
                border: '1px solid #10b98144',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                Excellent! You found all {totalIssues} accessibility issues!
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-2)', marginTop: '0.2rem' }}>
                {activePage < PAGES.length - 1 ? 'Try a harder difficulty!' : 'You are an accessibility champion!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
          {/* Simulated webpage */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Click on elements to find issues
            </div>
            <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {renderSimulatedPage()}
            </div>

            {/* Hints list */}
            <AnimatePresence>
              {showAllHints && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ marginTop: '0.75rem', overflow: 'hidden' }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Hints
                  </div>
                  {page.issues.map((issue) => (
                    <div
                      key={issue.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.3rem 0.5rem',
                        marginBottom: '0.2rem',
                        borderRadius: 4,
                        background: foundIssues.has(issue.id) ? '#10b98112' : 'var(--sl-color-gray-7)',
                        border: '1px solid var(--sl-color-gray-5)',
                        fontSize: '0.72rem',
                      }}
                    >
                      <span style={{ width: 16, textAlign: 'center' }}>
                        {foundIssues.has(issue.id) ? '\u2713' : '\u25CB'}
                      </span>
                      <span style={{ color: foundIssues.has(issue.id) ? '#10b981' : 'var(--sl-color-text)', textDecoration: foundIssues.has(issue.id) ? 'line-through' : 'none' }}>
                        {issue.element}
                      </span>
                      {!foundIssues.has(issue.id) && (
                        hintsRevealed.has(issue.id) ? (
                          <span style={{ fontSize: '0.65rem', color: '#f59e0b', marginLeft: 'auto' }}>
                            Look for: {issue.category}
                          </span>
                        ) : (
                          <button
                            onClick={() => revealHint(issue.id)}
                            style={{
                              marginLeft: 'auto',
                              background: 'none',
                              border: '1px solid #f59e0b44',
                              borderRadius: 4,
                              color: '#f59e0b',
                              fontSize: '0.6rem',
                              cursor: 'pointer',
                              padding: '0.1rem 0.3rem',
                            }}
                          >
                            Hint
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Issue detail panel */}
          <div style={{ flex: isMobile ? 'none' : '0 0 320px', minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Issue Details
            </div>

            <AnimatePresence mode="wait">
              {selectedIssue ? (
                <motion.div
                  key={selectedIssue.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  style={{
                    background: 'var(--sl-color-gray-7)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid var(--sl-color-gray-5)',
                  }}
                >
                  {/* Severity badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: `${SEVERITY_COLORS[selectedIssue.severity]}22`,
                      color: SEVERITY_COLORS[selectedIssue.severity],
                      border: `1px solid ${SEVERITY_COLORS[selectedIssue.severity]}44`,
                    }}>
                      {selectedIssue.severity}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)' }}>
                      {CATEGORY_ICONS[selectedIssue.category]} {selectedIssue.category}
                    </span>
                  </div>

                  {/* Issue title */}
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    {selectedIssue.issue}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--sl-color-gray-3)', marginBottom: '0.5rem' }}>
                    Element: {selectedIssue.element}
                  </div>

                  {/* WCAG reference */}
                  <div style={{
                    background: '#0066cc12',
                    border: '1px solid #0066cc33',
                    borderRadius: 4,
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.72rem',
                    color: '#0066cc',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                  }}>
                    {selectedIssue.wcag}
                  </div>

                  {/* Explanation */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--sl-color-gray-2)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    {selectedIssue.explanation}
                  </div>

                  {/* Before/After toggle */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => setShowFixed(false)}
                      style={{
                        height: '1.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '999px',
                        padding: '0 0.7rem',
                        border: !showFixed ? '2px solid #ef4444' : '1px solid var(--sl-color-gray-4)',
                        background: !showFixed ? '#ef4444' : 'transparent',
                        color: !showFixed ? '#fff' : 'var(--sl-color-text)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      Problem
                    </button>
                    <button
                      onClick={() => setShowFixed(true)}
                      style={{
                        height: '1.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '999px',
                        padding: '0 0.7rem',
                        border: showFixed ? '2px solid #10b981' : '1px solid var(--sl-color-gray-4)',
                        background: showFixed ? '#10b981' : 'transparent',
                        color: showFixed ? '#fff' : 'var(--sl-color-text)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      Fix
                    </button>
                  </div>

                  <div style={{
                    background: showFixed ? '#10b98112' : '#ef444412',
                    border: `1px solid ${showFixed ? '#10b98144' : '#ef444444'}`,
                    borderRadius: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.75rem',
                    fontFamily: "'Fira Code', monospace",
                    color: showFixed ? '#10b981' : '#ef4444',
                    lineHeight: 1.6,
                  }}>
                    {showFixed ? selectedIssue.fix : selectedIssue.issue}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: 'var(--sl-color-gray-7)',
                    borderRadius: '0.5rem',
                    padding: '2rem 1rem',
                    border: '1px solid var(--sl-color-gray-5)',
                    textAlign: 'center',
                    color: 'var(--sl-color-gray-4)',
                    fontSize: '0.82rem',
                  }}
                >
                  Click on elements in the simulated page to discover accessibility issues
                </motion.div>
              )}
            </AnimatePresence>

            {/* Found issues list */}
            {foundCount > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Issues Discovered ({foundCount})
                </div>
                {page.issues.filter((i) => foundIssues.has(i.id)).map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => { setSelectedIssue(issue); setShowFixed(false); }}
                    style={{
                      padding: '0.35rem 0.6rem',
                      marginBottom: '0.2rem',
                      borderRadius: 4,
                      background: selectedIssue?.id === issue.id ? '#10b98112' : 'var(--sl-color-gray-7)',
                      border: selectedIssue?.id === issue.id ? '1px solid #10b98144' : '1px solid var(--sl-color-gray-5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.72rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ color: '#10b981' }}>{'\u2713'}</span>
                    <span style={{ flex: 1 }}>{issue.element}</span>
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '999px',
                      background: `${SEVERITY_COLORS[issue.severity]}22`,
                      color: SEVERITY_COLORS[issue.severity],
                    }}>
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
