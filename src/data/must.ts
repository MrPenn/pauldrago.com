// A lookup the page cannot do without: a town, a year of the ramp, a county. When the data stops
// holding it, the build fails and says which, instead of rendering "undefined" on the live page.
export function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`Missing ${what} in the site data`);
  return value;
}
