import axios from 'axios'
import { prismaClient } from '../../db/index.db';
import JWTService from '../../services/jwt.service';

const queries = {
    verifyGoogleToken: async(parent: any, {token}: {token: string}) => {
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
}

export const resolvers = {queries}