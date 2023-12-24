import express from "express"
import {ApolloServer} from "@apollo/server"
import bodyParser from "body-parser"
import cors from "cors"
import {expressMiddleware} from "@apollo/server/express4"

import {User} from "./user/index.user"
import {Tweet} from "./tweet/index"
import { GraphQLContext } from "../interfaces"
import JWTService from "../services/jwt.service"

export async function initServer(){
    const app = express()
    app.use(bodyParser.json())
    app.use(cors())
    const apolloServer = new ApolloServer<GraphQLContext>({
        typeDefs: `
        ${User.types}
        ${Tweet.types}
            type Query {
                ${User.queries}
                ${Tweet.queries}
            }
            type Mutation {
                ${Tweet.mutations}
                ${User.mutations} 
            }
        `,
        
        resolvers: {
            Query: {
                ...User.resolvers.queries,
                ...Tweet.resolvers.queries
            },
            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations
            },
            ...Tweet.resolvers.extraResolvers,
            ...User.resolvers.extraResolvers
        },
    });

    await apolloServer.start();
    app.use("/graphql", expressMiddleware(apolloServer, {
        context: async({req, res}) => {
        return {user: req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split('Bearer ')[1]) : undefined
    };
    },
})
    )
    return app;
}