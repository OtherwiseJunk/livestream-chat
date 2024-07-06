import createMetascraper, { Metadata, Metascraper } from "metascraper";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import got from "got";

export const metascraper: Metascraper = createMetascraper([metascraperDescription(), metascraperImage(), metascraperTitle(), metascraperUrl()]);

export async function setEmbed(messageData: { message: string, embed?: Metadata }, metadata: Metascraper = metascraper) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
    const urlMatches = messageData.message.match(urlRegex);

    if (urlMatches) {
        try {
            const url = urlMatches[0];
            const { body: html } = await got(url);
            messageData.embed = await metadata({ html, url });
        } catch (error) {
            console.error(error);
        }
    }
}
