import { redixClient } from "../client/redis";
import { prismaClient } from "../db/index.db";

export interface CreateTweetPayload{
    content: string;
    imageURL?: string;
    userId: string;
}

class TweetService{
    public static async createTweet(payload: CreateTweetPayload){
        const isRateLimited = await redixClient.get(`rate_limited: ${payload.userId}`);
        if(isRateLimited){
            throw new Error("You are rate limited");
        }
        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload?.imageURL,
                author: {
                    connect: {
                        id: payload.userId
                    },
                }
            }
        });
        await redixClient.setex(`rate_limited: ${payload.userId}`, 1, 1);
        await redixClient.del(`allTweets`);
        return tweet;
    }
    public static async getAllTweets(){
        const cachedTweets = await redixClient.get(`allTweets`);
        if(cachedTweets) return JSON.parse(cachedTweets);
        const tweets = await prismaClient.tweet.findMany({orderBy: {createdAt: 'desc'}}) 
        await redixClient.set(`allTweets`, JSON.stringify(tweets));
        return tweets;
    }
}

export default TweetService;