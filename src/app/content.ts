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
  legal: {
    privacy: {
      updated: '2026-10-07',
      sections: [
        {
          heading: 'What this page covers',
          body: 'This page covers this site, geohashim.com (landing.geohashim.com serves the same pages). My Stream, Mushaf and the Android app are separate services and are not covered here.',
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
