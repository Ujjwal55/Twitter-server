import JWT from "jsonwebtoken";
import { prismaClient } from "../db/index.db";
import { User } from "@prisma/client";
import { JWTUser } from "../interfaces";

class JWTService{
    public static generateToken(user: User){
        const payload: JWTUser = {
            id: user?.id,
            email: user?.email,
        }
        const token = JWT.sign(payload, "secret");
        return token;
    }
    public static decodeToken(token: string){
        try{
            console.log("JJjjj", JWT.verify(token, "secret") as JWTUser);
            return JWT.verify(token, "secret") as JWTUser;
        } catch(err){
            return null;
        }
    }
}

export default JWTService;