import { Service } from "../service";

export const twitter: Service = {
  id: 'twitter',
  prettyName: 'Twitter',
  regex: /(?:https?):\/\/(?:twitter|x)\.com\/(\w+)\/status(?:es)?\/(\d+)/gi,
  rewrite(link: string[]): string {
    const [,username,statusId] = link;
    return `https://vxtwitter.com/${username}/status/${statusId}`;
  },
  features: {}
};