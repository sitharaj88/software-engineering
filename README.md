# Software Engineering Hub

A comprehensive, interactive learning platform for mastering software engineering — from data structures and algorithms to system design, design patterns, and interview preparation.

**Live Site:** [https://sitharaj88.github.io/software-engineering/](https://sitharaj88.github.io/software-engineering/)

![Astro](https://img.shields.io/badge/Astro-5.0-BC52EE?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## What Makes This Platform Unique

Unlike static documentation sites, this platform features **9 interactive tools** built with React that bring concepts to life:

| Tool | Description |
|------|-------------|
| **Sorting Visualizer** | Step-by-step animation of 8 sorting algorithms with adjustable speed and array size |
| **Algorithm Racer** | Race sorting algorithms head-to-head on the same data with real-time performance metrics |
| **Pathfinding Visualizer** | Interactive grid for visualizing BFS, DFS, Dijkstra, and A* with wall drawing |
| **Data Structure Visualizer** | Build and manipulate BSTs, linked lists, stacks, queues, and hash tables visually |
| **Complexity Analyzer** | Interactive graph comparing O(1) to O(n!) with adjustable input size |
| **Pattern Matcher** | Describe a problem in plain English to identify the right algorithmic pattern |
| **Progress Tracker** | Track your learning progress across all topics with local storage persistence |
| **Quiz System** | Test your knowledge with topic-specific quizzes and detailed explanations |
| **Code Playground** | Multi-language code editor with syntax highlighting |

---

## Content Coverage

### Data Structures & Algorithms (22 pages)
- **Fundamentals:** Big O notation, time complexity, space complexity
- **Linear Structures:** Arrays, strings, linked lists, stacks, queues
- **Non-Linear Structures:** Hash tables, trees (BST, traversals), heaps, graphs
- **Algorithms:** Sorting (8 algorithms), binary search, recursion, backtracking, dynamic programming, greedy
- **Techniques:** Two pointers, sliding window, monotonic stack, BFS/DFS

### System Design (5 pages)
- Fundamentals (CAP theorem, REST, HTTP, DNS, load balancing)
- Databases (SQL vs NoSQL, indexing, sharding, replication)
- Scalability (caching, CDN, rate limiting, message queues)
- Case Studies (URL shortener, Twitter feed, chat system)

### Design Patterns (4 pages)
- Creational (Singleton, Factory Method, Abstract Factory, Builder, Prototype)
- Structural (Adapter, Decorator, Facade, Proxy, Composite, Bridge)
- Behavioral (Observer, Strategy, Command, State, Template Method, Iterator)

### Interview Preparation (4 pages)
- Coding interview guide with 15 essential patterns
- 76 curated problems organized by topic and difficulty
- Behavioral interview guide with STAR framework
- Company-specific preparation tips

All code examples are provided in **Python, JavaScript, Java, and C++**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Astro 5](https://astro.build) with [Starlight](https://starlight.astro.build) documentation theme |
| **Interactive Components** | [React 18](https://react.dev) with TypeScript |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com) + custom CSS |
| **Search** | [Pagefind](https://pagefind.app) (static search index) |
| **Content** | MDX with frontmatter schema validation |
| **Deployment** | GitHub Pages (static site from `/docs`) |

---

## Project Structure

```
software-engineering/
├── src/
│   ├── assets/                  # Static assets (hero image, etc.)
│   ├── components/
│   │   ├── interactive/         # 9 React interactive components
│   │   ├── ThemeSelect.astro    # Custom dark/light toggle switch
│   │   └── Footer.astro         # Custom footer with social links
│   ├── content/
│   │   ├── config.ts            # Content collection schemas
│   │   └── docs/                # 38 MDX content pages
│   │       ├── getting-started/
│   │       ├── dsa/             # Data Structures & Algorithms
│   │       ├── system-design/
│   │       ├── design-patterns/
│   │       └── interview-prep/
│   └── styles/
│       └── custom.css           # Theme overrides and component styles
├── astro.config.mjs             # Astro + Starlight configuration
├── tailwind.config.mjs          # Tailwind configuration
├── package.json
└── docs/                        # Built static site (GitHub Pages)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/sitharaj88/software-engineering.git
cd software-engineering
npm install
```

### Development

```bash
npm run dev
```

The dev server starts at `http://localhost:4321/software-engineering/`.

### Build

```bash
npm run build
```

Generates a static site in the `docs/` directory with a `.nojekyll` file for GitHub Pages compatibility.

### Preview

```bash
npm run preview
```

Preview the built site locally before deploying.

---

## Deployment

This site is configured for **GitHub Pages** deployment from the `/docs` folder:

1. Run `npm run build` to generate the static site
2. Commit and push the `docs/` folder
3. In GitHub repo settings, set Pages source to **Deploy from a branch** > `main` > `/docs`

The site will be available at `https://sitharaj88.github.io/software-engineering/`.

---

## Interactive Component Highlights

### Sorting Visualizer
Watch 8 sorting algorithms (Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix) animate step-by-step. Track comparisons and swaps in real time. Adjust array size and animation speed.

### Pathfinding Visualizer
Draw walls on a grid, place start/end points, and watch BFS, DFS, Dijkstra, and A* find the shortest path. Visualizes the exploration frontier and final path.

### Algorithm Racer
Select two sorting algorithms and race them on identical datasets. See which finishes first with a live progress bar and timing comparison.

### Data Structure Visualizer
Insert, delete, and search in BSTs with animated node movements. Visualize stack push/pop, queue enqueue/dequeue, and hash table operations.

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Report issues** — Found an inaccuracy or bug? [Open an issue](https://github.com/sitharaj88/software-engineering/issues)
2. **Add content** — Submit a PR with new topics, problems, or examples
3. **Improve visualizers** — Enhance existing interactive components or add new ones
4. **Fix bugs** — Check the issues tab for open bugs

### Content Guidelines

- All algorithm complexities must be accurate (average vs worst case clearly stated)
- Code examples should be provided in Python, JavaScript, Java, and C++ where applicable
- Use the existing frontmatter schema (`difficulty`, `prerequisites`, `topics`, `timeToRead`)
- Interactive components use `client:load` directive for hydration

---

## Author

**Sitharaj Seenivasan**

- Website: [sitharaj.in](https://sitharaj.in)
- GitHub: [@sitharaj88](https://github.com/sitharaj88)
- LinkedIn: [sitharaj08](https://linkedin.com/in/sitharaj08)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build)
- Algorithm visualizations inspired by [VisuAlgo](https://visualgo.net) and [Algorithm Visualizer](https://algorithm-visualizer.org)
- Problem bank curated from common FAANG interview patterns
