export type Matches = IterableIterator<RegExpMatchArray>;

/**
 * Represents a service that can be rewritten
 */
export interface Service {
  /**
   * The pretty name of the service, e.g., 'Twitter'
   */
  prettyName: string;

  /**
   * Matches any values that are a suitable url to rewrite.
   * 
   * @param content The string to test
   */
  matches(content: string): Matches;
  
  /**
   * Rewrites a link from its parsed (regex) form to the final form
   * that cn embed.
   * 
   * @param link The data to rewrite using
   */
  rewrite(link: string[]): string;
}