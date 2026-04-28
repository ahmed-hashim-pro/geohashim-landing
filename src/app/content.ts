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

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export interface AboutBullet {
  icon: string;
  text: string;
}

export interface Stat {
  value: string;
  label: string;
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

export type RoutePath = '/' | '/privacy' | '/terms';

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
    routes: Record<RoutePath, { title: string; description: string }>;
  };
  nav: NavLink[];
  primaryCta: Cta;
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
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
  features: { heading: string; subhead: string; items: Feature[] };
  howItWorks: { heading: string; subhead: string; steps: Step[] };
  testimonial: Testimonial;
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
}

const PRODUCT_URL = 'https://feed.geohashim.com';
const MUSHAF_URL = 'https://mushaf.geohashim.com';
const QURAN_ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.medoapps.www.onlinequran';
const GITHUB_URL = 'https://github.com/ahmed-hashim-pro';
const LINKEDIN_URL = 'https://www.linkedin.com/in/ahmed-hashim-8760ab108/';
const CANONICAL = 'https://geohashim.com';

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
    defaultTitle: 'geohashim — Ahmed Hashim · AI tools, web, and mobile apps',
    defaultDescription:
      'Ahmed Hashim builds shipped products: My Stream (AI publishing platform), Mushaf (digital Quran reader), and the Online Quran Android app. Software at the intersection of AI, editorial workflow, and Islamic resources.',
    ogImage: '/og-image.svg',
    routes: {
      '/': {
        title: 'geohashim — Ahmed Hashim · AI tools, web, and mobile apps',
        description:
          'Ahmed Hashim builds shipped products: My Stream (AI publishing platform), Mushaf (digital Quran reader), and the Online Quran Android app.',
      },
      '/privacy': {
        title: 'Privacy Policy — geohashim',
        description: 'How geohashim collects, stores, and uses your information.',
      },
      '/terms': {
        title: 'Terms of Service — geohashim',
        description: 'The terms that govern your use of geohashim and its products.',
      },
    },
  },
  nav: [
    { label: 'Projects', href: '#projects' },
    { label: 'About', href: '#about' },
    { label: 'My Stream', href: '#features' },
    { label: 'FAQ', href: '#faq' },
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
    { value: 'iOS · Android · Web', label: 'platforms' },
    { value: '10+', label: 'languages supported' },
  ],
  about: {
    eyebrow: 'About',
    name: 'Ahmed Hashim',
    headline: 'Software engineer. Builder. Solo shipper.',
    body: [
      'I\'m a software engineer who likes the whole pipeline — from a half-formed idea to a shipped, maintained product. My current focus is applied AI for publishing workflows, but I also keep a long-running line of work in Islamic resources: a digital Mushaf and a Quran Android app that have been in users\' hands for years.',
      'Most of what I build is shipped solo. I\'m comfortable owning the stack end-to-end: Angular and Ionic on the front, AWS and Firebase on the back, with whichever AI provider fits the job. I write occasionally about what I\'m learning, and I\'m open to consulting on AI-first editorial tooling.',
    ],
    bullets: [
      { icon: 'sparkles-outline', text: 'Building AI editorial pipelines used by independent publishers.' },
      { icon: 'book-outline', text: 'Long-running line of work on Islamic resources — Mushaf and Quran apps.' },
      { icon: 'globe-outline', text: 'Multi-language by default; English isn\'t the only audience.' },
      { icon: 'rocket-outline', text: 'Working solo, shipping in public, available for consulting on AI publishing.' },
    ],
    techStack: [
      'Angular',
      'Ionic',
      'Capacitor',
      'AWS Amplify',
      'Firebase',
      'Anthropic',
      'OpenAI',
      'Stripe',
      'TypeScript',
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
  testimonial: {
    quote:
      'I get a daily queue of properly-sourced drafts in our voice. The bit that used to take a writer four hours now takes me twenty minutes of editing.',
    name: 'A. Reader',
    role: 'Early access user',
    initials: 'AR',
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
      updated: '2026-04-28',
      sections: [
        {
          heading: 'Overview',
          body: 'This is placeholder copy for the geohashim privacy policy. Replace it with reviewed legal text before launch. Each product (My Stream, Mushaf, Online Quran) ships its own in-product policy where applicable.',
        },
        {
          heading: 'What we collect',
          body: 'On geohashim.com we collect no personal data. The products at feed.geohashim.com, mushaf.geohashim.com, and the Online Quran Android app each describe their own data handling in-product.',
        },
        {
          heading: 'AI providers and your keys',
          body: 'When you use bring-your-own-key models inside My Stream, your keys are stored encrypted per workspace and used only to make calls to the provider you have chosen.',
        },
        {
          heading: 'Your choices',
          body: 'You can export, edit, or delete your data inside any of the products at any time from their settings.',
        },
        {
          heading: 'Contact',
          body: 'Questions about this policy? Reach out via the links in the footer.',
        },
      ],
    },
    terms: {
      updated: '2026-04-28',
      sections: [
        {
          heading: 'Acceptance',
          body: 'This is placeholder copy for the geohashim terms of service. Replace it with reviewed legal text before launch.',
        },
        {
          heading: 'Use of the service',
          body: 'You agree to use the geohashim products within applicable laws and to respect the licensing of the sources you scrape and the AI providers you call.',
        },
        {
          heading: 'Your content',
          body: 'You retain ownership of every article you publish. You grant geohashim a limited license to display it as part of the service.',
        },
        {
          heading: 'Termination',
          body: 'You can close your account at any time. We may suspend accounts that violate these terms or abuse third-party AI providers.',
        },
        {
          heading: 'Changes',
          body: 'We may update these terms. Material changes will be posted to this page with a new updated-on date.',
        },
      ],
    },
  },
};
