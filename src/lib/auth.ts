import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
    database: db,
    emailAndPassword: {
        enabled: true,
    },
});
