import { Matches, Service } from "./service";

export const services: Service[] = [
  {
    prettyName: 'Twitter',
    matches(content: string): Matches {
      return content.matchAll(/https?:\/\/twitter\.com\/(\w+)\/status(es)?\/(\d+)/gi);
    },
    rewrite(link: string[]): string {
      const [,user,,id] = link;
      return `https://vxtwitter.com/${user}/status/${id}`;
    }    
  },
  {
    prettyName: 'TikTok',
    matches(content: string): Matches {
      return content.matchAll(/https?:\/\/((?:m|www|vm)?\.?tiktok\.com)\/((?:.*\b(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+))|\w+)/gi);
    },
    rewrite(link: string[]): string {
      const [url,domain,] = link;
      return url.replace(domain, domain.replace('tiktok', 'vxtiktok'));
    },
  }
]

/**
 * Checks the message content for any links that should be rewritten
 * such that they embed (through another service).
 * 
 * @param content The message content to check
 * @returns The rewritten links, if any
 */
export const run = (content: string) => {
  const fixedLinks = [] as any[];

  for(const service of services) {
    const matches = [...service.matches(content)];


    if (matches.length === 0) continue;
    fixedLinks.push({
      service: service.prettyName,
      links: matches.map((link) => service.rewrite(link))
    });
  }

  return fixedLinks;
}