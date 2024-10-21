import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Function to connect to the SQLite database
const connectDB = async () => {
  return await open({
    filename: './mydatabase.db',
    driver: sqlite3.Database
  });
};

// Function to execute SQL queries
export const executeQuery = async (query, params = []) => {
  const db = await connectDB();
  try {
    const result = await db.run(query, params); // For INSERT, UPDATE, DELETE
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  } finally {
    await db.close();
  }
};

// Function to fetch data (e.g., SELECT queries)
export const fetchQuery = async (query, params = []) => {
  const db = await connectDB();
  try {
    const rows = await db.all(query, params); // Fetch all rows for SELECT
    return rows;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  } finally {
    await db.close();
  }
};
