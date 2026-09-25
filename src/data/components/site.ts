import type { Registry } from './types';

// Pieces of the site every page or every article carries.
export const SITE_COMPONENTS: Registry = {
  components: [
    { id: 'site-header', kind: 'shell', label: 'Site header', status: 'shell' },
    { id: 'author-byline', kind: 'shell', label: 'Author byline', status: 'shell' },
    { id: 'author-bio', kind: 'shell', label: 'About the author', status: 'shell' },
    { id: 'short-version', kind: 'shell', label: 'The short version', status: 'shell' },
    { id: 'booking-line', kind: 'shell', label: 'Booking line', status: 'shell' },
  ],
};
