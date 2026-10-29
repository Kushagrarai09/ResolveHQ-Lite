require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const port = process.env.PORT || 5001;
async function start() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET is missing or too short. Set at least 32 characters in .env / hosting environment.");
    await connectDB();
    app.listen(port, "0.0.0.0", () => console.log(`ResolveHQ Lite API listening on port ${port}`));
  } catch (error) { console.error("Failed to start server:", error.message); process.exit(1); }
}
start();
