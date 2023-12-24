import axios from "axios";
import { prismaClient } from "../db/index.db";
import JWTService from "./jwt.service";

class UserService {
    public static async verifyGoogleAuthToken(token: string){
            const googleToken = token;
            const googleOAuthURL = new URL("https://oauth2.googleapis.com/tokeninfo")
            googleOAuthURL.searchParams.set("id_token", googleToken);
    
            const {data} = await axios.get(googleOAuthURL.toString(), {
                responseType: "json"
            })
            console.log("ooooo", data);
            const user = await prismaClient.user.findUnique({
                where: {
                    email: data.email
                }
            })
            if(!user){
                await prismaClient.user.create({
                    data: {
                        email: data.email,
                        firstName: data.given_name,
                        lastName: data.family_name,
                        profileImageURL: data.picture
                    }
                })
            }
            const existingUser = await prismaClient.user.findUnique({
                where: {
                    email: data.email
                }
            })
            if(!existingUser){
                throw new Error("User not found");
            }
    
            const userToken = await JWTService.generateToken(existingUser);
            return userToken;
    }
    public static getUserByID(id: string){
        return prismaClient.user.findUnique({
            where: {
                id: id
            }
        })
    }
    public static followUser(from: string, to: string) {
        return prismaClient.follows.create({
            data:{
                follower: {connect: {id: from}},
                following: {connect: {id: to}}
            }
        })
    }
    public static unfollowUser(from: string, to: string) {
        return prismaClient.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: from,
                    followingId: to
                }
            }
    })}
    public static getRecommendedUsers = (id: string) => {
         return prismaClient.follows.findMany({
            where: {
                follower: {
                    id
                }
            },
            include: {
               following: {
                include: {
                    followers: {
                        include: {
                            following: true
                        }
                    }
                }
               }
            }
        })
    }
}

export default UserService;