import dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";

const client = createClient({
    username: "default",
    password: process.env.REDIS_P,
    socket: {
        host: "redis-14749.c212.ap-south-1-1.ec2.cloud.redislabs.com",
        port: 14749
    }
});

client.on("error", (err) => {
    console.error("Redis Client Error:", err);
});

client.on("ready", () => {
    console.log("Redis ready...");
});

client.on("reconnecting", () => {
    console.log("Redis reconnecting...");
});

export default client;