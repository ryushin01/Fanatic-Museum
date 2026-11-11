export type { components, paths } from './schema';
import type { components } from './schema';

type Schemas = components['schemas'];
export type Work = Schemas['Work'];
export type WorkList = Schemas['WorkList'];
export type WorkImage = Schemas['Image'];
export type Category = Schemas['Category'];
export type CategorySlug = Schemas['CategorySlug'];
export type CategorySummary = Schemas['CategorySummary'];
export type Creator = Schemas['Creator'];
export type Author = Schemas['Author'];
