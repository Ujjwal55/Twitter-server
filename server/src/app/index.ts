import express from "express"
import {ApolloServer} from "@apollo/server"
import bodyParser from "body-parser"
import cors from "cors"
import {expressMiddleware} from "@apollo/server/express4"

import {User} from "./user/index.user"

export async function initServer(){
    const app = express()
    app.use(bodyParser.json())
    app.use(cors())
    const apolloServer = new ApolloServer({
        typeDefs: `
        ${User.types}
            type Query {
                ${User.queries}
            }
        `,
        
        resolvers: {
            Query: {
                ...User.resolvers.queries
            },
        },
    });

    await apolloServer.start();
    app.use("/graphql", expressMiddleware(apolloServer))
    return app;
}