const express = require("express")
const app = express();

//Middleware
app.use(express.json());

//Test route
app.get("/",(req,res) => {

res.send("Hello World");

});

//starting server
const PORT = process.env.port || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
