export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface Cta {
  label: string;
  href: string;
  external?: boolean;
  variant?: 'primary' | 'ghost';
}

export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export interface Step {
  icon: string;
  title: string;
  body: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface AboutBullet {
  icon: string;
  text: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface PipelineNode {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  detail: string;
  control?: { label: string; value: string };
  gradient: string;
}

export interface VoiceSample {
  id: string;
  label: string;
  description: string;
  prose: string;
  meta: string;
}

export interface ProviderCard {
  id: string;
  name: string;
  models: string[];
  status: 'direct' | 'byok';
  color: string;
  best: string;
  cost: number; // 1..5 (5 = expensive)
  speed: number; // 1..5 (5 = fastest)
  quality: number; // 1..5 (5 = best)
}

export interface Project {
  id: string;
  badge: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  ctas: Cta[];
  url: string;
  category: 'web' | 'mobile';
  gradient: string;
  icon: string;
  iconBg: string;
}

export interface OpenSourceRepo {
  name: string;
  summary: string;
  language: string;
  stack: string[];
  tests: number;
  url: string;
  featured?: boolean;
}

export type RoutePath = '/' | '/privacy' | '/terms' | '/pricing';

export interface SiteContent {
  brand: { name: string; wordmark: string; tagline: string };
  urls: {
    product: string;
    mushaf: string;
    quranAndroid: string;
    github: string;
    linkedin: string;
    canonical: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage: string;
    routes: Record<RoutePath, { title: string; ogTitle?: string; description: string }>;
  };
  nav: NavLink[];
  primaryCta: Cta;
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    engineering: string;
    subhead: string;
    ctas: [Cta, Cta];
    mockAlt: string;
  };
  stats: Stat[];
  about: {
    eyebrow: string;
    name: string;
    headline: string;
    body: string[];
    bullets: AboutBullet[];
    techStack: string[];
    ctas: Cta[];
  };
  projects: { heading: string; subhead: string; items: Project[] };
  openSource: { eyebrow: string; heading: string; subhead: string; profileCta: Cta; items: OpenSourceRepo[] };
  pipeline: { heading: string; subhead: string; nodes: PipelineNode[]; legend: string };
  voices: { heading: string; subhead: string; topic: string; samples: VoiceSample[] };
  providers: { heading: string; subhead: string; cards: ProviderCard[] };
  features: { heading: string; subhead: string; items: Feature[] };
  howItWorks: { heading: string; subhead: string; steps: Step[] };
  faq: { heading: string; items: FaqItem[] };
  ctaBand: { headline: string; subhead: string; cta: Cta };
  footer: {
    copyright: string;
    links: NavLink[];
  };
  legal: {
    privacy: { updated: string; sections: { heading: string; body: string }[] };
    terms: { updated: string; sections: { heading: string; body: string }[] };
  };
  pricing: {
    checked: string;
    intro: string;
    plans: { name: string; price: string }[];
    source: string;
    sections: { heading: string; body: string }[];
  };
}

const PRODUCT_URL = 'https://feed.geohashim.com';
const MUSHAF_URL = 'https://mushaf.geohashim.com';
const QURAN_ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.medoapps.www.onlinequran';
const GITHUB_URL = 'https://github.com/ahmed-hashim-pro';
const LINKEDIN_URL = 'https://www.linkedin.com/in/ahmed-hashim-8760ab108/';
const CANONICAL = 'https://landing.geohashim.com';

export const SITE: SiteContent = {
  brand: {
    name: 'geohashim',
    wordmark: 'geohashim',
    tagline: 'Ahmed Hashim — building AI tools and apps from idea to ship.',
  },
  urls: {
    product: PRODUCT_URL,
    mushaf: MUSHAF_URL,
    quranAndroid: QURAN_ANDROID_URL,
    github: GITHUB_URL,
    linkedin: LINKEDIN_URL,
    canonical: CANONICAL,
  },
  seo: {
    defaultTitle: 'Ahmed Hashim · Software architect: cloud, web and mobile, data and AI systems',
    defaultDescription:
      'Ahmed Hashim, software architect with 11 years across TypeScript/Node.js, Python, Go and AWS. Cloud and release infrastructure, web and mobile products, data systems and AI agent tooling, with open-source repositories and shipped products.',
    ogImage: '/og-image.png',
    routes: {
      '/': {
        title: 'Ahmed Hashim · Software architect: cloud, web and mobile, data and AI systems',
        ogTitle: 'Ahmed Hashim, software architect: cloud, web and mobile, data and AI systems',
        description:
          'Ahmed Hashim, software architect with 11 years across TypeScript/Node.js, Python, Go and AWS. Cloud and release infrastructure, web and mobile products, data systems and AI agent tooling, with open-source repositories and shipped products.',
      },
      '/privacy': {
        title: 'Privacy policy · Ahmed Hashim',
        description: 'What this site collects (nothing about you), what stays in your browser, and who else sees your visit.',
      },
      '/terms': {
        title: 'Terms of service · Ahmed Hashim',
        description: 'What this portfolio site is, which licences apply to the code it shows, and what its demos replay.',
      },
      '/pricing': {
        title: 'My Stream pricing · Ahmed Hashim',
        description:
          'My Stream plans and monthly prices as the product lists them, what a plan limits, and how billing works through Stripe.',
      },
    },
  },
  nav: [
    { label: 'Projects', href: '#projects' },
    { label: 'Open source', href: '#open-source' },
    { label: 'How it works', href: '#pipeline' },
    { label: 'Voices', href: '#voices' },
    { label: 'Models', href: '#providers' },
    { label: 'Playground', href: '#playground' },
  ],
  primaryCta: {
    label: 'Open My Stream',
    href: PRODUCT_URL,
    external: true,
    variant: 'primary',
  },
  hero: {
    eyebrow: 'Hi, I\'m Ahmed Hashim',
    headline: 'I build ',
    headlineAccent: 'AI tools and apps that ship.',
    engineering:
      'Software architect with 11 years across TypeScript/Node.js, Python, Go and AWS. I build AI agent tooling with hard safety boundaries, plus the cloud and release infrastructure underneath.',
    subhead:
      'My flagship is My Stream — an AI publishing platform that drafts articles in your editorial voice using Claude, GPT, Gemini, and four more providers. I also build digital Mushaf and Quran apps used on web and Android. All shipped, all maintained, all here.',
    ctas: [
      { label: 'Open My Stream', href: PRODUCT_URL, external: true, variant: 'primary' },
      { label: 'See all projects', href: '#projects', variant: 'ghost' },
    ],
    mockAlt: 'Preview of the My Stream AI Studio showing model picker, editorial voice controls, and a scheduled automation run.',
  },
  stats: [
    { value: '3', label: 'shipped products' },
    { value: '7', label: 'AI providers integrated' },
    { value: 'Android · Web', label: 'platforms' },
    { value: '10+', label: 'languages supported' },
  ],
  about: {
    eyebrow: 'About',
    name: 'Ahmed Hashim',
    headline: 'Software architect. Builder. Solo shipper.',
    body: [
      'I\'m a software architect with 11 years across TypeScript/Node.js, Python, Go and AWS, currently at a drone-operations company. I build AI agent tooling with hard safety boundaries, plus the cloud and release infrastructure underneath it.',
      'On my own products I like owning the whole pipeline, from a half-formed idea to a shipped, maintained product. There my focus is applied AI for publishing workflows, but I also keep a long-running line of work in Islamic resources: a digital Mushaf and a Quran Android app that have been in users\' hands for years.',
      'Most of that product work is shipped solo. I\'m comfortable owning the stack end-to-end: Angular and Ionic on the front, AWS and Firebase on the back, with whichever AI provider fits the job. I write occasionally about what I\'m learning, and I\'m open to senior engineering and architecture roles (remote).',
    ],
    bullets: [
      { icon: 'briefcase-outline', text: 'Software architect, 11 years. Currently at a drone-operations company.' },
      { icon: 'shield-checkmark-outline', text: 'Building AI agent tooling with hard safety boundaries, plus the cloud and release infrastructure underneath.' },
      { icon: 'sparkles-outline', text: 'Building My Stream, an AI editorial pipeline for publishers.' },
      { icon: 'book-outline', text: 'Long-running line of work on Islamic resources — Mushaf and Quran apps.' },
      { icon: 'globe-outline', text: 'Multi-language by default; English isn\'t the only audience.' },
      { icon: 'rocket-outline', text: 'Shipping in public. Open to senior engineering and architecture roles (remote).' },
    ],
    techStack: [
      'TypeScript',
      'Node.js',
      'Python',
      'Go',
      'Angular',
      'Ionic',
      'Capacitor',
      'AWS Amplify',
      'Firebase',
      'LangGraph',
      'MCP',
      'Anthropic',
      'OpenAI',
      'Stripe',
    ],
    ctas: [
      { label: 'GitHub', href: GITHUB_URL, external: true, variant: 'ghost' },
      { label: 'LinkedIn', href: LINKEDIN_URL, external: true, variant: 'ghost' },
    ],
  },
  projects: {
    heading: 'Projects',
    subhead: 'Three products I build and maintain — one flagship, and a long-running line of Islamic apps.',
    items: [
      {
        id: 'mystream',
        badge: 'Flagship',
        name: 'My Stream',
        tagline: 'AI publishing platform',
        description:
          'Scrape sources, score with quality thresholds, and draft articles in your editorial voice. Multi-model (Claude, GPT, Gemini, Grok, DeepSeek, Mistral, Groq), workspaces, scheduling, BYOK.',
        highlights: ['7 AI providers', 'BYOK keys', 'Editorial voice controls', 'Scheduled automation'],
        ctas: [
          { label: 'Open My Stream', href: PRODUCT_URL, external: true, variant: 'primary' },
          { label: 'How it works', href: '#how-it-works', variant: 'ghost' },
        ],
        url: PRODUCT_URL,
        category: 'web',
        gradient: 'from-indigo-500 via-fuchsia-500 to-rose-500',
        icon: 'sparkles-outline',
        iconBg: 'bg-gradient-to-br from-indigo-500 to-fuchsia-500',
      },
      {
        id: 'mushaf',
        badge: 'Web',
        name: 'Mushaf',
        tagline: 'A clean digital Quran reader',
        description:
          'A focused, distraction-free Mushaf for the web at mushaf.geohashim.com. Built for fast page navigation, comfortable reading typography, and a layout that respects the printed Mushaf.',
        highlights: ['Distraction-free reading', 'Page-accurate layout', 'Mobile-first', 'Free, no ads'],
        ctas: [
          { label: 'Open Mushaf', href: MUSHAF_URL, external: true, variant: 'primary' },
        ],
        url: MUSHAF_URL,
        category: 'web',
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        icon: 'book-outline',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      },
      {
        id: 'online-quran',
        badge: 'Android',
        name: 'Online Quran',
        tagline: 'A Quran reader for Android',
        description:
          'My long-running Quran app for Android, available on Google Play. Reciter audio, bookmarking, and offline reading — for everyday use.',
        highlights: ['Recitation audio', 'Bookmarks', 'Offline reading', 'Years on the Play Store'],
        ctas: [
          { label: 'Get it on Google Play', href: QURAN_ANDROID_URL, external: true, variant: 'primary' },
        ],
        url: QURAN_ANDROID_URL,
        category: 'mobile',
        gradient: 'from-amber-500 via-orange-500 to-rose-500',
        icon: 'phone-portrait-outline',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
      },
    ],
  },
  // Test counts come from running each repo's suite and match its latest CI run.
  // Re-check them when a repo changes; several READMEs quote older counts.
  openSource: {
    eyebrow: 'Engineering work',
    heading: 'Open source',
    subhead:
      'Public repositories on GitHub: agent tooling with hard safety boundaries, and the systems work underneath it.',
    profileCta: { label: 'All repositories on GitHub', href: GITHUB_URL, external: true, variant: 'ghost' },
    items: [
      {
        name: 'triage-graph',
        summary:
          'Multi-agent incident triage on LangGraph with a human approval gate enforced in code, plus a CrewAI port and a written comparison of the two.',
        language: 'Python',
        stack: ['LangGraph', 'CrewAI', 'Pydantic'],
        tests: 133,
        url: `${GITHUB_URL}/triage-graph`,
        featured: true,
      },
      {
        name: 'sqlguard-mcp',
        summary:
          'An MCP server that lets an agent query a SQLite database and refuses any write until a human approves that exact statement.',
        language: 'Go',
        stack: ['MCP Go SDK', 'SQLite', 'Helm'],
        tests: 139,
        url: `${GITHUB_URL}/sqlguard-mcp`,
        featured: true,
      },
      {
        name: 'atlas-graph-db',
        summary:
          'A graph database written from scratch in TypeScript, with a write-ahead log, crash recovery, atomic transactions and a Cypher-like query language (AQL).',
        language: 'TypeScript',
        stack: ['Node.js', 'Fastify', 'Angular'],
        tests: 686,
        url: `${GITHUB_URL}/atlas-graph-db`,
        featured: true,
      },
      {
        name: 'llm-contract-router',
        summary:
          'Routes requests across LLM providers behind one interface, validates each answer against your schema, and re-prompts with the constraint that failed.',
        language: 'TypeScript',
        stack: ['Node.js', 'Anthropic', 'OpenAI', 'Zero runtime deps'],
        tests: 105,
        url: `${GITHUB_URL}/llm-contract-router`,
      },
      {
        name: 'noisefloor',
        summary:
          'A regression harness for non-deterministic systems that measures run-to-run noise before calling a change a regression.',
        language: 'Python',
        stack: ['Pydantic', 'PyYAML'],
        tests: 202,
        url: `${GITHUB_URL}/noisefloor`,
      },
      {
        name: 'runon',
        summary:
          'Runs plain shell-script programs on your machine, one server, or a named group of servers over your own SSH, and is published on PyPI.',
        language: 'Python',
        stack: ['SSH', 'PyPI', 'Stdlib only on 3.11+'],
        tests: 422,
        url: `${GITHUB_URL}/runon`,
      },
      {
        name: 'rag-knowledge-agent',
        summary:
          'A command-line retrieval agent that answers from a folder of documents with citations, and refuses without calling the model when no evidence clears its confidence floor.',
        language: 'Python',
        stack: ['Claude', 'ChromaDB', 'Pydantic'],
        tests: 109,
        url: `${GITHUB_URL}/rag-knowledge-agent`,
      },
      {
        name: 'local-network-mcp',
        summary:
          'An MCP server for local network, system and SSH tasks, where shell commands, remote commands and process kills stay denied until the operator opts in.',
        language: 'Python',
        stack: ['MCP', 'Paramiko', 'psutil'],
        tests: 94,
        url: `${GITHUB_URL}/local-network-mcp`,
      },
    ],
  },
  pipeline: {
    heading: 'Inside My Stream — the pipeline, end to end.',
    subhead:
      'Every published article walks the same five stages. You configure each stage once per workspace; the schedule does the rest.',
    legend: 'Hover any stage to see what it does. The dots flowing between stages are real units of work — sources, scored items, drafts.',
    nodes: [
      {
        id: 'sources',
        label: 'Sources',
        sublabel: 'RSS · topics · feeds',
        icon: 'link-outline',
        detail: 'You point My Stream at RSS feeds, topic strings, and (soon) custom HTML scrapers. Each workspace has its own list.',
        control: { label: 'You configure', value: 'Feeds + topics' },
        gradient: 'from-zinc-400 to-zinc-600',
      },
      {
        id: 'scrape',
        label: 'Scrape',
        sublabel: 'Lambda',
        icon: 'cloud-download-outline',
        detail: 'A Lambda fans out, fetches each source, normalises the HTML, and queues candidate items.',
        gradient: 'from-sky-500 to-cyan-500',
      },
      {
        id: 'score',
        label: 'Score',
        sublabel: 'Model picks one',
        icon: 'analytics-outline',
        detail: 'The picked model rates every item against your editorial rubric. The threshold is per-workspace; the model offsets auto-correct so cheaper models do not silently fail.',
        control: { label: 'You pick', value: 'Model · threshold' },
        gradient: 'from-indigo-500 to-fuchsia-500',
      },
      {
        id: 'draft',
        label: 'Draft',
        sublabel: 'Voice + length',
        icon: 'create-outline',
        detail: 'Survivors of the score gate are drafted in the voice you defined: voice, reading level, target word count, target keywords, citation rules, custom prompt additions.',
        control: { label: 'You define', value: 'Voice · style' },
        gradient: 'from-fuchsia-500 to-rose-500',
      },
      {
        id: 'publish',
        label: 'Publish',
        sublabel: 'Stream + share',
        icon: 'newspaper-outline',
        detail: 'You review the queue, edit if you want, then publish to your stream. Every post gets a permalink, an OG card, and a share-button row.',
        control: { label: 'You ship', value: 'Review + publish' },
        gradient: 'from-emerald-500 to-teal-500',
      },
    ],
  },
  voices: {
    heading: 'One topic. Six voices. Same source.',
    subhead:
      'The drafter respects an editorial voice you define per workspace. Click a voice to see the same source rewritten — this is exactly the prompt shape My Stream uses.',
    topic: 'AI safety in 2026',
    samples: [
      {
        id: 'journalistic',
        label: 'Journalistic',
        description: 'Reuters-style. Lead, context, sourced quotes.',
        meta: 'Reading level: General · ~900 words',
        prose:
          'AI safety moved from back-office concern to front-page issue this year, with a wave of frontier-lab disclosures forcing every team that ships an LLM-backed product to revisit its deployment guardrails. Independent analysts say the shift is less about model capability and more about the pace at which safety teams are being asked to certify production releases.',
      },
      {
        id: 'casual',
        label: 'Casual',
        description: 'Friendly, contractions, second-person.',
        meta: 'Reading level: General · ~800 words',
        prose:
          "If you've shipped anything with an LLM in it this year, you've probably already had The Conversation about AI safety — even if you didn't call it that. The vibe shift is real: it's not about whether the model can do the thing, it's about whether your launch checklist actually catches the weird edge cases before users do.",
      },
      {
        id: 'formal',
        label: 'Formal',
        description: 'Long sentences, no contractions, third-person.',
        meta: 'Reading level: Technical · ~1100 words',
        prose:
          'Recent developments in artificial intelligence safety have prompted a renewed scrutiny of deployment practices across both research and industry. Practitioners are observing a categorical shift in the locus of risk: not the underlying model capability, but the operational discipline applied during integration into customer-facing systems.',
      },
      {
        id: 'academic',
        label: 'Academic',
        description: 'Citations, hedged claims, methodology.',
        meta: 'Reading level: Expert · ~1300 words',
        prose:
          'Empirical evidence accumulated over the past twelve months suggests that the marginal risk attributable to frontier model deployment is increasingly mediated by integration-layer controls, rather than by base-model capability (cf. Hashim, 2026). We argue that a methodologically rigorous safety assessment must therefore foreground the operational substrate, with particular attention to provenance, threshold gating, and post-hoc auditability.',
      },
      {
        id: 'opinion',
        label: 'Opinion',
        description: 'First-person, claims, takes.',
        meta: 'Reading level: General · ~700 words',
        prose:
          "I'll say what most builders won't: 90% of AI safety in 2026 is just shipping discipline with extra steps. The model isn't the problem. The deployment is. And if you're still pretending your three-line eval suite covers it, you're going to have a bad week the first time a customer prompt-injects through your input field.",
      },
      {
        id: 'conversational',
        label: 'Conversational',
        description: 'Like a friend explaining over coffee.',
        meta: 'Reading level: General · ~750 words',
        prose:
          "Okay, so here's the thing about AI safety in 2026. A year ago everyone was arguing about model size. Now? It's all about what happens after the model — the routing, the validation, the boring middle layer that nobody wanted to write. Turns out that boring layer is most of the actual safety work.",
      },
    ],
  },
  providers: {
    heading: 'Seven providers. One pipeline. Your choice per workspace.',
    subhead:
      'Anthropic runs out of the box. The other six plug in via bring-your-own-key — costs land on your provider bill, the prompt stays the same.',
    cards: [
      { id: 'anthropic', name: 'Anthropic',  models: ['Opus 4.7', 'Sonnet 4.6', 'Haiku 4.5'], status: 'direct', color: 'from-amber-500 to-rose-500',     best: 'Best default — runs without keys.',          cost: 4, speed: 4, quality: 5 },
      { id: 'openai',    name: 'OpenAI',     models: ['GPT-5', 'GPT-5 mini', 'o1', 'o1-mini'], status: 'byok',  color: 'from-emerald-500 to-cyan-500',   best: 'Reasoning-tier picks excel at analysis.',     cost: 3, speed: 4, quality: 5 },
      { id: 'google',    name: 'Google',     models: ['Gemini 2.5 Pro', '2.5 Flash', '2.0 Flash'], status: 'byok', color: 'from-sky-500 to-indigo-500', best: 'Cheapest tier with a usable context window.', cost: 2, speed: 5, quality: 4 },
      { id: 'xai',       name: 'xAI',        models: ['Grok 3', 'Grok 2'],                    status: 'byok',  color: 'from-zinc-500 to-zinc-700',     best: 'Strong on current-events grounding.',         cost: 3, speed: 4, quality: 4 },
      { id: 'deepseek',  name: 'DeepSeek',   models: ['DeepSeek-R1', 'DeepSeek V3'],          status: 'byok',  color: 'from-blue-500 to-violet-500',   best: 'Reasoning at a fraction of the cost.',        cost: 1, speed: 3, quality: 4 },
      { id: 'mistral',   name: 'Mistral',    models: ['Mistral Large', 'Codestral'],          status: 'byok',  color: 'from-orange-500 to-red-500',    best: 'EU-hosted option for compliance.',            cost: 2, speed: 4, quality: 4 },
      { id: 'groq',      name: 'Groq',       models: ['Llama 3.3 70B', 'Llama 3.1 8B', 'Mixtral 8x7B'], status: 'byok',  color: 'from-lime-500 to-emerald-500',  best: 'Wildest token throughput on the market.',     cost: 1, speed: 5, quality: 3 },
    ],
  },
  features: {
    heading: 'My Stream — what the flagship actually does.',
    subhead:
      'An end-to-end editorial pipeline — scrape, analyze, score, draft, publish — wired to whichever frontier model fits your budget.',
    items: [
      {
        icon: 'git-branch-outline',
        title: 'Seven providers, one pipeline',
        body: 'Pick from Anthropic, OpenAI, Google, xAI, DeepSeek, Mistral, or Groq per workspace. Anthropic runs out-of-the-box; the rest plug in via BYOK.',
      },
      {
        icon: 'key-outline',
        title: 'Bring your own keys',
        body: 'Drop your provider keys into the BYOK panel. Costs land on your bill, not ours, and the same prompt routes through whichever model you pick.',
      },
      {
        icon: 'color-palette-outline',
        title: 'Editorial voice you define',
        body: 'Voice, reading level, target word count, target keywords, citation rules, custom prompt additions — set per workspace and the drafter respects them.',
      },
      {
        icon: 'analytics-outline',
        title: 'Quality-scored, threshold-gated',
        body: 'Every draft is scored against your minimum quality threshold. Cheaper models score lower on the same rubric, so the threshold auto-adjusts per model — no manual retuning.',
      },
      {
        icon: 'time-outline',
        title: 'Scheduled automation',
        body: 'Run the pipeline daily, on weekdays, or never. The automation Lambda streams progress over GraphQL subscriptions so you watch a job execute live.',
      },
      {
        icon: 'layers-outline',
        title: 'Workspaces & teams',
        body: 'Each org has its own model, voice, source feeds, keywords, and schedule. Switch workspaces without losing context.',
      },
    ],
  },
  howItWorks: {
    heading: 'How My Stream works',
    subhead: 'Three steps from "I have sources" to "I have a published article."',
    steps: [
      {
        icon: 'cloud-download-outline',
        title: 'Configure sources & voice',
        body: 'Add RSS feeds and topics. Pick a voice (formal, casual, journalistic…), reading level, word count, and your editorial rules.',
      },
      {
        icon: 'cog-outline',
        title: 'Pick a model and schedule',
        body: 'Choose Claude, GPT, Gemini, Grok, DeepSeek, Mistral, or Groq. Set a daily or weekday schedule — or run on demand.',
      },
      {
        icon: 'newspaper-outline',
        title: 'Review and publish',
        body: 'The pipeline scrapes, scores, drafts, and queues. You review, edit if needed, and publish to your stream.',
      },
    ],
  },
  faq: {
    heading: 'Frequently asked',
    items: [
      {
        q: 'Which AI models does My Stream support?',
        a: 'Anthropic Claude (Opus, Sonnet, Haiku) runs out of the box. OpenAI (GPT-5, mini, reasoning), Google Gemini, xAI Grok, DeepSeek, Mistral, and Groq all work via bring-your-own-key.',
      },
      {
        q: 'Do my AI keys ever leave my account?',
        a: 'Non-Anthropic models route through your own provider key — usage shows up on your bill with that provider, not on ours. Keys are stored encrypted per workspace.',
      },
      {
        q: 'Will switching to a cheaper model wreck my quality threshold?',
        a: 'No. Each model has a per-model qualityScoreOffset baked into the catalog, so the effective threshold auto-adjusts. Switching from Sonnet to Haiku does not silently reject every draft.',
      },
      {
        q: 'What is Mushaf?',
        a: 'A focused, ad-free digital Quran reader at mushaf.geohashim.com. Optimised for clean reading typography and a layout that mirrors the printed Mushaf page-for-page.',
      },
      {
        q: 'Where can I get the Online Quran app?',
        a: 'On Google Play — search for "Online Quran" or use the link in the Projects section. It runs offline once installed.',
      },
      {
        q: 'Can I write or read in a language other than English?',
        a: 'Yes. My Stream\'s drafter is voice-driven and the UI ships with @ngx-translate. The Quran apps are Arabic-first by definition.',
      },
      {
        q: 'Who builds geohashim?',
        a: 'Ahmed Hashim — the brand, the products, every commit. Working solo, shipping in public.',
      },
    ],
  },
  ctaBand: {
    headline: 'Three products. One person. Pick the one that helps you today.',
    subhead: 'My Stream for AI publishing. Mushaf for the web. Online Quran for Android. All linked above.',
    cta: { label: 'Open My Stream', href: PRODUCT_URL, external: true, variant: 'primary' },
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Ahmed Hashim. All rights reserved.`,
    links: [
      { label: 'My Stream', href: PRODUCT_URL, external: true },
      { label: 'Mushaf', href: MUSHAF_URL, external: true },
      { label: 'Online Quran', href: QURAN_ANDROID_URL, external: true },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'GitHub', href: GITHUB_URL, external: true },
      { label: 'LinkedIn', href: LINKEDIN_URL, external: true },
    ],
  },
  legal: {
    privacy: {
      updated: '2026-10-07',
      sections: [
        {
          heading: 'What this page covers',
          body: 'This page covers this site, landing.geohashim.com (geohashim.com redirects here). My Stream, Mushaf and the Android app are separate services and are not covered here.',
        },
        {
          heading: 'What this site collects',
          body: 'Nothing about you. There are no accounts, forms, cookies, analytics or ads. The demos on these pages run in your browser on data built into the page, and nothing you do in them is sent anywhere.',
        },
        {
          heading: 'What stays in your browser',
          body: 'If you pick a light or dark theme, the choice is saved in your browser\'s local storage so the next page opens the same way. It never leaves your device, and clearing your site data removes it.',
        },
        {
          heading: 'Who else sees your visit',
          body: 'The site is hosted on AWS Amplify, so AWS handles the requests that serve each page. The fonts load from Google Fonts, so your browser also sends a request to Google. Links to GitHub, LinkedIn, Google Play and the products take you to sites with their own policies.',
        },
        {
          heading: 'Contact',
          body: 'Questions about this page? Reach me through GitHub or LinkedIn, linked in the Contact section of the home page.',
        },
      ],
    },
    terms: {
      updated: '2026-10-07',
      sections: [
        {
          heading: 'What this site is',
          body: 'A personal portfolio of my work. It is provided as is, for information, with no warranty that it is complete or current.',
        },
        {
          heading: 'Code and projects',
          body: 'The open-source repositories shown here live on GitHub, and each repository\'s own licence applies to its code. My Stream, Mushaf and the Android app are separate services and are not covered by this page.',
        },
        {
          heading: 'Demos',
          body: 'The demos replay captured program output or run on data built into the page. Inputs marked Illustrative input were made up for the demo.',
        },
        {
          heading: 'Changes',
          body: 'If this page changes, the date at the top changes with it.',
        },
      ],
    },
  },
  pricing: {
    checked: '7 October 2026',
    intro: 'My Stream is billed per workspace, by the month, through Stripe. These are the plans the product lists on its own pricing section.',
    plans: [
      { name: 'Free', price: '$0' },
      { name: 'Pro', price: '$29 a month' },
      { name: 'Business', price: '$149 a month' },
      { name: 'Enterprise', price: 'Custom' },
    ],
    source:
      'Copied from the pricing section at feed.geohashim.com on 7 October 2026. If this list and the billing screen inside a workspace ever differ, trust the billing screen.',
    sections: [
      {
        heading: 'Start with a trial',
        body: 'Creating a workspace starts a 14-day trial. No card is asked for until you choose a plan.',
      },
      {
        heading: 'What a plan limits',
        body: 'The limit plans are set up with is a count of AI generations per workspace per calendar month. It is checked right before each article the AI writes, whether from the article queue or a scheduled run. At the cap no more articles are written, and the error asks you to upgrade the plan. The code can also stop AI generation at a monthly spend limit in dollars when a plan carries one. The number for each plan lives in the product and is not repeated here.',
      },
      {
        heading: 'Paying, changing plan and cancelling',
        body: "Choosing a plan in the workspace's billing settings opens Stripe Checkout for a monthly subscription. If the workspace already has one, the plan is switched on that subscription instead, with prorated charges. Payment methods, invoices and cancelling are handled in Stripe's customer portal, opened from the same screen. Workspace owners and admins can open billing settings.",
      },
      {
        heading: 'AI provider costs',
        body: "Anthropic models run on the platform's own key. The other nine providers (OpenAI, Google, xAI, DeepSeek, Mistral, Groq, Cerebras, OpenRouter and SambaNova) run on the workspace's own API key, so any charge for those calls comes from that provider directly.",
      },
    ],
  },
};
