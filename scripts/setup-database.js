#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script automates the process of setting up the database schema
 * by running the SQL migration files in the correct order.
 *
 * Usage:
 *   node scripts/setup-database.js
 *
 * Requirements:
 *   - Node.js
 *   - Supabase project with connection details in .env file
 */

const fs = require("fs").promises;
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Load environment variables
require("dotenv").config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: Missing Supabase environment variables.");
  console.error(
    "Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file."
  );
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Migration files in order
const migrationFiles = [
  "../database/migrations/01_schema.sql",
  "../database/migrations/02_stored_procedures.sql",
];

// Optional seed data
const seedFile = "../database/migrations/03_seed_data.sql";

/**
 * Reads SQL from a file
 */
async function readSqlFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return await fs.readFile(fullPath, "utf8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Executes SQL query on Supabase
 */
async function executeSql(sql) {
  try {
    // Use the Supabase rpc function to execute raw SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error executing SQL:", error);
    throw error;
  }
}

/**
 * Main function to run migrations
 */
async function runMigrations() {
  try {
    console.log("🚀 Starting database setup...");

    // Execute schema and stored procedures
    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);
      const sql = await readSqlFile(file);
      await executeSql(sql);
      console.log(`✅ Successfully executed ${file}`);
    }

    // Ask if the user wants to run the seed data script
    rl.question(
      "Do you want to run the seed data script? (DEVELOPMENT ONLY) [y/N]: ",
      async (answer) => {
        if (answer.toLowerCase() === "y") {
          try {
            console.log("🌱 Adding seed data...");

            // Prompt for the test user ID to replace in the seed script
            rl.question("Enter your test auth user ID: ", async (userId) => {
              let seedSql = await readSqlFile(seedFile);

              // Replace the placeholder with the actual user ID
              seedSql = seedSql.replace(/YOUR_TEST_AUTH_USER_ID/g, userId);

              await executeSql(seedSql);
              console.log("✅ Successfully added seed data");
              rl.close();
            });
          } catch (error) {
            console.error("❌ Error adding seed data:", error);
            rl.close();
          }
        } else {
          console.log("Skipping seed data");
          rl.close();
        }
      }
    );

    console.log("✨ Database setup complete!");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    rl.close();
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
