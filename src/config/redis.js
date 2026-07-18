import dotenv from "dotenv";
dotenv.config();
import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: process.env.REDIS_P,
    socket: {
        host: 'redis-14749.c212.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 14749
    }
});

export default client;
