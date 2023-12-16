import JWT from "jsonwebtoken";
import { prismaClient } from "../db/index.db";
import { User } from "@prisma/client";

class JWTService{
    public static generateToken(user: User){
        const payload = {
            id: user?.id,
            email: user?.email,
        }
        const token = JWT.sign(payload, "secret");
        return token;
    }
}

export default JWTService;