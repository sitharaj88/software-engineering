import { useState } from 'react';

interface Pattern {
  name: string;
  description: string;
  signals: string[];
  examples: string[];
  complexity: string;
  dataStructures: string[];
  category: string;
  tip: string;
}

const PATTERNS: Pattern[] = [
  {
    name: 'Two Pointers',
    description: 'Use two pointers moving towards each other or in the same direction to solve problems involving sorted arrays or linked lists.',
    signals: ['sorted array', 'pair with target sum', 'remove duplicates', 'palindrome', 'two ends', 'in-place'],
    examples: ['Two Sum (sorted)', 'Container With Most Water', 'Valid Palindrome', '3Sum', 'Remove Duplicates from Sorted Array'],
    complexity: 'O(n)',
    dataStructures: ['Array', 'Linked List'],
    category: 'Array',
    tip: 'Start with pointers at both ends and move inward based on the comparison with target.',
  },
  {
    name: 'Sliding Window',
    description: 'Maintain a window of elements that slides through an array to find optimal subarrays or substrings.',
    signals: ['contiguous subarray', 'substring', 'window size', 'maximum sum', 'minimum length', 'at most k'],
    examples: ['Maximum Subarray Sum', 'Longest Substring Without Repeating Characters', 'Minimum Window Substring', 'Fruit Into Baskets'],
    complexity: 'O(n)',
    dataStructures: ['Array', 'String', 'Hash Map'],
    category: 'Array',
    tip: 'Expand the window by moving the right pointer, shrink by moving the left pointer when condition is violated.',
  },
  {
    name: 'Binary Search',
    description: 'Divide the search space in half each iteration. Works on sorted data or monotonic functions.',
    signals: ['sorted', 'find target', 'minimum/maximum that satisfies', 'search space', 'rotated array', 'O(log n)'],
    examples: ['Binary Search', 'Search in Rotated Sorted Array', 'Find First and Last Position', 'Koko Eating Bananas', 'Median of Two Sorted Arrays'],
    complexity: 'O(log n)',
    dataStructures: ['Array'],
    category: 'Search',
    tip: 'Define the invariant clearly: what does left represent? What does right represent? Check the mid condition.',
  },
  {
    name: 'BFS (Breadth-First Search)',
    description: 'Level-by-level traversal. Best for shortest path in unweighted graphs, level-order tree traversal.',
    signals: ['shortest path', 'level order', 'minimum steps', 'nearest', 'layer by layer', 'unweighted graph'],
    examples: ['Binary Tree Level Order Traversal', 'Shortest Path in Grid', 'Word Ladder', 'Rotting Oranges', 'Open the Lock'],
    complexity: 'O(V + E)',
    dataStructures: ['Queue', 'Graph', 'Tree'],
    category: 'Graph',
    tip: 'Use a queue. Track visited nodes. Process all nodes at current level before moving to next.',
  },
  {
    name: 'DFS (Depth-First Search)',
    description: 'Explore as deep as possible before backtracking. Best for path finding, connected components.',
    signals: ['all paths', 'connected components', 'islands', 'permutations', 'cycle detection', 'tree traversal'],
    examples: ['Number of Islands', 'Path Sum', 'Clone Graph', 'Course Schedule', 'All Paths From Source to Target'],
    complexity: 'O(V + E)',
    dataStructures: ['Stack', 'Graph', 'Tree'],
    category: 'Graph',
    tip: 'Use recursion or explicit stack. Mark nodes as visited before exploring neighbors.',
  },
  {
    name: 'Dynamic Programming',
    description: 'Break problem into overlapping subproblems. Store results to avoid recomputation.',
    signals: ['optimal', 'maximum/minimum', 'how many ways', 'can you reach', 'overlapping subproblems', 'choices at each step'],
    examples: ['Climbing Stairs', 'Coin Change', 'Longest Common Subsequence', 'House Robber', '0/1 Knapsack'],
    complexity: 'Varies',
    dataStructures: ['Array', 'Matrix'],
    category: 'DP',
    tip: 'Define state clearly. Write the recurrence relation. Decide top-down (memo) vs bottom-up (tabulation).',
  },
  {
    name: 'Backtracking',
    description: 'Systematically explore all possibilities by making choices and undoing them if they lead to dead ends.',
    signals: ['generate all', 'permutations', 'combinations', 'subsets', 'valid configuration', 'constraint satisfaction'],
    examples: ['N-Queens', 'Subsets', 'Permutations', 'Combination Sum', 'Sudoku Solver', 'Word Search'],
    complexity: 'O(2ⁿ) or O(n!)',
    dataStructures: ['Array', 'Matrix'],
    category: 'Recursion',
    tip: 'Choose → Explore → Unchoose. Add pruning conditions early to reduce search space.',
  },
  {
    name: 'Hash Map',
    description: 'Use hash map for O(1) lookup to track frequencies, indices, or complements.',
    signals: ['frequency count', 'find complement', 'group by', 'anagram', 'two sum', 'first non-repeating'],
    examples: ['Two Sum', 'Group Anagrams', 'Top K Frequent Elements', 'Valid Anagram', 'Subarray Sum Equals K'],
    complexity: 'O(n)',
    dataStructures: ['Hash Map', 'Hash Set'],
    category: 'Hash',
    tip: 'Think about what to store as key vs value. Counter/frequency maps are extremely common.',
  },
  {
    name: 'Stack',
    description: 'LIFO structure for matching pairs, monotonic sequences, or evaluating expressions.',
    signals: ['matching parentheses', 'next greater element', 'valid expression', 'monotonic', 'undo/history'],
    examples: ['Valid Parentheses', 'Daily Temperatures', 'Next Greater Element', 'Evaluate Reverse Polish Notation', 'Min Stack'],
    complexity: 'O(n)',
    dataStructures: ['Stack'],
    category: 'Stack',
    tip: 'For monotonic stack: decide if maintaining increasing or decreasing order. Pop elements that violate.',
  },
  {
    name: 'Heap / Priority Queue',
    description: 'Efficiently track minimum or maximum elements. Essential for top-K and merge-K problems.',
    signals: ['top k', 'kth largest/smallest', 'merge k sorted', 'median', 'schedule', 'priority'],
    examples: ['Kth Largest Element', 'Merge K Sorted Lists', 'Find Median from Data Stream', 'Task Scheduler', 'Top K Frequent Elements'],
    complexity: 'O(n log k)',
    dataStructures: ['Heap', 'Priority Queue'],
    category: 'Heap',
    tip: 'For top-K largest, use a min-heap of size K. For top-K smallest, use a max-heap of size K.',
  },
  {
    name: 'Greedy',
    description: 'Make locally optimal choices at each step. Works when local optima lead to global optimum.',
    signals: ['minimum number of', 'maximum profit', 'scheduling', 'interval', 'greedy choice property'],
    examples: ['Jump Game', 'Merge Intervals', 'Non-overlapping Intervals', 'Gas Station', 'Assign Cookies'],
    complexity: 'O(n log n)',
    dataStructures: ['Array', 'Intervals'],
    category: 'Greedy',
    tip: 'Sort first if needed. Prove the greedy choice property: why does choosing locally optimal work globally?',
  },
  {
    name: 'Union-Find',
    description: 'Track connected components efficiently. Support union and find operations in near O(1).',
    signals: ['connected components', 'group membership', 'merge groups', 'cycle in undirected graph', 'redundant connection'],
    examples: ['Number of Connected Components', 'Redundant Connection', 'Accounts Merge', 'Longest Consecutive Sequence'],
    complexity: 'O(α(n)) ≈ O(1)',
    dataStructures: ['Array'],
    category: 'Graph',
    tip: 'Use path compression and union by rank for optimal performance.',
  },
];

export default function PatternMatcher() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const categories = ['All', ...new Set(PATTERNS.map((p) => p.category))];

  const filteredPatterns = PATTERNS.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    if (!searchText.trim()) return matchesCategory;
    const search = searchText.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(search) ||
      p.signals.some((s) => s.toLowerCase().includes(search)) ||
      p.description.toLowerCase().includes(search) ||
      p.examples.some((e) => e.toLowerCase().includes(search));
    return matchesCategory && matchesSearch;
  });

  const categoryColors: Record<string, string> = {
    Array: '#3b82f6', Search: '#8b5cf6', Graph: '#10b981', DP: '#f59e0b', Recursion: '#ef4444', Hash: '#06b6d4', Stack: '#f97316', Heap: '#ec4899', Greedy: '#84cc16',
  };

  return (
    <div style={{ border: '1px solid var(--sl-color-gray-5)', borderRadius: '0.75rem', overflow: 'hidden', margin: '1.5rem 0' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sl-color-gray-5)', background: 'var(--sl-color-gray-6)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Algorithm Pattern Matcher</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' }}>Describe your problem to find the right algorithmic pattern</p>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder='Describe your problem... e.g., "find pair with target sum" or "shortest path"'
            style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '0.5rem', border: '2px solid var(--sl-color-gray-4)', background: 'var(--sl-color-bg)', color: 'var(--sl-color-text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{ height: '1.75rem', padding: '0 0.75rem', minWidth: '3.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '999px', border: selectedCategory === cat ? '2px solid #0066cc' : '2px solid var(--sl-color-gray-4)', background: selectedCategory === cat ? '#0066cc' : 'transparent', color: selectedCategory === cat ? '#fff' : 'var(--sl-color-text)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1 }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredPatterns.map((pattern) => {
            const isExpanded = expandedPattern === pattern.name;
            const catColor = categoryColors[pattern.category] || '#6b7280';

            return (
              <div key={pattern.name} style={{ border: `1px solid ${isExpanded ? catColor : 'var(--sl-color-gray-5)'}`, borderRadius: '0.5rem', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <button onClick={() => setExpandedPattern(isExpanded ? null : pattern.name)}
                  style={{ width: '100%', padding: '0.8rem 1rem', border: 'none', background: isExpanded ? `${catColor}10` : 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700, background: `${catColor}20`, color: catColor }}>{pattern.category}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sl-color-text)' }}>{pattern.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-3)', fontFamily: 'monospace' }}>{pattern.complexity}</span>
                  </div>
                  <span style={{ color: 'var(--sl-color-gray-3)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 1rem 1rem', borderTop: `1px solid ${catColor}30` }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--sl-color-gray-2)', lineHeight: 1.6, marginTop: '0.75rem' }}>{pattern.description}</p>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Signals</div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {pattern.signals.map((s) => {
                          const isMatch = searchText && s.toLowerCase().includes(searchText.toLowerCase());
                          return (
                            <span key={s} style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.72rem', background: isMatch ? `${catColor}30` : 'var(--sl-color-gray-6)', color: isMatch ? catColor : 'var(--sl-color-gray-2)', border: isMatch ? `1px solid ${catColor}` : '1px solid transparent', fontWeight: isMatch ? 700 : 400 }}>
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classic Problems</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {pattern.examples.map((e) => (
                          <span key={e} style={{ fontSize: '0.8rem', color: 'var(--sl-color-gray-2)' }}>• {e}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sl-color-gray-3)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Structures Used</div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {pattern.dataStructures.map((ds) => (
                          <span key={ds} style={{ padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.72rem', background: 'var(--sl-color-gray-6)', color: 'var(--sl-color-gray-2)', fontFamily: 'monospace' }}>{ds}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '0.6rem 0.8rem', borderRadius: '0.375rem', background: '#0066cc10', border: '1px solid #0066cc30', fontSize: '0.8rem', color: '#0066cc' }}>
                      <strong>Pro Tip:</strong> {pattern.tip}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredPatterns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sl-color-gray-3)' }}>
            <p>No patterns match your search. Try different keywords.</p>
            <p style={{ fontSize: '0.8rem' }}>Examples: "sorted array", "shortest path", "subsequence", "permutations"</p>
          </div>
        )}
      </div>
    </div>
  );
}
