import { Service } from "./service";
import { tiktok } from "./services/tiktok";
import { twitter } from "./services/twitter";

export const services = {
  tiktok,
  twitter
}

const serviceList = [tiktok, twitter] as const;

export type ServiceId = (typeof serviceList)[number]['id'];

export const getServices = (content: string): Service[] => {
  return serviceList.filter(
    (service) => doesMatchAny(content, service.regex)
  );
}

interface RunResult {
  service: Service;
  links: Record<string, string>;
}

/**
 * Checks the message content for any links that should be rewritten
 * such that they embed (through another service).
 * 
 * @param content The message content to check
 * @returns The rewritten links, if any
 */
export const run = (content: string, testAgainst: readonly Service[] | null = null): RunResult[] | null => {
  testAgainst ??= serviceList;
  const fixedLinks = [] as any[];

  for(const service of testAgainst) {
    const matches = [];
    // to array from iterator
    try {
      let match;
      while (match = service.regex.exec(content)) {
        matches.push(match);
      }
    } catch(err) {
      console.error('error matching all', err);
      continue;
    }

    if (matches.length === 0) continue;

    fixedLinks.push({
      service: service,
      links: matches.reduce((acc: Record<string, string>, match) => { 
        const [original,] = match;
        acc[original] = service.rewrite(match);

        return acc;
      }, {})
    });
  }

  if (fixedLinks.length === 0) return null;

  return fixedLinks;
}

const doesMatchAny = (content: string, regex: RegExp) => content.match(regex) !== null;
// const matchAll = (content: string, regex: RegExp) => content.match(regex);