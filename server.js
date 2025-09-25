require("dotenv").config();
const Task = require("./models/Task");
const express = require("express")
const mongoose = require("mongoose");

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


// Connecting to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

//starting server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));



