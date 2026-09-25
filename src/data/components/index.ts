import type { Registry } from './types';
import { SITE_COMPONENTS } from './site';
import { YOUR_CONTENT_HAS_NO_PARENT } from './your-content-has-no-parent';

// Every component registry the lineage build checks marks against. Add an article's here.
export const REGISTRIES: Registry[] = [SITE_COMPONENTS, YOUR_CONTENT_HAS_NO_PARENT];
