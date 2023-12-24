import axios from 'axios'
import { prismaClient } from '../../db/index.db';
import JWTService from '../../services/jwt.service';
import { GraphQLContext } from '../../interfaces';
import { User } from '@prisma/client';
import UserService from '../../services/user.service';
import { redixClient } from '../../client/redis';

const mutations = {
    followUser: async (parent: any, {to}: {to: string}, context: GraphQLContext) => {
        if(!context.user || !context.user.id) throw new Error('You must be logged in to follow a user');
        await UserService.followUser(context.user.id, to);
        await redixClient.del(`recommendedUsers: ${context?.user?.id}`);
        return true;
    },
    unfollowUser: async (parent: any, {to}: {to: string}, context: GraphQLContext) => {
        if(!context.user || !context.user.id) throw new Error('You must be logged in to follow a user');
        await UserService.unfollowUser(context.user.id, to);
        await redixClient.del(`recommendedUsers: ${context?.user?.id}`);
        return true;
    }
}

const queries = {
    verifyGoogleToken: async(_: any, {token}: {token: string}) => {
        const resultToken = UserService.verifyGoogleAuthToken(token);
        return resultToken;
    },
    getCurrentUser: async(_: any, args: any, context: GraphQLContext) => {
        const id = context.user?.id
        if(!id) return null;
        const user = await UserService.getUserByID(id);
        console.log("userrrrr", user);
        return user;
    },
    getUserById: async (_: any, {id}: {id: string}, context: GraphQLContext) => {
        const user = UserService.getUserByID(id);
        if(!user){
            return null;
        }
        return user;
    }
    
}

const extraResolvers = {
    User: {
        tweets: (parent: User) => {
           return prismaClient.tweet.findMany({where: {author: {id: parent.id}}})
        },
        followers: async (parent: User) => {
            const result = await prismaClient.follows.findMany({where: {following: {id: parent.id}}, include: {
                follower: true
            }})
            return result.map((follow) => follow.follower);
        },
        following: async (parent: User) => {
            const result = await prismaClient.follows.findMany({
                where: {follower: {id: parent.id}},
                include: {
                    follower: true,
                    following: true
                }
            })
            return result.map(({follower, following}) => following)
        },
        recommendedUsers: async (parent: User, a: any, context: GraphQLContext) => {
            if(!context.user) return [];
            const cachedValue = await redixClient.get(`recommendedUsers: ${context?.user?.id}`);
            if(cachedValue) return JSON.parse(cachedValue);
            const myFollowings = await UserService.getRecommendedUsers(context.user.id);
            const users: User[] = [];
            for(const followings of myFollowings){
                for(const followingOfFollowedUser of followings.following.followers){
                    if(followingOfFollowedUser.following.id !== context.user.id && myFollowings.findIndex(e => e.followingId === followingOfFollowedUser.following.id) < 0){
                        users.push(followingOfFollowedUser.following);
                    }

                }
            }
            await redixClient.set(`recommendedUsers: ${context?.user?.id}`, JSON.stringify(users))
            return users;
        }
    },

}

export const resolvers = {queries, extraResolvers, mutations}