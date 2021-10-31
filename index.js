const express = require("express");
const app = express();

app.get("/test", (req, res) => {
  res.send("Hi");
});

app.post("/Add Data", (req, res) => {});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server Started on PORT : ${PORT}`));
