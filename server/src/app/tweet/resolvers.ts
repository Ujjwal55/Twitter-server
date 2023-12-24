import { Tweet } from "@prisma/client";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import { prismaClient } from "../../db/index.db";
import { GraphQLContext } from "../../interfaces";
import UserService from "../../services/user.service";
import TweetService, { CreateTweetPayload } from "../../services/tweet.service";

const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION
})

const mutations = {
    createTweet: async (parent: any, {payload}: {payload: CreateTweetPayload}, context: GraphQLContext) => {
        console.log("rrrrrrrrrrrr");
        if (!context.user) {
            throw new Error("You must be logged in to create a tweet!");
        }
        console.log("aaaaa", payload, context.user);
    
        try {
            const tweet = await TweetService.createTweet({...payload, userId: context.user.id})
    
            console.log("Created tweet:", tweet);
    
            return tweet;
        } catch (error) {
            console.error("Error creating tweet:", error);
            throw error;
        }
    }
}
const queries = {
    getAllTweets: () => TweetService.getAllTweets(),
    getSignedURLForTweet: async(parent: any, {imageType}: {imageType: string}, context: GraphQLContext) => {
        if(!context.user || !context.user.id){
            throw new Error("Unautheticated")
        }
        const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if(!allowedImageTypes.includes(imageType)){
            throw new Error("Invalid image type")
        }
        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `uploads/tweet-${context.user.id}-${imageType}`,
        })
        const signedURL = await getSignedUrl(s3Client, putObjectCommand);
        return signedURL;
    }
}
const extraResolvers = {
    Tweet: {
        author: (parent: Tweet) => UserService.getUserByID(parent.authorId)
    }
}

export const resolvers = {mutations, extraResolvers, queries}