import type { Registry } from './types';
import { SITE_COMPONENTS } from './site';
import { TREAT_BANK_MARKETING_CONTENT_AS_DATA } from './treat-bank-marketing-content-as-data';

// Every component registry the lineage build checks marks against. Add an article's here.
export const REGISTRIES: Registry[] = [SITE_COMPONENTS, TREAT_BANK_MARKETING_CONTENT_AS_DATA];
