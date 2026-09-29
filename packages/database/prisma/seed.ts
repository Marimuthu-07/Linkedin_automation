import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (DEMO DATA ONLY)...');

  // 1. Clean existing records (in reverse relation order)
  await prisma.contentMetric.deleteMany();
  await prisma.contentRevision.deleteMany();
  await prisma.contentPost.deleteMany();
  await prisma.networkingMessage.deleteMany();
  await prisma.networkingContact.deleteMany();
  await prisma.leadInteraction.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.task.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.userSettings.deleteMany();

  // 2. User Settings
  await prisma.userSettings.create({
    data: {
      userName: 'Alex Chen',
      userTitle: 'Software Engineering Student | Full-Stack & Systems',
      userBio: 'Computer Science senior focused on TypeScript, React, distributed Node.js backends, and AI engineering workflows.',
      targetRoles: ['Software Engineer', 'Full Stack Engineer', 'Backend Engineer', 'AI Engineer'],
      targetLocations: ['San Francisco, CA', 'New York, NY', 'Remote', 'Seattle, WA'],
      targetTechnologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Next.js', 'Python'],
      minInternshipMatchScore: 70,
      freelanceServices: [
        'High-Performance Web Applications',
        'Website Redesign & Conversion UX',
        'AI Workflow Integration',
        'Landing Page Optimization',
      ],
      aiProvider: 'mock',
      weeklyPostingGoal: 3,
      dailyNetworkingGoal: 5,
    },
  });

  // 3. Seed 10 Realistic Networking Contacts (Fictional Demo Data)
  const networkingData = [
    {
      name: 'Elena Rostova (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-elena-rostova',
      headline: 'Staff Infrastructure Engineer @ CloudScale Systems',
      role: 'Staff Infrastructure Engineer',
      company: 'CloudScale Systems',
      location: 'San Francisco, CA',
      category: 'SOFTWARE_ENGINEER',
      source: 'GitHub Distributed Systems Repo',
      relevanceReason: 'Open sourced a high-throughput queue library in Go/Rust that aligns with my database indexing project.',
      notes: 'Spoke at Distributed Systems Summit 2025. Very receptive to technical deep dives.',
      messageDraft: 'Hi Elena, loved your recent talk on Raft consensus edge cases in distributed storage. I implemented a minimal Raft coordinator in Go last month and would love to follow your work on CloudScale.',
      status: 'APPROVED',
      lastInteractionAt: new Date(Date.now() - 3 * 86400000),
      nextFollowUpAt: new Date(), // Due Today
    },
    {
      name: 'Marcus Vance (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-marcus-vance',
      headline: 'Founding Engineer & CTO @ NextWave AI',
      role: 'Founding Engineer & CTO',
      company: 'NextWave AI',
      location: 'New York, NY',
      category: 'FOUNDER',
      source: 'ProductHunt Launch',
      relevanceReason: 'Building an AI agent playground using TypeScript and LLM structured outputs.',
      notes: 'Looking for full-stack engineer interns who understand streaming UI and edge runtime.',
      messageDraft: 'Hi Marcus, huge congrats on the NextWave v2 release. The multi-agent visual debugger is slick. As a CS student working on human-in-the-loop agent systems, I’d love to connect and follow your journey.',
      status: 'CONTACTED',
      lastInteractionAt: new Date(Date.now() - 5 * 86400000),
      nextFollowUpAt: new Date(Date.now() - 2 * 86400000), // Overdue
    },
    {
      name: 'Priya Sharma (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-priya-sharma',
      headline: 'Engineering Manager - Platform @ FinFlow Tech',
      role: 'Engineering Manager',
      company: 'FinFlow Tech',
      location: 'Seattle, WA',
      category: 'HIRING_MANAGER',
      source: 'Alumni Network',
      relevanceReason: 'Leading the developer experience & API platform team at FinFlow.',
      notes: 'University alum (class of 2019). Highly active in student mentoring.',
      messageDraft: 'Hi Priya, hope you are having a great week. I am a fellow state university CS senior focusing on developer infrastructure and API design. Would love to stay connected as I prepare for 2026 new grad roles!',
      status: 'REPLIED',
      lastInteractionAt: new Date(Date.now() - 2 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 3 * 86400000), // Upcoming in 3 days
    },
    {
      name: 'David Kim (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-david-kim',
      headline: 'Senior Technical Recruiter @ Apex Robotics',
      role: 'Senior Technical Recruiter',
      company: 'Apex Robotics',
      location: 'Remote',
      category: 'RECRUITER',
      source: 'LinkedIn Search',
      relevanceReason: 'Recruiting for Summer 2026 software engineering & robotics infrastructure interns.',
      notes: 'Prefers concise GitHub links and demonstrable systems projects.',
      messageDraft: 'Hi David, noticed Apex Robotics is expanding the software infrastructure team. I have built several full-stack and systems projects in TypeScript/Rust and would love to keep in touch regarding future internship openings.',
      status: 'REVIEWING',
    },
    {
      name: 'Aisha Al-Mansoor (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-aisha-mansoor',
      headline: 'Lead AI Research Engineer @ NeuralMesh',
      role: 'Lead AI Research Engineer',
      company: 'NeuralMesh',
      location: 'Austin, TX',
      category: 'AI_ENGINEER',
      source: 'Arxiv Paper Citation',
      relevanceReason: 'Author of paper on structured JSON generation and speculative decoding.',
      notes: 'Writes comprehensive technical blogs on transformer architectures.',
      messageDraft: 'Hi Aisha, your paper on deterministic schema enforcement in generative LLMs was super helpful for my senior capstone project. Thank you for making your benchmarks public!',
      status: 'CONNECTED',
      lastInteractionAt: new Date(Date.now() - 7 * 86400000),
    },
    {
      name: 'Julian Thorne (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-julian-thorne',
      headline: 'Product Designer & Design Systems Lead @ Prism UI',
      role: 'Product Designer',
      company: 'Prism UI',
      location: 'San Francisco, CA',
      category: 'DESIGNER',
      source: 'Design Twitter / X',
      relevanceReason: 'Expert on accessible component systems and Tailwind token architectures.',
      notes: 'Looking to refine UI polish and design tokens on my personal developer tools.',
      status: 'DISCOVERED',
    },
    {
      name: 'Kavita Patel (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-kavita-patel',
      headline: 'Principal Backend Architect @ HyperGrid Cloud',
      role: 'Principal Backend Architect',
      company: 'HyperGrid Cloud',
      location: 'San Jose, CA',
      category: 'SOFTWARE_ENGINEER',
      source: 'PostgreSQL Conference',
      relevanceReason: 'PostgreSQL partitioning and high-concurrency connection pooling expert.',
      status: 'FOLLOW_UP',
      lastInteractionAt: new Date(Date.now() - 5 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 1 * 86400000), // Upcoming tomorrow
      messageDraft: 'Hi Kavita, thanks again for the connection! Just finished reading your blog post on connection pooling overhead with PgBouncer. Truly insightful comparison.',
    },
    {
      name: 'Carlos Mendoza (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-carlos-mendoza',
      headline: 'Tech Creator & Developer Advocate @ DevStream',
      role: 'Developer Advocate',
      company: 'DevStream',
      location: 'Remote',
      category: 'CREATOR',
      source: 'YouTube / Substack',
      relevanceReason: 'Publishes excellent breakdowns on building in public and developer portfolios.',
      status: 'DISCOVERED',
    },
    {
      name: 'Zoe Washington (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-zoe-washington',
      headline: 'Engineering Director @ QuantumBridge Labs',
      role: 'Engineering Director',
      company: 'QuantumBridge Labs',
      location: 'Boston, MA',
      category: 'HIRING_MANAGER',
      source: 'Career Fair Panel',
      relevanceReason: 'Oversees 40+ engineers across full-stack and cloud automation services.',
      status: 'APPROVED',
      messageDraft: 'Hi Zoe, loved your panel remarks on how junior engineers can build genuine ownership through end-to-end tooling. I would love to connect and follow updates from QuantumBridge.',
    },
    {
      name: 'Liam O’Connor (DEMO)',
      linkedinUrl: 'https://www.linkedin.com/in/demo-liam-oconnor',
      headline: 'Founder & CEO @ ShipFast Studio',
      role: 'Founder & CEO',
      company: 'ShipFast Studio',
      location: 'Dublin, Ireland / Remote',
      category: 'FOUNDER',
      source: 'IndieHackers',
      relevanceReason: 'High volume agency building Next.js web applications for early-stage B2B startups.',
      status: 'ARCHIVED',
      notes: 'Outreach completed; currently keeping in passive network.',
    },
  ];

  for (const c of networkingData) {
    const contact = await prisma.networkingContact.create({ data: c });
    if (c.messageDraft) {
      await prisma.networkingMessage.create({
        data: {
          contactId: contact.id,
          type: 'CONNECTION_REQUEST',
          content: c.messageDraft,
          personalizationBasis: [
            c.role ? 'Role' : '',
            c.company ? 'Company' : '',
            c.relevanceReason ? 'RelevanceReason' : '',
          ].filter(Boolean),
          status: c.status === 'APPROVED' ? 'DRAFT' : c.status === 'CONTACTED' || c.status === 'REPLIED' || c.status === 'CONNECTED' ? 'USED' : 'DRAFT',
        },
      });
    }
  }

  // 4. Seed 10 Content Posts across Statuses, Revisions & Performance Metrics
  const contentPostsData = [
    {
      title: 'How I reduced Node.js memory footprint by 60% with streaming buffers',
      hook: 'Most Node.js backends accidentally buffer entire file uploads in RAM. Here is how switching to true streams saved our server bills: 👇',
      body: `When handling multi-megabyte payloads, 'fs.readFile' and naive buffer accumulation force V8 into constant garbage collection cycles.

In our recent project, we refactored file processing to use Node.js Transform streams with backpressure control:

1. Replaced monolithic memory buffers with chunked piping
2. Tuned highWaterMark for consistent throughput
3. Handled stream pipeline errors gracefully with 'stream.promises.pipeline'

Result:
- Peak RAM dropped from 850MB to 110MB under load
- Zero OOM crashes during concurrent uploads
- Throughput remained rock steady at 45MB/s

The lesson? Always let the event loop breathe. Never buffer what you can stream.`,
      cta: 'What is your go-to technique for managing memory in Node services? Drop your thoughts below!',
      category: 'SOFTWARE_ENGINEERING',
      status: 'PUBLISHED',
      targetAudience: 'Backend Engineers & Node.js Developers',
      tone: 'AUTHENTIC_TECHNICAL',
      hashtags: ['nodejs', 'backend', 'performance', 'softwareengineering'],
      tags: ['nodejs', 'backend', 'performance', 'softwareengineering'],
      publishedAt: new Date(Date.now() - 6 * 86400000),
      publishedManually: true,
      externalPostUrl: 'https://www.linkedin.com/posts/alexchen-demo-nodejs-streams-activity',
      revisionCount: 2,
      alternativeHooks: [
        'Stop crashing your Node.js servers with unbuffered memory allocations.',
        'Why stream pipelines are the most underrated superpower in Node.js:',
      ],
      revisions: [
        {
          revisionNumber: 1,
          title: 'How I reduced Node.js memory footprint by 60%',
          hook: 'Node.js memory management is tricky with big file uploads.',
          body: 'We switched from buffers to streams in Node.js and got 60% RAM reduction.',
          cta: 'Thoughts on Node streaming?',
          hashtags: ['nodejs', 'backend'],
          createdBy: 'USER',
        },
        {
          revisionNumber: 2,
          title: 'How I reduced Node.js memory footprint by 60% with streaming buffers',
          hook: 'Most Node.js backends accidentally buffer entire file uploads in RAM. Here is how switching to true streams saved our server bills: 👇',
          body: `When handling multi-megabyte payloads, 'fs.readFile' and naive buffer accumulation force V8 into constant garbage collection cycles. Refactored to Transform streams with backpressure.`,
          cta: 'What is your go-to technique for managing memory in Node services? Drop your thoughts below!',
          hashtags: ['nodejs', 'backend', 'performance', 'softwareengineering'],
          createdBy: 'AI',
        },
      ],
      metricSnapshots: [
        {
          recordedAt: new Date(Date.now() - 5 * 86400000),
          impressions: 1200,
          reactions: 42,
          comments: 8,
          reposts: 3,
          clicks: 22,
          engagementRate: 6.25, // (42+8+3+22)/1200 * 100 = 6.25%
        },
        {
          recordedAt: new Date(Date.now() - 2 * 86400000),
          impressions: 3400,
          reactions: 118,
          comments: 24,
          reposts: 9,
          clicks: 65,
          engagementRate: 6.35, // (118+24+9+65)/3400 * 100 = 6.35%
        },
        {
          recordedAt: new Date(Date.now() - 1 * 86400000),
          impressions: 4200,
          reactions: 148,
          comments: 32,
          reposts: 12,
          clicks: 84,
          engagementRate: 6.57, // (148+32+12+84)/4200 * 100 = 6.57%
        },
      ],
    },
    {
      title: 'Database indexing: What B-Trees actually do under the hood',
      hook: 'Adding an index to your database is not magic. It is a calculated trade-off between read speed and write amplification.',
      body: `Here is what happens when you run 'CREATE INDEX idx_users_email ON users(email);':

1. The database creates a self-balancing B+ Tree structure on disk.
2. Search time drops from O(N) sequential table scan to O(log N) tree depth traversal.
3. Every INSERT, UPDATE, or DELETE on that table now incurs extra I/O to rebalance tree nodes.

Rules of thumb:
- Index columns used in WHERE, JOIN, and ORDER BY clauses with high selectivity.
- Avoid indexing low-cardinality columns (like boolean flags).
- Check your 'EXPLAIN ANALYZE' before and after.

Indexes are like medicine: the right dose cures performance bottlenecks, but an overdose slows your entire system down.`,
      cta: 'How often do you inspect your query execution plans? Let’s discuss in the comments.',
      category: 'DATABASES',
      status: 'PUBLISHED',
      targetAudience: 'Software Engineers & Database Architects',
      tone: 'ENGINEERING_INSIGHT',
      hashtags: ['postgresql', 'databases', 'systemdesign', 'indexing'],
      tags: ['postgresql', 'databases', 'systemdesign', 'indexing'],
      publishedAt: new Date(Date.now() - 3 * 86400000),
      publishedManually: true,
      externalPostUrl: 'https://www.linkedin.com/posts/alexchen-demo-btrees-postgres-activity',
      revisionCount: 1,
      alternativeHooks: [
        'Why more database indexes often make your web app slower, not faster:',
        'Understanding PostgreSQL B-Trees without the academic jargon:',
      ],
      revisions: [
        {
          revisionNumber: 1,
          title: 'Database indexing: What B-Trees actually do under the hood',
          hook: 'Adding an index to your database is not magic. It is a calculated trade-off between read speed and write amplification.',
          body: `Here is what happens when you run 'CREATE INDEX idx_users_email ON users(email);':\n1. Self-balancing B+ Tree on disk.\n2. O(log N) search.\n3. Write amplification.`,
          cta: 'How often do you inspect your query execution plans? Let’s discuss in the comments.',
          hashtags: ['postgresql', 'databases', 'systemdesign', 'indexing'],
          createdBy: 'USER',
        },
      ],
      metricSnapshots: [
        {
          recordedAt: new Date(Date.now() - 2 * 86400000),
          impressions: 2900,
          reactions: 104,
          comments: 18,
          reposts: 11,
          clicks: 48,
          engagementRate: 6.24, // (104+18+11+48)/2900 * 100 = 6.24%
        },
        {
          recordedAt: new Date(Date.now() - 1 * 86400000),
          impressions: 6850,
          reactions: 230,
          comments: 45,
          reposts: 28,
          clicks: 110,
          engagementRate: 6.03, // (230+45+28+110)/6850 * 100 = 6.03%
        },
      ],
    },
    {
      title: 'Building a Human-in-the-Loop AI Assistant: Why full automation fails',
      hook: 'The biggest mistake developers make when integrating LLMs into productivity tools is removing the human from the confirmation loop.',
      body: `Automating tasks completely sounds impressive until an LLM hallucinates a parameter, sends an awkward cold DM, or executes an unintended database mutation.

In our architecture:
DISCOVER ➔ ANALYZE ➔ GENERATE ➔ QUEUE ➔ USER APPROVES ➔ USER ACTS

Why this model wins:
1. Zero risk of account bans or reputation damage
2. AI handles research and drafting; humans provide critical judgment and nuance
3. Continuous calibration of prompt templates based on user edits

Automation should augment human capability, not impersonate human relationships.`,
      cta: 'Are you building AI workflows that keep humans in the loop? Share your architectural approach!',
      category: 'AI',
      status: 'SCHEDULED',
      targetAudience: 'AI Engineers & Product Builders',
      tone: 'AUTHENTIC_TECHNICAL',
      scheduledAt: new Date(Date.now() + 1 * 86400000),
      hashtags: ['artificialintelligence', 'architecture', 'softwareengineering', 'productivity'],
      tags: ['artificialintelligence', 'architecture', 'softwareengineering', 'productivity'],
      notes: 'SCHEDULED — MANUAL PUBLISH REQUIRED upon reminder trigger.',
      revisionCount: 1,
      revisions: [
        {
          revisionNumber: 1,
          title: 'Building a Human-in-the-Loop AI Assistant: Why full automation fails',
          hook: 'The biggest mistake developers make when integrating LLMs into productivity tools is removing the human from the confirmation loop.',
          body: `Automating tasks completely sounds impressive until an LLM hallucinates. Keep humans in the loop.`,
          cta: 'Are you building AI workflows that keep humans in the loop? Share your architectural approach!',
          hashtags: ['artificialintelligence', 'architecture', 'softwareengineering', 'productivity'],
          createdBy: 'USER',
        },
      ],
    },
    {
      title: '5 Linux CLI tools every CS student should master early',
      hook: 'You do not need to memorize 1,000 bash commands. Mastering these 5 tools will cover 90% of your terminal workflows:',
      body: `1. 'ripgrep' (rg): Instant regex searching across gigabytes of code.
2. 'jq': The undisputed king of slicing and validating JSON in terminal pipelines.
3. 'htop' / 'btop': Visual resource monitoring and process thread tracking.
4. 'tmux': Persistent terminal sessions that survive SSH disconnects.
5. 'curl -v' & 'nc -zv': Network debugging and port connectivity testing.

Terminal fluency isn’t about being a wizard; it’s about shortening the feedback loop between an idea and an answer.`,
      cta: 'Which terminal tool do you find yourself using every single day?',
      category: 'LINUX',
      status: 'APPROVED',
      targetAudience: 'CS Students & Junior Developers',
      tone: 'LEARNING_PROGRESS',
      hashtags: ['linux', 'developer', 'terminal', 'productivity'],
      tags: ['linux', 'developer', 'terminal', 'productivity'],
      revisionCount: 1,
      revisions: [
        {
          revisionNumber: 1,
          title: '5 Linux CLI tools every CS student should master early',
          hook: 'You do not need to memorize 1,000 bash commands. Mastering these 5 tools will cover 90% of your terminal workflows:',
          body: '1. ripgrep, 2. jq, 3. htop, 4. tmux, 5. curl & nc.',
          cta: 'Which terminal tool do you find yourself using every single day?',
          hashtags: ['linux', 'developer', 'terminal', 'productivity'],
          createdBy: 'USER',
        },
      ],
    },
    {
      title: 'Refactoring React state from useState spaghetti to clean state machines',
      hook: 'If your React component has 8 different `useState` boolean flags, you don’t have state—you have an impossible state explosion.',
      body: `Instead of:
const [isLoading, setIsLoading] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [isError, setIsError] = useState(false);

Use an explicit status enum or reducer:
type Status = 'idle' | 'loading' | 'success' | 'error';

This prevents invalid combinations (like 'isLoading === true && isSuccess === true') and makes UI rendering bulletproof.`,
      cta: 'Have you transitioned complex UI components to explicit state machines?',
      category: 'WEB_DEVELOPMENT',
      status: 'REVIEW',
      targetAudience: 'Frontend Developers & React Engineers',
      tone: 'ENGINEERING_INSIGHT',
      hashtags: ['react', 'typescript', 'frontend', 'cleanarchitecture'],
      tags: ['react', 'typescript', 'frontend', 'cleanarchitecture'],
      revisionCount: 1,
    },
    {
      title: 'Lessons learned building an open source LinkedIn growth dashboard in TypeScript',
      hook: 'I spent the last 2 weeks building a full-stack personal productivity suite. Here are 3 architecture decisions I am glad I made:',
      body: `1. Strict End-to-End Zod Schemas: Shared contracts between Express and React Vite.
2. Transparent Deterministic Scoring: No mysterious AI scores for lead qualification—every score shows exact mathematical reasons.
3. Manual Action Gatekeeping: Eliminating fragile browser scrapers and unauthorized bots entirely.`,
      cta: 'Check out the project architecture notes in my GitHub repo!',
      category: 'OPEN_SOURCE',
      status: 'DRAFT',
      targetAudience: 'Full Stack Developers & Student Builders',
      tone: 'AUTHENTIC_TECHNICAL',
      hashtags: ['buildinpublic', 'fullstack', 'typescript', 'opensource'],
      tags: ['buildinpublic', 'fullstack', 'typescript', 'opensource'],
      revisionCount: 1,
    },
    {
      title: 'How to prepare for Software Engineering Internship Technical Interviews in 2026',
      hook: 'Grinding 500 LeetCode problems blindly is the slowest way to prepare for engineering interviews.',
      body: `A more effective, structured 4-step framework:
1. Master core data structures (Arrays, HashMaps, Trees, Graphs) and their time/space bounds.
2. Learn pattern templates: Two Pointers, Sliding Window, DFS/BFS, Topological Sort.
3. Practice communicating edge cases before writing a single line of code.
4. Build real-world portfolio systems that demonstrate distributed systems or frontend craftsmanship.`,
      cta: 'What is your biggest challenge when preparing for technical interviews?',
      category: 'CAREER',
      status: 'IDEA',
      idea: 'Need to write a post on structured LeetCode prep vs portfolio building for summer 2026 interns.',
      hashtags: ['internships', 'interviews', 'careers', 'computerscience'],
      tags: ['internships', 'interviews', 'careers', 'computerscience'],
      revisionCount: 1,
    },
    {
      title: 'Why I prefer Prisma over raw SQL for rapid TypeScript prototyping',
      hook: 'Raw SQL gives maximum power, but Prisma gives unmatched type-safety and developer velocity.',
      body: `Auto-generated TypeScript types, instant schema migrations, and declarative relations make refactoring effortless during rapid development.`,
      category: 'DEV_TOOLS',
      status: 'IDEA',
      idea: 'Quick breakdown of Prisma vs raw SQL migration trade-offs during student hackathons and fast prototyping.',
      hashtags: ['prisma', 'typescript', 'backend'],
      tags: ['prisma', 'typescript', 'backend'],
    },
    {
      title: 'Demystifying Docker Multi-Stage Builds for Web Applications',
      hook: 'Your production Docker container should not include devDependencies, TypeScript compilers, or test runners.',
      body: `By splitting the Dockerfile into 'builder' and 'runner' stages, you get smaller attack surfaces, faster deployment pull times, and lower cloud storage costs.`,
      category: 'CLOUD',
      status: 'IDEA',
      idea: 'Explain builder vs runner stage in Dockerfile with Node.js Alpine base image.',
      hashtags: ['docker', 'devops', 'webdevelopment'],
      tags: ['docker', 'devops', 'webdevelopment'],
    },
    {
      title: 'Understanding PostgreSQL MVCC (Multi-Version Concurrency Control)',
      hook: 'How does PostgreSQL allow concurrent reads and writes without locking entire tables?',
      body: `PostgreSQL uses MVCC: transactions see a consistent snapshot of data. Deleted or updated rows are tagged with transaction IDs (xmin/xmax) and reclaimed later via VACUUM.`,
      category: 'DATABASES',
      status: 'ARCHIVED',
      hashtags: ['databases', 'postgresql'],
      tags: ['databases', 'postgresql'],
    },
  ];

  for (const post of contentPostsData) {
    const { metricSnapshots, revisions, ...postData } = post;
    const createdPost = await prisma.contentPost.create({
      data: postData,
    });

    if (revisions && revisions.length > 0) {
      for (const rev of revisions) {
        await prisma.contentRevision.create({
          data: {
            contentPostId: createdPost.id,
            ...rev,
          },
        });
      }
    } else {
      // Create initial revision
      await prisma.contentRevision.create({
        data: {
          contentPostId: createdPost.id,
          title: createdPost.title || 'Initial Title',
          hook: createdPost.hook || '',
          body: createdPost.body || '',
          cta: createdPost.cta,
          hashtags: createdPost.hashtags || [],
          revisionNumber: 1,
          createdBy: 'USER',
        },
      });
    }

    if (metricSnapshots && metricSnapshots.length > 0) {
      for (const snapshot of metricSnapshots) {
        await prisma.contentMetric.create({
          data: {
            postId: createdPost.id,
            ...snapshot,
          },
        });
      }
    }
  }


  // 5. Seed Realistic Freelance / Client Leads with Structured Audit Breakdown, Variants, Follow-ups, and Interactions
  const leadsData = [
    {
      company: 'Nordic Artisan Coffee Co. (DEMO)',
      website: 'https://demo-nordiccoffeeroasters.com',
      industry: 'E-commerce / Specialty Retail',
      location: 'Stockholm, Sweden',
      contactName: 'Lars Lindqvist',
      contactRole: 'Co-Founder & Head of Operations',
      linkedinUrl: 'https://www.linkedin.com/in/demo-lars-lindqvist',
      companyLinkedinUrl: 'https://www.linkedin.com/company/demo-nordic-coffee',
      source: 'Local Business Directory Audit',
      problem: 'Mobile checkout page takes 5.8s to load on 4G networks with severe CLS (layout shifts) and buried "Subscribe" CTA.',
      opportunity: 'Modern headless Shopify or Next.js storefront rebuild with instant sub-second page transitions and streamlined mobile subscription flow.',
      qualificationScore: 68,
      qualificationBreakdown: {
        websiteUxScore: 5,
        mobileExperienceScore: 4,
        performanceScore: 4,
        visualQualityScore: 6,
        ctaClarityScore: 3,
        conversionClarityScore: 3,
        serviceFit: 'HIGH',
        reasons: [
          'Poor mobile responsiveness detected (5.8s LCP on mobile)',
          'Call-to-action is unclear or buried below fold',
          'Weak conversion funnel with high user checkout friction',
          'Strong match for web application / redesign services',
        ],
        totalScore: 68,
      },
      status: 'QUALIFIED',
      nextFollowUpAt: new Date(), // Due Today
      lastInteractionAt: new Date(Date.now() - 2 * 86400000),
      outreachDraft: `Hi Lars,\n\nI was admiring Nordic Artisan Coffee's single-origin roasts earlier today. While browsing your shop on mobile, I noticed the checkout navigation takes ~5.8s to transition, with several layout shifts that push the subscription toggle out of view.\n\nI recently engineered a lightweight Next.js commerce template that achieves sub-second page transitions and improved mobile checkout conversion by 28% for a similar specialty brand.\n\nWould you be open to a quick 3-minute Loom video walking through 3 specific high-impact frontend fixes you can implement?`,
      outreachVariants: [
        {
          type: 'CONNECTION',
          body: 'Hi Lars, noticed Nordic Coffee while auditing specialty e-commerce performance. Spotted a quick fix for mobile checkout layout shifts. Would love to connect!',
          personalizationBasis: ['Company: Nordic Artisan Coffee', 'Contact: Lars Lindqvist', 'Observed Problem: 5.8s mobile checkout latency'],
          status: 'DRAFT',
        },
        {
          type: 'SHORT',
          body: 'Hi Lars,\n\nI was analyzing Nordic Coffee\'s mobile shop and noticed checkout takes ~5.8s with noticeable layout shifts.\n\nWe recently tackled a similar bottleneck using Next.js commerce, lifting mobile checkout conversion by 28%.\n\nWould you be open to a 3-minute video breakdown of 3 quick fixes?',
          personalizationBasis: ['Company: Nordic Artisan Coffee', 'Contact: Lars Lindqvist', 'Observed Problem: 5.8s mobile checkout latency', 'Opportunity: Next.js rebuild'],
          status: 'DRAFT',
        },
        {
          type: 'DETAILED',
          body: `Hi Lars,\n\nI was admiring Nordic Artisan Coffee's single-origin roasts earlier today. While browsing your shop on mobile, I noticed the checkout navigation takes ~5.8s to transition, with several layout shifts that push the subscription toggle out of view.\n\nI recently engineered a lightweight Next.js commerce template that achieves sub-second page transitions and improved mobile checkout conversion by 28% for a similar specialty brand.\n\nWould you be open to a quick 3-minute Loom video walking through 3 specific high-impact frontend fixes you can implement?`,
          personalizationBasis: ['Company: Nordic Artisan Coffee', 'Contact: Lars Lindqvist', 'Website: demo-nordiccoffeeroasters.com', 'Observed Problem: 5.8s mobile checkout latency', 'Opportunity: Next.js rebuild'],
          status: 'DRAFT',
        },
      ],
      interactions: [
        {
          type: 'NOTE',
          note: 'Completed manual website audit. Identified 5.8s LCP latency and layout shifts during mobile checkout.',
          occurredAt: new Date(Date.now() - 3 * 86400000),
        },
        {
          type: 'NOTE',
          note: 'Prepared 3-minute Loom demo outline showcasing sub-second Next.js commerce rebuild.',
          occurredAt: new Date(Date.now() - 2 * 86400000),
        },
      ],
    },
    {
      company: 'Apex Logistics Software (DEMO)',
      website: 'https://demo-apexlogistics-saas.io',
      industry: 'B2B SaaS / Supply Chain',
      location: 'Chicago, IL',
      contactName: 'Rachel Green',
      contactRole: 'VP of Product Marketing',
      linkedinUrl: 'https://www.linkedin.com/in/demo-rachel-green-saas',
      companyLinkedinUrl: 'https://www.linkedin.com/company/demo-apex-logistics',
      source: 'SaaS Directory Audit',
      problem: 'Outdated 2018 WordPress landing page with generic hero typography and unclear value proposition for enterprise logistics managers.',
      opportunity: 'Landing page redesign with interactive ROI calculator and modern Tailwind UI design system.',
      qualificationScore: 63,
      qualificationBreakdown: {
        websiteUxScore: 6,
        mobileExperienceScore: 5,
        performanceScore: 5,
        visualQualityScore: 4,
        ctaClarityScore: 4,
        conversionClarityScore: 4,
        serviceFit: 'HIGH',
        reasons: [
          'Outdated visual design and branding elements',
          'Call-to-action is buried below fold',
          'High opportunity for interactive ROI calculator widget',
          'Strong match for web application / redesign services',
        ],
        totalScore: 63,
      },
      status: 'OUTREACH_DRAFT',
      nextFollowUpAt: new Date(Date.now() + 2 * 86400000), // Upcoming in 2 days
      lastInteractionAt: new Date(Date.now() - 1 * 86400000),
      outreachDraft: `Hi Rachel,\n\nI came across Apex Logistics while researching supply chain analytics tools. The core product capabilities are impressive, but I noticed the main hero section doesn't immediately showcase your automated route dispatcher in action.\n\nAdding an interactive freight savings calculator and a modernized Bento-grid layout could significantly boost your enterprise demo request rates.\n\nI put together a quick interactive mockup of what this could look like—happy to share it if you'd like to take a look!`,
      interactions: [
        {
          type: 'NOTE',
          note: 'Audited SaaS landing page. Identified need for interactive freight savings calculator.',
          occurredAt: new Date(Date.now() - 1 * 86400000),
        },
      ],
    },
    {
      company: 'Verve Health Clinic (DEMO)',
      website: 'https://demo-vervehealthclinic.com',
      industry: 'Healthcare / Wellness',
      location: 'Austin, TX',
      contactName: 'Dr. Michael Chen',
      contactRole: 'Clinic Director',
      source: 'Google Maps Audit',
      problem: 'Online appointment booking iframe is broken on iOS Safari and mobile layout overflows viewport horizontally.',
      opportunity: 'Custom online booking portal with SMS confirmation integration and responsive calendar scheduling.',
      qualificationScore: 67,
      qualificationBreakdown: {
        websiteUxScore: 4,
        mobileExperienceScore: 3,
        performanceScore: 6,
        visualQualityScore: 5,
        ctaClarityScore: 3,
        conversionClarityScore: 4,
        serviceFit: 'HIGH',
        reasons: [
          'Broken appointment booking iframe on mobile devices',
          'Horizontal scrolling issues on screens under 390px width',
          'Call-to-action is unclear or buried below fold',
        ],
        totalScore: 67,
      },
      status: 'CONTACTED',
      nextFollowUpAt: new Date(Date.now() - 2 * 86400000), // Overdue
      lastInteractionAt: new Date(Date.now() - 5 * 86400000),
      outreachDraft: 'Hi Dr. Chen, noticed Verve Health Clinic\'s booking portal has an iframe rendering issue on iOS Safari...',
      interactions: [
        {
          type: 'LINKEDIN_MANUAL',
          note: 'Manually sent personalized connection note and observation regarding mobile appointment iframe bug.',
          occurredAt: new Date(Date.now() - 5 * 86400000),
        },
      ],
    },
    {
      company: 'Synapse Design Studio (DEMO)',
      website: 'https://demo-synapsestudio.design',
      industry: 'Brand & Creative Agency',
      location: 'London, UK',
      contactName: 'Oliver Smith',
      contactRole: 'Creative Director',
      source: 'Awwwards Nominees',
      problem: 'Portfolio animation lags on low-power devices due to heavy unoptimized Three.js shaders.',
      opportunity: 'Performance optimization, WebGL memory cleanup, and fast mobile fallbacks.',
      qualificationScore: 44,
      qualificationBreakdown: {
        websiteUxScore: 8,
        mobileExperienceScore: 6,
        performanceScore: 3,
        visualQualityScore: 9,
        ctaClarityScore: 6,
        conversionClarityScore: 6,
        serviceFit: 'MEDIUM',
        reasons: [
          'Sub-optimal page load and performance metrics (WebGL shader lag)',
          'Mobile memory spikes on 3D portfolio assets',
        ],
        totalScore: 44,
      },
      status: 'REPLIED',
      nextFollowUpAt: new Date(Date.now() + 3 * 86400000), // Upcoming in 3 days
      lastInteractionAt: new Date(Date.now() - 1 * 86400000),
      outreachDraft: 'Hi Oliver, huge fan of Synapse’s design work. Noticed the 3D portfolio hero has a quick GPU optimization opportunity on mobile...',
      interactions: [
        {
          type: 'LINKEDIN_MANUAL',
          note: 'Sent manual outreach discussing Three.js shader memory footprint and frame drops.',
          occurredAt: new Date(Date.now() - 4 * 86400000),
        },
        {
          type: 'EMAIL',
          note: 'Oliver replied: "Thanks for the benchmark notes! Would love to see the shader optimizations you mentioned."',
          occurredAt: new Date(Date.now() - 1 * 86400000),
        },
      ],
    },
    {
      company: 'Zenith Health Labs (DEMO)',
      website: 'https://demo-zenithhealthlabs.com',
      industry: 'Biotech / Healthcare',
      location: 'Boston, MA',
      contactName: 'Sarah Jenkins',
      contactRole: 'Head of Digital Products',
      source: 'TechCrunch Article',
      problem: 'Patient onboarding portal lacks HIPAA-compliant mobile responsive design and fast form validation.',
      opportunity: 'Next.js + Tailwind patient intake application with end-to-end Zod validation and sub-second transitions.',
      qualificationScore: 72,
      qualificationBreakdown: {
        websiteUxScore: 4,
        mobileExperienceScore: 3,
        performanceScore: 4,
        visualQualityScore: 5,
        ctaClarityScore: 3,
        conversionClarityScore: 3,
        serviceFit: 'HIGH',
        reasons: [
          'High mobile form abandonment rate on onboarding intake',
          'Outdated patient portal UX lacking responsive validation',
          'Strong match for web application / redesign services',
        ],
        totalScore: 72,
      },
      status: 'MEETING',
      nextFollowUpAt: new Date(Date.now() + 1 * 86400000), // Upcoming tomorrow
      lastInteractionAt: new Date(Date.now() - 1 * 86400000),
      interactions: [
        {
          type: 'MEETING',
          note: 'Discovery call held with Sarah Jenkins. Discussed 4-week sprint to rebuild patient onboarding flow.',
          occurredAt: new Date(Date.now() - 1 * 86400000),
        },
      ],
    },
    {
      company: 'OmniFlow Cloud Solutions (DEMO)',
      website: 'https://demo-omniflowcloud.io',
      industry: 'Cloud Infrastructure / SaaS',
      location: 'San Jose, CA',
      contactName: 'David Zhang',
      contactRole: 'Co-Founder & VP Engineering',
      source: 'ProductHunt',
      problem: 'Internal cloud analytics dashboard is slow with large dataset tables and lacks CSV export and dark mode.',
      opportunity: 'High-performance React dashboard with virtualization and server-sent telemetry events.',
      qualificationScore: 65,
      qualificationBreakdown: {
        websiteUxScore: 5,
        mobileExperienceScore: 5,
        performanceScore: 4,
        visualQualityScore: 5,
        ctaClarityScore: 4,
        conversionClarityScore: 4,
        serviceFit: 'HIGH',
        reasons: [
          'Table virtualization needed for large telemetry datasets',
          'High customer demand for responsive cloud metrics viewer',
        ],
        totalScore: 65,
      },
      status: 'PROPOSAL',
      nextFollowUpAt: new Date(Date.now() + 4 * 86400000),
      lastInteractionAt: new Date(Date.now() - 2 * 86400000),
      interactions: [
        {
          type: 'EMAIL',
          note: 'Delivered detailed proposal and architecture specification for telemetry dashboard rebuild ($4,500 fixed scope).',
          occurredAt: new Date(Date.now() - 2 * 86400000),
        },
      ],
    },
    {
      company: 'Starlight Digital Goods (DEMO)',
      website: 'https://demo-starlightdigital.co',
      industry: 'Creator Economy / E-commerce',
      location: 'Austin, TX',
      contactName: 'Elena Morris',
      contactRole: 'Founder',
      source: 'Twitter / X',
      problem: 'Creator digital asset storefront was dropping carts due to unoptimized Stripe checkout iframe.',
      opportunity: 'Custom Stripe Elements checkout integration with automated download delivery.',
      qualificationScore: 65,
      qualificationBreakdown: {
        websiteUxScore: 5,
        mobileExperienceScore: 5,
        performanceScore: 5,
        visualQualityScore: 5,
        ctaClarityScore: 4,
        conversionClarityScore: 3,
        serviceFit: 'HIGH',
        reasons: [
          'Stripe Elements custom checkout integration needed',
          'Cart abandonment fixed with instant delivery flow',
        ],
        totalScore: 65,
      },
      status: 'WON',
      lastInteractionAt: new Date(Date.now() - 5 * 86400000),
      interactions: [
        {
          type: 'NOTE',
          note: 'Client signed agreement and paid initial deposit. Sprint underway.',
          occurredAt: new Date(Date.now() - 5 * 86400000),
        },
      ],
    },
    {
      company: 'Peak Flow Analytics (DEMO)',
      website: 'https://demo-peakflowanalytics.com',
      industry: 'FinTech / Data Analytics',
      location: 'Toronto, Canada',
      contactName: 'Samantha Wu',
      contactRole: 'Head of Growth',
      source: 'LinkedIn Post',
      problem: 'Landing page copy is clear, but lacks self-serve interactive product preview.',
      opportunity: 'Interactive sandbox demo dashboard component.',
      qualificationScore: 36,
      qualificationBreakdown: {
        websiteUxScore: 7,
        mobileExperienceScore: 8,
        performanceScore: 7,
        visualQualityScore: 7,
        ctaClarityScore: 7,
        conversionClarityScore: 6,
        serviceFit: 'MEDIUM',
        reasons: [
          'Site is reasonably well-optimized; opportunity is in interactive product sandbox widgets',
        ],
        totalScore: 36,
      },
      status: 'DISCOVERED',
      interactions: [],
    },
  ];

  for (const lead of leadsData) {
    const { interactions, ...leadCoreData } = lead;
    const createdLead = await prisma.lead.create({ data: leadCoreData as any });

    if (interactions && interactions.length > 0) {
      for (const interaction of interactions) {
        await prisma.leadInteraction.create({
          data: {
            leadId: createdLead.id,
            ...interaction,
          },
        });
      }
    }
  }

  // 6. Seed 10 Internships with Match Scores & Requirements
  const internshipsData = [
    {
      company: 'Stripe (DEMO)',
      role: 'Software Engineering Intern - Platform & APIs',
      location: 'San Francisco, CA / Seattle, WA',
      remote: true,
      url: 'https://stripe.com/jobs/demo-intern-software-engineer',
      source: 'Official Careers Page',
      description: 'Join the Developer Platform team to build reliable, high-throughput payment APIs, developer tooling, and distributed infrastructure.',
      skills: ['TypeScript', 'Ruby', 'Go', 'Distributed Systems', 'API Design'],
      eligibility: 'Currently enrolled in a BS/MS in Computer Science or related technical discipline, graduating late 2026 or 2027.',
      deadline: new Date(Date.now() + 25 * 86400000),
      postedAt: new Date(Date.now() - 5 * 86400000),
      matchScore: 94,
      matchReasons: [
        'Matches target engineering role preference (Software Engineer)',
        'Matched skills: TypeScript, Distributed Systems, API Design',
        'Remote flexibility available & preferred SF/Seattle locations',
      ],
      status: 'INTERESTED',
    },
    {
      company: 'Datadog (DEMO)',
      role: 'Full Stack Engineering Intern',
      location: 'New York, NY',
      remote: true,
      url: 'https://datadoghq.com/careers/demo-intern-fullstack',
      source: 'University Job Board',
      description: 'Help build high-performance observability dashboards, telemetry streaming widgets, and interactive query builders in TypeScript/React and Go.',
      skills: ['TypeScript', 'React', 'Go', 'PostgreSQL', 'Docker'],
      eligibility: 'Graduating between Dec 2026 and June 2027 with CS or Software Engineering background.',
      deadline: new Date(Date.now() + 18 * 86400000),
      postedAt: new Date(Date.now() - 8 * 86400000),
      matchScore: 92,
      matchReasons: [
        'Matches target engineering role preference (Full Stack Engineer)',
        'Matched skills: TypeScript, React, PostgreSQL, Docker',
        'Matches preferred location (New York, NY)',
      ],
      status: 'SAVED',
    },
    {
      company: 'Figma (DEMO)',
      role: 'Software Engineer Intern - Core Systems & UI',
      location: 'San Francisco, CA',
      remote: false,
      url: 'https://figma.com/careers/demo-systems-intern',
      source: 'Company Career Page',
      description: 'Work with the multiplayer web canvas team optimizing WebAssembly rendering, canvas synchronization, and TypeScript UI frameworks.',
      skills: ['TypeScript', 'C++', 'WebAssembly', 'React', 'Canvas API'],
      eligibility: 'Passionate about frontend performance, browser internals, and collaborative software design.',
      deadline: new Date(Date.now() + 14 * 86400000),
      postedAt: new Date(Date.now() - 3 * 86400000),
      matchScore: 88,
      matchReasons: [
        'Matches target engineering role preference',
        'Matched skills: TypeScript, React',
        'Matches preferred location (San Francisco, CA)',
      ],
      status: 'NEW',
    },
    {
      company: 'Anthropic (DEMO)',
      role: 'AI Infrastructure & Tooling Intern',
      location: 'San Francisco, CA',
      remote: true,
      url: 'https://anthropic.com/careers/demo-ai-infra-intern',
      source: 'Public Job Board',
      description: 'Design evaluation harnesses, agent orchestration platforms, and developer tooling for frontier AI models.',
      skills: ['Python', 'TypeScript', 'Docker', 'Kubernetes', 'PostgreSQL'],
      eligibility: 'Demonstrated experience building developer tools, systems programming, or ML deployment workflows.',
      deadline: new Date(Date.now() + 30 * 86400000),
      postedAt: new Date(Date.now() - 2 * 86400000),
      matchScore: 90,
      matchReasons: [
        'Matches target engineering role preference (AI Engineer)',
        'Matched skills: Python, TypeScript, Docker, PostgreSQL',
        'Remote flexibility available',
      ],
      status: 'REVIEWING',
    },
    {
      company: 'Vercel (DEMO)',
      role: 'Frontend Infrastructure Intern',
      location: 'Remote (Worldwide)',
      remote: true,
      url: 'https://vercel.com/careers/demo-frontend-infra-intern',
      source: 'RSS Feed / Web API',
      description: 'Improve Next.js build performance, Edge Runtime streaming, and Turbo tooling for millions of developers.',
      skills: ['TypeScript', 'Next.js', 'Rust', 'React', 'Node.js'],
      eligibility: 'Enrolled student with strong open source contributions in web performance and JavaScript ecosystems.',
      deadline: new Date(Date.now() + 10 * 86400000),
      postedAt: new Date(Date.now() - 10 * 86400000),
      matchScore: 95,
      matchReasons: [
        'Matches target engineering role preference (Full Stack / Frontend)',
        'Matched skills: TypeScript, Next.js, React, Node.js',
        'Full Remote flexibility available',
      ],
      status: 'SAVED',
    },
    {
      company: 'Cloudflare (DEMO)',
      role: 'Systems Engineer Intern - Workers Runtime',
      location: 'Austin, TX / Remote',
      remote: true,
      url: 'https://cloudflare.com/careers/demo-systems-intern',
      source: 'Careers Portal',
      description: 'Build edge computing services running on V8 isolates and global anycast routing.',
      skills: ['Rust', 'C++', 'TypeScript', 'Networking', 'Linux'],
      eligibility: 'Curious about distributed systems, networking protocols (HTTP/3, QUIC), and low-latency runtimes.',
      deadline: new Date(Date.now() + 45 * 86400000),
      postedAt: new Date(Date.now() - 12 * 86400000),
      matchScore: 82,
      matchReasons: [
        'Matches target systems engineering focus',
        'Matched skills: TypeScript, Linux',
        'Remote flexibility available',
      ],
      status: 'NEW',
    },
    {
      company: 'MongoDB (DEMO)',
      role: 'Database Kernel Engineering Intern',
      location: 'New York, NY',
      remote: false,
      url: 'https://mongodb.com/careers/demo-database-intern',
      source: 'Campus Recruitment',
      description: 'Work on distributed storage engines, wire protocols, and query optimization.',
      skills: ['C++', 'Python', 'Database Internals', 'Algorithms'],
      eligibility: 'Solid understanding of Operating Systems, concurrency, and data structures.',
      deadline: new Date(Date.now() + 12 * 86400000),
      postedAt: new Date(Date.now() - 14 * 86400000),
      matchScore: 72,
      matchReasons: [
        'Related software engineering discipline',
        'Matched skills: Python',
        'Matches preferred location (New York, NY)',
      ],
      status: 'REVIEWING',
    },
    {
      company: 'Linear (DEMO)',
      role: 'Product Engineering Intern',
      location: 'Remote',
      remote: true,
      url: 'https://linear.app/careers/demo-product-intern',
      source: 'Public Careers Page',
      description: 'Help craft the fastest issue tracking and project management tool on the web using TypeScript and sync engines.',
      skills: ['TypeScript', 'React', 'GraphQL', 'IndexedDB', 'TailwindCSS'],
      eligibility: 'High attention to detail, keyboard accessibility, micro-interactions, and 60 FPS frontend performance.',
      deadline: new Date(Date.now() + 20 * 86400000),
      postedAt: new Date(Date.now() - 4 * 86400000),
      matchScore: 91,
      matchReasons: [
        'Matches target engineering role preference',
        'Matched skills: TypeScript, React',
        'Remote flexibility available',
      ],
      status: 'NEW',
    },
    {
      company: 'Retool (DEMO)',
      role: 'Software Engineer Intern - Internal Developer Tools',
      location: 'San Francisco, CA',
      remote: true,
      url: 'https://retool.com/careers/demo-swe-intern',
      source: 'Careers Portal',
      description: 'Build extensible UI components and backend database connectors for internal business applications.',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'SQL'],
      eligibility: 'Student graduating in 2026/2027.',
      deadline: new Date(Date.now() + 35 * 86400000),
      postedAt: new Date(Date.now() - 6 * 86400000),
      matchScore: 89,
      matchReasons: [
        'Matches target engineering role preference',
        'Matched skills: TypeScript, React, Node.js, PostgreSQL',
        'Matches preferred location (San Francisco, CA)',
      ],
      status: 'NEW',
    },
    {
      company: 'Notion (DEMO)',
      role: 'Software Engineer Intern - Collaboration & Sync',
      location: 'San Francisco, CA / New York, NY',
      remote: true,
      url: 'https://notion.so/careers/demo-swe-intern',
      source: 'University Fair',
      description: 'Design collaborative document editors, block-based tree structures, and fast local-first state synchronization.',
      skills: ['TypeScript', 'React', 'Node.js', 'SQLite', 'CRDTs'],
      eligibility: 'Enrolled student with strong CS fundamentals.',
      deadline: new Date(Date.now() + 50 * 86400000),
      postedAt: new Date(Date.now() - 2 * 86400000),
      matchScore: 93,
      matchReasons: [
        'Matches target engineering role preference',
        'Matched skills: TypeScript, React, Node.js',
        'Remote flexibility available & preferred SF/NY locations',
      ],
      status: 'SAVED',
    },
  ];

  for (const item of internshipsData) {
    await prisma.internship.create({ data: item });
  }

  // 7. Seed 10 Unified Tasks across Categories & Due Dates
  const tasksData = [
    {
      title: 'Review 5 networking prospects in Distributed Systems & AI',
      description: 'Inspect profiles for Elena Rostova, Marcus Vance, and others; draft personalized connection notes.',
      type: 'NETWORKING',
      priority: 'HIGH',
      status: 'TODO',
      dueAt: new Date(Date.now() + 4 * 3600000), // Due today
    },
    {
      title: 'Approve and schedule LinkedIn post on Human-in-the-loop AI',
      description: 'Check hook variations and verify manual publish reminder is configured.',
      type: 'CONTENT',
      priority: 'HIGH',
      status: 'TODO',
      dueAt: new Date(Date.now() + 6 * 3600000), // Due today
    },
    {
      title: 'Follow up with Nordic Artisan Coffee lead on mobile audit Loom',
      description: 'Send follow-up email/LinkedIn message with 3 high-impact mobile UX fixes.',
      type: 'LEAD',
      priority: 'MEDIUM',
      status: 'TODO',
      dueAt: new Date(Date.now() + 8 * 3600000), // Due today
    },
    {
      title: 'Review 3 high-match internship opportunities (Stripe, Datadog, Vercel)',
      description: 'Review requirement checklists and customize resume project bullets.',
      type: 'INTERNSHIP',
      priority: 'HIGH',
      status: 'TODO',
      dueAt: new Date(Date.now() + 10 * 3600000), // Due today
    },
    {
      title: 'Send follow-up message to Kavita Patel (Principal Architect)',
      description: 'Reference connection discussion on PostgreSQL connection poolers and PgBouncer.',
      type: 'NETWORKING',
      priority: 'MEDIUM',
      status: 'TODO',
      dueAt: new Date(Date.now() + 24 * 3600000),
    },
    {
      title: 'Draft next week’s technical post on React State Machine patterns',
      description: 'Outline code examples showing before/after useState refactor into finite state reducer.',
      type: 'CONTENT',
      priority: 'MEDIUM',
      status: 'TODO',
      dueAt: new Date(Date.now() + 48 * 3600000),
    },
    {
      title: 'Record 3-minute audit walkthrough for Apex Logistics SaaS',
      description: 'Highlight hero CTA repositioning and interactive ROI calculator mockup.',
      type: 'LEAD',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueAt: new Date(Date.now() + 72 * 3600000),
    },
    {
      title: 'Analyze monthly LinkedIn engagement metrics and top performing hooks',
      description: 'Review B-Trees vs Node streams post analytics; log insights into personal swipe file.',
      type: 'ANALYTICS',
      priority: 'LOW',
      status: 'TODO',
      dueAt: new Date(Date.now() + 96 * 3600000),
    },
    {
      title: 'Update personal GitHub project README for full-stack portfolio',
      description: 'Add live demo links and architecture diagrams to highlight capstone engineering quality.',
      type: 'GENERAL',
      priority: 'LOW',
      status: 'DONE',
      dueAt: new Date(Date.now() - 24 * 3600000),
    },
    {
      title: 'Organize internship application deadlines spreadsheet for Q2',
      description: 'Ensure all target company deadlines are mapped into internal task reminder queue.',
      type: 'INTERNSHIP',
      priority: 'LOW',
      status: 'DONE',
      dueAt: new Date(Date.now() - 48 * 3600000),
    },
  ];

  for (const task of tasksData) {
    await prisma.task.create({ data: task });
  }

  // 8. Seed 30 Days of Realistic Analytics Snapshots with exact Engagement Rate Calculations
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 29);

  let curFollowers = 840;
  let curConnections = 520;

  for (let i = 0; i < 30; i++) {
    const snapDate = new Date(baseDate);
    snapDate.setDate(baseDate.getDate() + i);
    const dateStr = snapDate.toISOString().split('T')[0];

    // Progressive organic growth simulation
    curFollowers += Math.floor(Math.random() * 6) + (i % 7 === 0 ? 12 : 2);
    curConnections += Math.floor(Math.random() * 4) + (i % 5 === 0 ? 6 : 1);

    const isPostDay = i % 3 === 0;
    const impressions = isPostDay ? Math.floor(Math.random() * 1500) + 1200 : Math.floor(Math.random() * 300) + 150;
    const reactions = isPostDay ? Math.floor(impressions * 0.035) + 10 : Math.floor(impressions * 0.02) + 2;
    const comments = isPostDay ? Math.floor(impressions * 0.008) + 4 : Math.floor(impressions * 0.004) + 1;
    const reposts = isPostDay ? Math.floor(impressions * 0.003) + 2 : 0;
    const clicks = isPostDay ? Math.floor(impressions * 0.015) + 5 : Math.floor(impressions * 0.008);
    const profileViews = Math.floor(Math.random() * 25) + (isPostDay ? 40 : 15);

    const totalInteractions = reactions + comments + reposts + clicks;
    const engagementRate = impressions > 0 ? Math.round(((totalInteractions / impressions) * 100) * 100) / 100 : null;

    await prisma.analyticsSnapshot.create({
      data: {
        date: dateStr,
        followers: curFollowers,
        connections: curConnections,
        profileViews,
        impressions,
        reactions,
        comments,
        reposts,
        clicks,
        engagementRate,
      },
    });
  }

  // 9. Seed Internal Notifications
  const notificationsData = [
    {
      type: 'NEW_INTERNSHIP',
      title: 'High-Match Internship Discovered',
      message: 'Vercel posted "Frontend Infrastructure Intern" (95% Match with your TypeScript/Next.js profile).',
      read: false,
      linkUrl: '/internships',
    },
    {
      type: 'FOLLOW_UP_DUE',
      title: 'Networking Follow-Up Due Today',
      message: 'Time to follow up with Elena Rostova regarding distributed storage deep dives.',
      read: false,
      linkUrl: '/networking',
    },
    {
      type: 'CONTENT_REVIEW',
      title: 'Content Scheduled for Tomorrow',
      message: '"Building a Human-in-the-Loop AI Assistant" is scheduled. Manual publish required on LinkedIn.',
      read: false,
      linkUrl: '/content',
    },
    {
      type: 'LEAD_FOUND',
      title: 'High Qualification Lead Added',
      message: 'Nordic Artisan Coffee Co. scored 82/100 for web redesign & mobile conversion opportunity.',
      read: true,
      linkUrl: '/leads',
    },
    {
      type: 'ANALYTICS_UPDATE',
      title: 'Weekly Analytics Snapshot Generated',
      message: 'Your post impressions grew +34% this week with an average 6.3% engagement rate.',
      read: true,
      linkUrl: '/analytics',
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }

  console.log('✅ Database seeded successfully with realistic demo data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
