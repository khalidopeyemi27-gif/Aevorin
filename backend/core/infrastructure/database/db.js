const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * DatabaseManager class.
 * Wraps PostgreSQL connections to provide the same interface (all, get, run)
 * as the original SQLite manager to avoid rewriting repository logic.
 */
class DatabaseManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.pool = null;
    this.activeProject = null;
  }

  /**
   * Initializes PostgreSQL pool connection
   */
  async openProjectDatabase(projectId = "default") {
    if (this.pool) {
      return this.pool;
    }

    try {
      console.log(`[DatabaseManager] Connecting to PostgreSQL on Supabase...`);
      const connectionString = process.env.SUPABASE_DB_URL;
      if (!connectionString) {
        throw new Error("Missing SUPABASE_DB_URL in environment variables.");
      }

      this.pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase
      });

      // Test connection
      await this.pool.query("SELECT 1;");
      this.activeProject = projectId;
      
      console.log(`[DatabaseManager] Successfully connected to PostgreSQL.`);
      return this.pool;
    } catch (error) {
      console.error(`[DatabaseManager] Failed to connect to PostgreSQL:`, error);
      throw error;
    }
  }

  /**
   * Closes active database connection pool.
   */
  async closeDatabase() {
    if (!this.pool) return;
    console.log(`[DatabaseManager] Closing PostgreSQL pool...`);
    try {
      await this.pool.end();
    } catch (error) {
      console.error("[DatabaseManager] Error closing pool:", error);
    } finally {
      this.pool = null;
    }
  }

  /**
   * Returns true if a database connection is currently open.
   */
  isConnected() {
    return this.pool !== null;
  }

  /**
   * Helper to translate SQLite query parameters (?) to PostgreSQL ($1, $2, ...)
   */
  translateSql(sql) {
    let index = 1;
    // Replace all '?' not inside quotes. (Basic regex, works for standard queries)
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * Executes database select returning list array.
   */
  async all(sql, params = []) {
    if (!this.pool) throw new Error("No active database connection");
    try {
      const pgSql = this.translateSql(sql);
      const res = await this.pool.query(pgSql, params);
      return res.rows;
    } catch (error) {
      console.error(`[DatabaseManager] all() query failed: ${sql}\nTranslated: ${this.translateSql(sql)}`, error);
      throw error;
    }
  }

  /**
   * Executes database select returning single row.
   */
  async get(sql, params = []) {
    if (!this.pool) throw new Error("No active database connection");
    try {
      const pgSql = this.translateSql(sql);
      const res = await this.pool.query(pgSql, params);
      return res.rows[0] || null;
    } catch (error) {
      console.error(`[DatabaseManager] get() query failed: ${sql}\nTranslated: ${this.translateSql(sql)}`, error);
      throw error;
    }
  }

  /**
   * Executes database insert, update or delete.
   * Returns { lastID, changes } for SQLite compatibility.
   */
  async run(sql, params = []) {
    if (!this.pool) throw new Error("No active database connection");
    try {
      const pgSql = this.translateSql(sql);
      
      // If it's an INSERT, we often want the returning ID for SQLite compatibility
      // But standard SQLite `lastInsertRowid` won't work perfectly unless we inject RETURNING id.
      // However, AEVORIN uses UUIDs for `id` which are generated in JS, so lastInsertRowId is rarely used for auto-increments.
      const res = await this.pool.query(pgSql, params);
      
      return {
        lastID: null, // We use client-side UUIDs
        changes: res.rowCount
      };
    } catch (error) {
      console.error(`[DatabaseManager] run() statement failed: ${sql}\nTranslated: ${this.translateSql(sql)}`, error);
      throw error;
    }
  }
}

module.exports = DatabaseManager;
