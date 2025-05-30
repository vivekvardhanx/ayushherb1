import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "ayushherb1",
    clientEmail: "firebase-adminsdk-fbsvc@ayushherb1.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDKtufT8AGX7V48\n8TfQv2hBUpSP7rYfAshzWPXhhharn9ygazqpFBdXQ3mDQE62/t8b6nJyp7XQ77OR\nBYyIChC0RdDvUwYhK/QZYTDXzOdTlBArA/pXJn4i9EyqcMZwowp2Tzlz5m08sdNB\n2lvu1HBGKnLrLHmanoUyopELTh5j+lD1zGz9jdwzkdwLRpRlVUH7ezbxYLUIYu0T\ng7m1hvyxFjarckHXsWq4uogjVU0pqo8eA8DTPdiE5rIeRVrk4qeJfY+2ps1JM5ng\nuCiDEt5qY5F3eX6JE2+5R7fcMkbUtE06QdHzQJxGuooeM7LsVsbIQeFqZmTFBWVw\n8g1vnrzBAgMBAAECggEACz2NKVFbpUMCQLrXb3nNnCGqHzkLXDjZSJwcNj8rLqUU\npMiNXibBDJOvPznno3oKgQ/E/NqT2FwSRu5Z1olIV9avOTYPVvOK+4VKIg04nofN\nRbVYwlBeGi4VujW6qzA/OkQ2WVjjocPyhOpIwruA5kMgUC4NKCe2FxKwnEHeqYh0\nYt/s1g6reTafsjs+EovKT0gT5H/1Oji569kEe4xj89G5429TauMu4uMwTQL/197f\nQj+1etvJEaXeUn6wkvOyABPnWwVBqr7kFa60nf3JQ8HGF0RyLvJ5htK7gAoPC+m3\nsI3F8cg5xJGMG3bsR3GHrM0/FQsnJ+uJCQN5Qs27YQKBgQD8jDbmk42vXzWVzXMJ\nMIo29WCtLBbibBLnY/aDuatG/CguDbeD3hXICmLa8FXld+JttqDMmmZKqHljrVGE\nkKTwvqwjQM/Tjy78BcuQCSLGX1Sv1sB5l7afqaGExZw0V/R67P5UaqpS7Qg6sA9x\nFhIG1kquZR2Diz9jhYMnHmmu5QKBgQDNfEz8e4GL8IgrIUzUfBgM67rKQiD7vQCw\nsAyNuCs1MujXXPmFCjDbCF3u1y+HnZV4iWoEhoZn3DhVUb6BQXvHtxmZnxPu4LlS\ncBKdf9OvrLp/fnLAy0aEu8zsBkYcNffIj6lR43M8eSnhLobmO00f3nUqH8F4C4Mo\nWCpoMyCcrQKBgDYmSk8+LA8CNxcbqiK6SahnDIeVAIMj8Rm0EVNFKDhcMLFPN54K\nrFjsAS44gfJltiMYGXpFUNGJNh3tN6FY8kS8XWRhrS4LcWOQSoljrBUks5/QSAzK\nPtoVIRC63jdK9Jy23AF1rXeCY1VSEr2IoezdXb3u6FkgLkNEiU6F8tsRAoGBAL4S\nZXACmlEkfABRPC0sYF7LSiu+wZ26NUI6hlIs8iKyZbiYcuICDDD+60x7Vaa/ODyX\n9y4adYbqqF0bUPlk5idVkeOMxzZmPmYn7sArNldAkf5Oq7z0CtXKlYIZR47eyMWH\nRZrOppBgj0GQ9Q1P+0YoUv5VA3OUSozuCMP7zwW9AoGAXUgi3/rXegdjAzvln+cr\nyXrOfAQLe9I6LrjMUd3B5v+Osz8HXccXqINCwNsgZx2en1cudhNP1qZUh8MRY0Ch\n7VMABO7v+jh8PNwQbcA+g9CyE34rLtgkwJKt8dZeF7MHjieYK9r7tgfu5TCiT1uI\njdCSpvohcNlPOK54M9omJDI=\n-----END PRIVATE KEY-----\n"
  }),
  databaseURL: "https://ayushherb1-default-rtdb.firebaseio.com"
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("MONGO_URI environment variable not found. Please set it in your Render environment.");
  process.exit(1); // Exit the process to prevent further errors
}

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 
// Home route: Increment visit count each time the API is accessed
app.get("/", async (req, res) => {
  try {
    const visitRef = admin.firestore().collection("stats").doc("visitCount");
    const visitDoc = await visitRef.get();

    if (!visitDoc.exists) {
      await visitRef.set({ count: 1 });
    } else {
      await visitRef.update({ count: admin.firestore.FieldValue.increment(1) });
    }

    res.send("API of the Virtual Herbal Garden");
  } catch (error) {
    console.error("Error incrementing visit count:", error);
    res.status(500).json({ error: "Failed to increment visit count" });
  }
});

// Fetch visit count
app.get("/api/visit-count", async (req, res) => {
  try {
    const visitRef = admin.firestore().collection("stats").doc("visitCount");
    const visitDoc = await visitRef.get();

    res.status(200).json({ visitCount: visitDoc.exists ? visitDoc.data().count : 0 });
  } catch (error) {
    console.error("Error fetching visit count:", error);
    res.status(500).json({ error: "Failed to fetch visit count" });
  }
});


// API endpoint to fetch users
app.get("/api/users", async (req, res) => {
  try {
    const listUsers = await admin.auth().listUsers();
    const users = listUsers.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Anonymous",
    }));
    res.status(200).json({ totalUsers: users.length, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Define a simple test schema and model
const TestSchema = new mongoose.Schema({ message: String });
const TestModel = mongoose.models.Test || mongoose.model("Test", TestSchema);

// Add this route to test MongoDB
app.get("/api/mongo-test", async (req, res) => {
  try {
    // Create a test document
    const testDoc = new TestModel({ message: "MongoDB is working!" });
    await testDoc.save();

    // Fetch all test documents
    const docs = await TestModel.find();
    res.json({ success: true, docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
