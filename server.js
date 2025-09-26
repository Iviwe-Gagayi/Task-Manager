require("dotenv").config();
const Task = require("./models/Task");
const express = require("express")
const mongoose = require("mongoose");
const User = require("./models/User");
const { hashPassword, comparePassword, signAccessToken } = require("./utils/auth");
const authMiddleware = require("./middleware/auth");



const app = express();

//Middleware
app.use(express.json());

//post task
app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const task = new Task({...req.body, user: req.user.id,});   
    await task.save();                
    res.status(201).json(task);      
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//get all tasks
app.get("/tasks",authMiddleware ,async (req, res) => {
  try {
    const tasks = await Task.find({user: req.user.id,}).sort("-CreatedAt");   
    res.json(tasks);                   
  } catch (err) {
    res.status(500).json({ error: err.message }); 
  }
});


//Get task by ID
app.get("/tasks/:id", authMiddleware ,async (req, res) => {
  try {
    const task = await Task.findById({_id: req.params.id,user: req.user.id,}).sort("-CreatedAt"); 
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);  
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Delete task
app.delete("/tasks/:id",authMiddleware,  async (req,res) => {
  try{
  const task = await Task.findByIdAndDelete({ _id: req.params.id, user: req.user.id });
  if (!task){
    return res.status(404).json({ error: "Task not found" });
  }
  res.json({ message: "Task deleted successfully" });
  }catch(err){
  res.status(500).json({ error: err.message });
  }
});

//Patch
app.patch("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      {_id: req.params.id, user: req.user.id},
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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

//starting server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));



