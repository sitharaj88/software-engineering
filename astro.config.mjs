import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://sitharaj88.github.io',
  base: '/software-engineering',
  outDir: './docs',
  integrations: [
    starlight({
      title: 'Software Engineering Hub',
      description: 'Master Data Structures, Algorithms, System Design, Design Patterns, and Interview Preparation',
      social: {
        github: 'https://github.com/sitharaj88/software-engineering',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started' },
            { label: 'How to Use This Site', slug: 'getting-started/how-to-use' },
            { label: 'Learning Paths', slug: 'getting-started/learning-paths' },
          ],
        },
        {
          label: 'Data Structures & Algorithms',
          items: [
            { label: 'Overview', slug: 'dsa' },
            {
              label: 'Fundamentals',
              items: [
                { label: 'Big O Notation', slug: 'dsa/fundamentals/big-o-notation' },
                { label: 'Time Complexity', slug: 'dsa/fundamentals/time-complexity' },
                { label: 'Space Complexity', slug: 'dsa/fundamentals/space-complexity' },
              ],
            },
            {
              label: 'Linear Data Structures',
              items: [
                { label: 'Arrays', slug: 'dsa/arrays' },
                { label: 'Two Pointers', slug: 'dsa/arrays/two-pointers' },
                { label: 'Sliding Window', slug: 'dsa/arrays/sliding-window' },
                { label: 'Strings', slug: 'dsa/strings' },
                { label: 'Linked Lists', slug: 'dsa/linked-lists' },
                { label: 'Stacks', slug: 'dsa/stacks' },
                { label: 'Queues', slug: 'dsa/queues' },
              ],
            },
            {
              label: 'Non-Linear Data Structures',
              items: [
                { label: 'Hash Tables', slug: 'dsa/hash-tables' },
                { label: 'Trees', slug: 'dsa/trees' },
                { label: 'Heaps', slug: 'dsa/heaps' },
                { label: 'Graphs', slug: 'dsa/graphs' },
              ],
            },
            {
              label: 'Algorithms',
              items: [
                { label: 'Sorting', slug: 'dsa/sorting' },
                { label: 'Binary Search', slug: 'dsa/searching/binary-search' },
                { label: 'Recursion', slug: 'dsa/recursion' },
                { label: 'Backtracking', slug: 'dsa/backtracking' },
                { label: 'Dynamic Programming', slug: 'dsa/dynamic-programming' },
                { label: 'Greedy', slug: 'dsa/greedy' },
              ],
            },
          ],
        },
        {
          label: 'System Design',
          items: [
            { label: 'Overview', slug: 'system-design' },
            { label: 'Fundamentals', slug: 'system-design/fundamentals' },
            { label: 'Databases', slug: 'system-design/databases' },
            { label: 'Scalability', slug: 'system-design/scalability' },
            { label: 'Case Studies', slug: 'system-design/case-studies' },
          ],
        },
        {
          label: 'Design Patterns',
          items: [
            { label: 'Overview', slug: 'design-patterns' },
            { label: 'Creational Patterns', slug: 'design-patterns/creational' },
            { label: 'Structural Patterns', slug: 'design-patterns/structural' },
            { label: 'Behavioral Patterns', slug: 'design-patterns/behavioral' },
          ],
        },
        {
          label: 'Interview Preparation',
          items: [
            { label: 'Overview', slug: 'interview-prep' },
            { label: 'Coding Interviews', slug: 'interview-prep/coding-interviews' },
            { label: 'Behavioral Interviews', slug: 'interview-prep/behavioral' },
            { label: 'Problem Bank (76 Problems)', slug: 'interview-prep/problem-bank' },
          ],
        },
      ],
    }),
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
});
