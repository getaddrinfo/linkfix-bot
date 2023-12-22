import { Service } from "../service";

export const tiktok: Service = {
  prettyName: 'TikTok',
  regex: /(?:https?:\/\/)(?:www\.)?(?:tiktok\.com\/(?:v\/|@[^\/]+\/video\/|embed\/)|vm\.tiktok\.com\/)(?:([\w-]+(?:(\/)?)))/gi,

  rewrite(link: string[]): string {
    const [url,] = link;
    return url.replace('tiktok.com', 'vxtiktok.com');
  },

  features: {
    waitForEmbed: {
      isOriginalLinkHealthy(embed) {
        return embed.type === 'article'
      },
      isRewrittenLinkHealthy(embed) {
        return embed.type === 'video';
      }
    }
  }
}