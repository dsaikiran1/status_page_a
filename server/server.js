import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http"; // <-- Required to create HTTP server
import { Server as SocketIO } from "socket.io"; // <-- Socket.IO import

// Import your routes
import authRoutes from "./routes/auth.js";
import organizationRoutes from "./routes/organizations.js";
import serviceRoutes from "./routes/services.js";
import incidentRoutes from "./routes/incidents.js";
import publicRoutes from "./routes/public.js";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app); // <-- Create server with Express app

// Setup Socket.IO and attach to HTTP server
const io = new SocketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://67fb6c6ce4f132a19b6d7cc2--statuspagee.netlify.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach io to app so it can be accessed in routes via req.app.get('io')
app.set("io", io);

// Middleware
const allowedOrigins = [
  "https://67fb6c6ce4f132a19b6d7cc2--statuspagee.netlify.app",
  "http://localhost:5173"  // your Vercel frontend domain
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// Connect to MongoDB
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// API Routes (attach only after setting io)
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/public", publicRoutes);


// Serve static files in production
//if (process.env.NODE_ENV === "production") {
  //const clientDistPath = path.join(__dirname, "../client/dist");
  //app.use(express.static(clientDistPath));

  //app.get("/{*splat}", (req, res) => {
    //res.sendFile(path.join(clientDistPath, "index.html"));
  //});
//}


// Default route
app.get("/", (req, res) => {
  res.send("Status Monitor API is running");
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
