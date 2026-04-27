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

export type RoutePath = '/' | '/privacy' | '/terms';

export interface SiteContent {
  brand: { name: string; wordmark: string; tagline: string };
  urls: { product: string; github: string; linkedin: string; canonical: string };
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
  about: {
    eyebrow: string;
    name: string;
    headline: string;
    body: string[];
    bullets: AboutBullet[];
    ctas: Cta[];
  };
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
const CANONICAL = 'https://geohashim.com';

export const SITE: SiteContent = {
  brand: {
    name: 'geohashim',
    wordmark: 'geohashim',
    tagline: 'Ahmed Hashim — and the AI publishing tool he built.',
  },
  urls: {
    product: PRODUCT_URL,
    github: 'https://github.com/ahmed-hashim-pro',
    linkedin: 'https://www.linkedin.com/in/ahmed-hashim-8760ab108/',
    canonical: CANONICAL,
  },
  seo: {
    defaultTitle: 'geohashim — Ahmed Hashim & My Stream, an AI publishing platform',
    defaultDescription:
      'Ahmed Hashim builds My Stream — an AI publishing platform that scrapes, scores, and drafts articles using Claude, GPT, Gemini and more, on the editorial voice you define.',
    ogImage: '/assets/og-image.png',
    routes: {
      '/': {
        title: 'geohashim — Ahmed Hashim & My Stream, an AI publishing platform',
        description:
          'Ahmed Hashim builds My Stream — an AI publishing platform that scrapes, scores, and drafts articles using Claude, GPT, Gemini and more, on the editorial voice you define.',
      },
      '/privacy': {
        title: 'Privacy Policy — geohashim',
        description: 'How geohashim collects, stores, and uses your information.',
      },
      '/terms': {
        title: 'Terms of Service — geohashim',
        description: 'The terms that govern your use of geohashim and My Stream.',
      },
    },
  },
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
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
    headlineAccent: 'My Stream — an AI publishing platform.',
    subhead:
      'My Stream scrapes the sources you trust, scores what matters, and drafts publishable articles in your editorial voice — using Claude, GPT, Gemini, Grok, DeepSeek, Mistral, or Groq. You set the rules; the pipeline runs on a schedule.',
    ctas: [
      { label: 'Open My Stream', href: PRODUCT_URL, external: true, variant: 'primary' },
      { label: 'See how it works', href: '#how-it-works', variant: 'ghost' },
    ],
    mockAlt: 'Preview of the My Stream AI Studio showing model picker, editorial voice controls, and a scheduled automation run.',
  },
  about: {
    eyebrow: 'About',
    name: 'Ahmed Hashim',
    headline: 'I ship products that turn AI into something useful.',
    body: [
      'I\'m a software engineer working at the intersection of editorial workflow and applied AI. My Stream is the product I keep coming back to — a tool that lets a small team behave like a real publication, with the model, the voice, and the schedule all under their control.',
      'Outside of My Stream I build with Angular, Ionic, AWS, and the Anthropic + OpenAI stacks. I also keep an open-source presence and write occasionally about what I\'m learning.',
    ],
    bullets: [
      { icon: 'sparkles-outline', text: 'Building My Stream — an AI editorial pipeline used by independent publishers.' },
      { icon: 'code-slash-outline', text: 'Angular, Ionic, AWS Amplify Gen 2, Anthropic SDK, OpenAI SDK.' },
      { icon: 'globe-outline', text: 'Multi-language by default; built for teams who don\'t publish only in English.' },
      { icon: 'person-circle-outline', text: 'Working solo, shipping in public, open to consulting on AI publishing pipelines.' },
    ],
    ctas: [
      { label: 'GitHub', href: 'https://github.com/ahmed-hashim-pro', external: true, variant: 'ghost' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ahmed-hashim-8760ab108/', external: true, variant: 'ghost' },
    ],
  },
  features: {
    heading: 'What My Stream actually does.',
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
        q: 'Can I write in a language other than English?',
        a: 'Yes. The drafter prompt is voice-driven, and the platform UI itself ships with @ngx-translate. Multi-language was a day-one requirement.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'My Stream ships a Capacitor-based mobile build alongside the web app — same workspace, same feed, same schedule.',
      },
      {
        q: 'What does it cost?',
        a: 'My Stream itself runs on a Stripe-billed subscription (early-access pricing today). Model usage is either covered by Anthropic credits (default) or your own provider keys (BYOK).',
      },
      {
        q: 'Who builds geohashim and My Stream?',
        a: 'Ahmed Hashim — the brand, the product, and every commit. Working solo, shipping in public.',
      },
    ],
  },
  ctaBand: {
    headline: 'Want a publishing pipeline that respects your voice?',
    subhead: 'Open My Stream, point it at your sources, pick a model, and watch the first run go.',
    cta: { label: 'Open My Stream', href: PRODUCT_URL, external: true, variant: 'primary' },
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Ahmed Hashim. All rights reserved.`,
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'GitHub', href: 'https://github.com/ahmed-hashim-pro', external: true },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ahmed-hashim-8760ab108/', external: true },
    ],
  },
  legal: {
    privacy: {
      updated: '2026-04-28',
      sections: [
        {
          heading: 'Overview',
          body: 'This is placeholder copy for the geohashim privacy policy. Replace it with reviewed legal text before launch. The product (My Stream) ships a more detailed in-product policy at feed.geohashim.com.',
        },
        {
          heading: 'What we collect',
          body: 'On geohashim.com we collect no personal data. The product at feed.geohashim.com collects the information you provide at signup and the content you choose to post.',
        },
        {
          heading: 'AI providers and your keys',
          body: 'When you use bring-your-own-key models inside My Stream, your keys are stored encrypted per workspace and used only to make calls to the provider you have chosen.',
        },
        {
          heading: 'Your choices',
          body: 'You can export, edit, or delete your data inside My Stream at any time from your workspace settings.',
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
          body: 'You agree to use My Stream within applicable laws and to respect the licensing of the sources you scrape and the AI providers you call.',
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
