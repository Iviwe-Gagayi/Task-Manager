require("dotenv").config();
const Task = require("./models/Task");
const express = require("express")
const mongoose = require("mongoose");
const User = require("./models/User");
const { hashPassword } = require("./utils/auth");

const app = express();

//Middleware
app.use(express.json());

//testing saving of  a task
app.post("/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);   // Get data from request body
    await task.save();                 // Save to MongoDB
    res.status(201).json(task);        // Return saved task
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();   // Fetch all tasks from MongoDB
    res.json(tasks);                   // Send them back as JSON
  } catch (err) {
    res.status(500).json({ error: err.message }); // Error handler
  }
});


//Get task by ID
app.get("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id); // Find task by Mongo _id
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);  // Send back the task
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Delete task
app.delete("/tasks/:id", async (req,res) => {
  try{
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task){
    return res.status(404).json({ error: "Task not found" });
  }
  res.json({ message: "Task deleted successfully" });
  }catch(err){
  res.status(500).json({ error: err.message });
  }
});

//Patch
app.patch("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//User registration

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // hash the password
    const passwordHash = await hashPassword(password);

    // create user
    const user = new User({ email, passwordHash });
    await user.save();

    res.status(201).json(user); // thanks to our toJSON transform, passwordHash won't show
  } catch (err) {
    if (err.code === 11000) { // duplicate email
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message });
  }
});


// Connecting to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

//starting server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));



