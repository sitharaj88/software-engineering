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
      description: 'Comprehensive software engineering education: Data Structures, Algorithms, System Design, Architecture, OS, Networking, DevOps, and more',
      social: {
        github: 'https://github.com/sitharaj88/software-engineering',
      },
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
        Footer: './src/components/Footer.astro',
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
          label: 'CS Fundamentals',
          items: [
            {
              label: 'OOP & SOLID Principles',
              items: [
                { label: 'Overview', slug: 'oop-solid' },
                { label: 'Four Pillars of OOP', slug: 'oop-solid/four-pillars' },
                { label: 'SOLID Principles', slug: 'oop-solid/solid-principles' },
                { label: 'Composition vs Inheritance', slug: 'oop-solid/composition-vs-inheritance' },
                { label: 'Code Smells & Refactoring', slug: 'oop-solid/design-smells' },
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
              label: 'Operating Systems',
              items: [
                { label: 'Overview', slug: 'operating-systems' },
                { label: 'Processes & Threads', slug: 'operating-systems/processes-threads' },
                { label: 'CPU Scheduling', slug: 'operating-systems/cpu-scheduling' },
                { label: 'Memory Management', slug: 'operating-systems/memory-management' },
                { label: 'Deadlocks & Synchronization', slug: 'operating-systems/deadlocks' },
              ],
            },
            {
              label: 'Computer Networks',
              items: [
                { label: 'Overview', slug: 'computer-networks' },
                { label: 'OSI Model & TCP/IP', slug: 'computer-networks/osi-tcp-ip' },
                { label: 'HTTP & HTTPS', slug: 'computer-networks/http-https' },
                { label: 'DNS, CDN & Routing', slug: 'computer-networks/dns-and-routing' },
                { label: 'WebSockets & Real-Time', slug: 'computer-networks/websockets-realtime' },
              ],
            },
            {
              label: 'Concurrency & Parallelism',
              items: [
                { label: 'Overview', slug: 'concurrency' },
                { label: 'Threads & Synchronization', slug: 'concurrency/threads-synchronization' },
                { label: 'Async Programming', slug: 'concurrency/async-programming' },
                { label: 'Race Conditions & Pitfalls', slug: 'concurrency/race-conditions' },
              ],
            },
            {
              label: 'Functional Programming',
              items: [
                { label: 'Overview', slug: 'functional-programming' },
                { label: 'Pure Functions & Immutability', slug: 'functional-programming/pure-functions' },
                { label: 'Higher-Order Functions', slug: 'functional-programming/higher-order-functions' },
                { label: 'Monads & Functors', slug: 'functional-programming/monads-functors' },
                { label: 'Pattern Matching & ADTs', slug: 'functional-programming/pattern-matching' },
              ],
            },
          ],
        },
        {
          label: 'Software Design & Architecture',
          items: [
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
              label: 'Software Architecture',
              items: [
                { label: 'Overview', slug: 'software-architecture' },
                { label: 'Clean & Layered Architecture', slug: 'software-architecture/clean-architecture' },
                { label: 'Microservices', slug: 'software-architecture/microservices' },
                { label: 'Event-Driven Architecture', slug: 'software-architecture/event-driven' },
                { label: 'Domain-Driven Design', slug: 'software-architecture/ddd' },
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
              label: 'API Design',
              items: [
                { label: 'Overview', slug: 'api-design' },
                { label: 'RESTful API Design', slug: 'api-design/rest-apis' },
                { label: 'GraphQL', slug: 'api-design/graphql' },
                { label: 'gRPC & Protocol Buffers', slug: 'api-design/grpc-protobuf' },
                { label: 'Auth, Versioning & Rate Limiting', slug: 'api-design/api-auth-versioning' },
              ],
            },
            {
              label: 'Database Engineering',
              items: [
                { label: 'Overview', slug: 'database-engineering' },
                { label: 'SQL Fundamentals', slug: 'database-engineering/sql-fundamentals' },
                { label: 'Normalization & Schema Design', slug: 'database-engineering/normalization-schema' },
                { label: 'Indexing & Query Performance', slug: 'database-engineering/indexing-performance' },
                { label: 'Transactions, ACID & NoSQL', slug: 'database-engineering/transactions-nosql' },
              ],
            },
            {
              label: 'AI/ML for Engineers',
              items: [
                { label: 'Overview', slug: 'ai-ml' },
                { label: 'ML Fundamentals', slug: 'ai-ml/ml-fundamentals' },
                { label: 'LLM & Prompt Engineering', slug: 'ai-ml/llm-prompt-engineering' },
                { label: 'RAG & Embeddings', slug: 'ai-ml/rag-embeddings' },
                { label: 'ML System Design', slug: 'ai-ml/ml-system-design' },
              ],
            },
          ],
        },
        {
          label: 'Infrastructure & Cloud',
          items: [
            {
              label: 'Distributed Systems',
              items: [
                { label: 'Overview', slug: 'distributed-systems' },
                { label: 'CAP Theorem & Consistency', slug: 'distributed-systems/cap-theorem' },
                { label: 'Replication & Partitioning', slug: 'distributed-systems/replication-partitioning' },
                { label: 'Consensus Algorithms', slug: 'distributed-systems/consensus-algorithms' },
                { label: 'Distributed Transactions', slug: 'distributed-systems/distributed-transactions' },
              ],
            },
            {
              label: 'Cloud Architecture',
              items: [
                { label: 'Overview', slug: 'cloud-architecture' },
                { label: 'Cloud Service Models', slug: 'cloud-architecture/service-models' },
                { label: 'Serverless Architecture', slug: 'cloud-architecture/serverless' },
                { label: 'Cloud Design Patterns', slug: 'cloud-architecture/cloud-patterns' },
                { label: 'Cost Optimization', slug: 'cloud-architecture/cost-optimization' },
              ],
            },
            {
              label: 'Message Queues & Streaming',
              items: [
                { label: 'Overview', slug: 'message-queues' },
                { label: 'Pub/Sub Patterns', slug: 'message-queues/pub-sub' },
                { label: 'Apache Kafka', slug: 'message-queues/kafka' },
                { label: 'RabbitMQ & AMQP', slug: 'message-queues/rabbitmq-amqp' },
                { label: 'Event Sourcing & CQRS', slug: 'message-queues/event-sourcing-cqrs' },
              ],
            },
            {
              label: 'Caching & Performance',
              items: [
                { label: 'Overview', slug: 'caching-performance' },
                { label: 'Caching Strategies', slug: 'caching-performance/caching-strategies' },
                { label: 'CDN & Edge Caching', slug: 'caching-performance/cdn-edge' },
                { label: 'Profiling & Benchmarking', slug: 'caching-performance/profiling-benchmarking' },
                { label: 'Connection Pooling & Load', slug: 'caching-performance/connection-pooling' },
              ],
            },
            {
              label: 'Data Engineering',
              items: [
                { label: 'Overview', slug: 'data-engineering' },
                { label: 'ETL Pipelines', slug: 'data-engineering/etl-pipelines' },
                { label: 'Data Warehousing', slug: 'data-engineering/data-warehousing' },
                { label: 'Stream Processing', slug: 'data-engineering/stream-processing' },
                { label: 'Data Quality & Governance', slug: 'data-engineering/data-quality' },
              ],
            },
          ],
        },
        {
          label: 'Engineering Practices',
          items: [
            {
              label: 'Version Control',
              items: [
                { label: 'Overview', slug: 'version-control' },
                { label: 'Git Fundamentals', slug: 'version-control/git-fundamentals' },
                { label: 'Branching Strategies', slug: 'version-control/branching-strategies' },
                { label: 'Code Review', slug: 'version-control/code-review' },
              ],
            },
            {
              label: 'Testing',
              items: [
                { label: 'Overview', slug: 'testing' },
                { label: 'Unit Testing', slug: 'testing/unit-testing' },
                { label: 'TDD & Mocking', slug: 'testing/tdd-mocking' },
                { label: 'Integration & E2E Testing', slug: 'testing/integration-e2e' },
              ],
            },
            {
              label: 'Security',
              items: [
                { label: 'Overview', slug: 'security' },
                { label: 'OWASP Top 10', slug: 'security/owasp-top-10' },
                { label: 'Auth & Encryption', slug: 'security/auth-encryption' },
                { label: 'Secure Coding Practices', slug: 'security/secure-coding' },
              ],
            },
            {
              label: 'DevOps',
              items: [
                { label: 'Overview', slug: 'devops' },
                { label: 'CI/CD Pipelines', slug: 'devops/ci-cd' },
                { label: 'Containers & Docker', slug: 'devops/containers-docker' },
                { label: 'Kubernetes Fundamentals', slug: 'devops/kubernetes' },
                { label: 'Monitoring, Observability & IaC', slug: 'devops/monitoring-iac' },
              ],
            },
            {
              label: 'SDLC & Agile',
              items: [
                { label: 'Overview', slug: 'sdlc-agile' },
                { label: 'Agile & Scrum', slug: 'sdlc-agile/agile-scrum' },
                { label: 'Kanban & Lean', slug: 'sdlc-agile/kanban-lean' },
                { label: 'Estimation & Planning', slug: 'sdlc-agile/estimation-planning' },
              ],
            },
            {
              label: 'Observability & SRE',
              items: [
                { label: 'Overview', slug: 'observability-sre' },
                { label: 'Logging & Metrics', slug: 'observability-sre/logging-metrics' },
                { label: 'Distributed Tracing', slug: 'observability-sre/distributed-tracing' },
                { label: 'Incident Response', slug: 'observability-sre/incident-response' },
                { label: 'SLOs & Error Budgets', slug: 'observability-sre/slos-error-budgets' },
              ],
            },
            {
              label: 'Linux & CLI',
              items: [
                { label: 'Overview', slug: 'linux-cli' },
                { label: 'Shell Scripting', slug: 'linux-cli/shell-scripting' },
                { label: 'File System & Permissions', slug: 'linux-cli/filesystem-permissions' },
                { label: 'Process Management', slug: 'linux-cli/process-management' },
                { label: 'Networking & Tools', slug: 'linux-cli/networking-tools' },
              ],
            },
          ],
        },
        {
          label: 'Specialized Topics',
          items: [
            {
              label: 'Web Fundamentals',
              items: [
                { label: 'Overview', slug: 'web-fundamentals' },
                { label: 'HTML & Semantic Markup', slug: 'web-fundamentals/html-semantic' },
                { label: 'CSS Layout & Responsive', slug: 'web-fundamentals/css-layout' },
                { label: 'JavaScript & DOM', slug: 'web-fundamentals/javascript-dom' },
                { label: 'Browser Internals', slug: 'web-fundamentals/browser-internals' },
              ],
            },
            {
              label: 'Regex & Text Processing',
              items: [
                { label: 'Overview', slug: 'regex-text' },
                { label: 'Regex Syntax & Patterns', slug: 'regex-text/regex-syntax' },
                { label: 'Advanced Regex', slug: 'regex-text/advanced-regex' },
                { label: 'Text Processing Tools', slug: 'regex-text/text-tools' },
              ],
            },
            {
              label: 'Cryptography',
              items: [
                { label: 'Overview', slug: 'cryptography' },
                { label: 'Symmetric & Asymmetric Encryption', slug: 'cryptography/symmetric-asymmetric' },
                { label: 'Hashing & Digital Signatures', slug: 'cryptography/hashing-signatures' },
                { label: 'TLS & PKI', slug: 'cryptography/tls-pki' },
              ],
            },
            {
              label: 'Accessibility & i18n',
              items: [
                { label: 'Overview', slug: 'accessibility-i18n' },
                { label: 'WCAG & ARIA', slug: 'accessibility-i18n/wcag-aria' },
                { label: 'i18n Patterns', slug: 'accessibility-i18n/i18n-patterns' },
                { label: 'Testing for Accessibility', slug: 'accessibility-i18n/a11y-testing' },
              ],
            },
            {
              label: 'Tech Leadership',
              items: [
                { label: 'Overview', slug: 'tech-leadership' },
                { label: 'Team Dynamics', slug: 'tech-leadership/team-dynamics' },
                { label: 'Technical Decision-Making', slug: 'tech-leadership/technical-decisions' },
                { label: 'Engineering Culture', slug: 'tech-leadership/engineering-culture' },
              ],
            },
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
