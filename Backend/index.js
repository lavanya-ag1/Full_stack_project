const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const userRouter = require("./routes/userRouter");
const urlRouter = require("./routes/urlRouter");

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND
      ? process.env.FRONTEND.replace(/\/$/, "")
      : "http://localhost:5173",
    credentials: true, // Allow cookies to be sent from frontend
  })
);
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/user", userRouter);
app.use("/api/url", urlRouter);

// Test route
app.get("/", (req, res) => {
  res.send("URL Shortener API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
