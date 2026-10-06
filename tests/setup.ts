// Test-wide environment (vitest sets NODE_ENV=test itself). Real values are never needed: the DB is in-memory and
// the analyzer/storage are mocked in integration tests.
process.env.TURSO_DATABASE_URL = ":memory:";
process.env.TURSO_AUTH_TOKEN = "";
process.env.JWT_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
process.env.BLOB_STORE_ID = "";
process.env.GEMINI_API_KEY = "";
