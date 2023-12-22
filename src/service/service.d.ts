import { APIEmbed } from "discord-api-types/v10";

/**
 * Represents a service that can be rewritten
 */
export interface Service {
  /**
   * The pretty name of the service, e.g., 'Twitter'
   */
  prettyName: string;
  regex: RegExp;
  
  /**
   * Rewrites a link from its parsed (regex) form to the final form
   * that cn embed.
   * 
   * @param link The data to rewrite using
   */
  rewrite(link: string[]): string;

  /**
   * The features that this source supports
   */
  features: Features;
}


export type Features = Partial<{
  waitForEmbed: {
    isOriginalLinkHealthy(embed: APIEmbed): boolean;
    isRewrittenLinkHealthy(embed: APIEmbed): boolean;
  },
  cleanup: {
    isHealthy(embed: APIEmbed): boolean;
  }
}>;