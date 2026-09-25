// A component is anything reused across pages or sections: a figure, a rule, a story, a site-wide
// piece like the header. Pages mark where each one renders (data-c="id" on an element, or
// <data value="c:id">text</data> inline), and the lineage build reads those marks back out of the
// finished HTML. Every component has to say where it came from, or the build fails.
export type Status =
  | 'shell'        // part of the site itself (header, booking line); its parent is the site
  | 'sourced'      // backed by the article's footnotes, listed in `sources`
  | 'derived'      // computed from other components, listed in `derivedFrom`
  | 'firsthand'    // the author's own experience or analysis; its parent is the author
  | 'placeholder'  // declared as a stand-in for the reader's own number
  | 'hypothetical' // an invented example, declared as one
  | 'orphan';      // no parent, named on purpose (folklore the article refuses to use)

export type Version = { value: string; from: string; to?: string; note: string };

export type Component = {
  id: string;
  kind: 'shell' | 'figure' | 'rule' | 'story' | 'term';
  label: string;
  status: Status;
  value?: string;
  // Accepted spellings. When set, every inline mark for this component must contain one of them,
  // so a figure cannot drift between the summary, the body and the tables.
  match?: string[];
  sources?: number[];
  derivedFrom?: string[];
  note?: string;
  versions?: Version[];
};

export type Registry = { article?: string; components: Component[] };
