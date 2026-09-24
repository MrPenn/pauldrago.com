// Shared schema.org entities. Base.astro adds these to every page's JSON-LD graph, so the
// person, the company, and the website are described once and identically everywhere.
import { AUTHOR } from './author';

export const SITE = 'https://pauldrago.com';
export const PERSON_ID = AUTHOR.id;
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

const KNOWS_ABOUT = [
  'Bank marketing measurement',
  'Bank marketing operations',
  'Funded-balance and retention reporting',
  'Branch and market expansion analysis',
  'Bank acquisition footprint analysis',
  'CRA and fair-access market context',
  'Fractional CMO leadership for regulated financial services',
];

export const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR.name,
  url: AUTHOR.url,
  email: 'mailto:paul@pauldrago.com',
  jobTitle: AUTHOR.jobTitle,
  description: 'Paul Drago advises banks and credit unions on marketing measurement, marketing operations, and market decisions. He spent eight years in digital and marketing at a community bank holding company.',
  worksFor: { '@id': ORG_ID },
  knowsAbout: KNOWS_ABOUT,
  sameAs: [AUTHOR.linkedin],
};

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Glass Vase, LLC',
  url: `${SITE}/`,
  email: 'mailto:paul@pauldrago.com',
  description: "Glass Vase, LLC is Paul Drago's advisory company. It provides marketing measurement and operations, market and acquisition analysis, and fractional marketing leadership to banks and credit unions.",
  founder: { '@id': PERSON_ID },
  employee: { '@id': PERSON_ID },
  areaServed: { '@type': 'Country', name: 'United States' },
  knowsAbout: KNOWS_ABOUT,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'paul@pauldrago.com',
    url: AUTHOR.booking,
    availableLanguage: 'English',
  },
};

export const WEBSITE = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: 'Paul Drago',
  description: 'Marketing measurement and operations, market analysis, and fractional marketing leadership for banks and credit unions.',
  inLanguage: 'en-US',
  publisher: { '@id': ORG_ID },
  author: { '@id': PERSON_ID },
};

export const SHARED_NODES = [PERSON, ORGANIZATION, WEBSITE];

// Page-level types that belong to the website and carry the page's modified date.
export const PAGE_TYPES = new Set(['WebPage', 'ProfilePage', 'CollectionPage', 'AboutPage', 'ContactPage']);

export const breadcrumb = (id: string, items: Array<[string, string]>) => ({
  '@type': 'BreadcrumbList',
  '@id': id,
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
});
