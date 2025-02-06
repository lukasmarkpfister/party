import { config } from "dotenv";
config({ path: ".env.local" });

export default {
    schema: "./src/db/schema.ts", // Path to generate schema
    out: "./drizzle",       // Path for migrations (optional)
    dialect: "postgresql",  // Specify the database dialect
    dbCredentials: {
        url: process.env.DATABASE_URL, // Use 'url' instead of 'connectionString'
    },
} as const;
