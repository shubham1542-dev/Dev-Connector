const express = require("express");
const connectDB = require("./config/db");
const app = express();

connectDB();

//INIT Middleware
app.use(express.json({ extended: false }));

// Routes
app.use("/api/user", require("./routes/api/users"));

app.use("/api/post", require("./routes/api/posts"));

app.use("/api/auth", require("./routes/api/auth"));

app.use("/api/profile", require("./routes/api/profile"));

// app.get("/*", (req, res) => {
//   res.send("Invalid Route");
// });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server Started on PORT : ${PORT}`));
