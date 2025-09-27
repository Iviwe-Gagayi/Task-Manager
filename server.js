require("dotenv").config();
const Task = require("./models/Task");
const express = require("express")
const mongoose = require("mongoose");
const User = require("./models/User");
const { hashPassword, comparePassword, signAccessToken } = require("./utils/auth");
const authMiddleware = require("./middleware/auth");
const { Types } = mongoose;
const isId = (id) => Types.ObjectId.isValid(id);


const app = express();


const cors = require("cors");

// allow your frontend origin
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; 

app.use(cors({
  origin: FRONTEND_URL,                
  methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false                    
}));


app.get("/health", (_req, res) => res.json({ status: "ok" }));
const helmet = require("helmet");
const morgan = require("morgan");

app.use(helmet());                     
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));               
}

//Middleware
app.use(express.json());

// CREATE (protected)
app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const task = new Task({ ...req.body, user: req.user.id });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// READ ALL (protected) – newest first
app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort("-createdAt");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE (protected & owner-only)
app.get("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid task id" });

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (protected & owner-only, partial)
app.patch("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid task id" });

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json(task);
  } catch (err) {
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE (protected & owner-only)
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid task id" });

    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//User registration

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normEmail = String(email).trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // hash the password
    const passwordHash = await hashPassword(password);

    // create user
    const user = new User({ email: normEmail, passwordHash });
    await user.save();

    res.status(201).json(user); 
  } catch (err) {
    if (err.code === 11000) { 
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message });
  }
});

//user login
app.post("/auth/login", async(req,res) => {
try{
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

     const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      
      return res.status(401).json({ error: "Invalid email or password" });
    }
     const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
     // Issue JWT
    const token = signAccessToken(user);

     res.json({
      token, 
      user: { _id: user._id, email: user.email, createdAt: user.createdAt }
    });

}catch(err){
  res.status(500).json({ error: err.message });
}
});



// Connecting to MongoDB
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
})();



