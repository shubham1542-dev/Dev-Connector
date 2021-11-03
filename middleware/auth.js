const jwt = require("jsonwebtoken");
const config = require("config");

// next =>
module.exports = (req, res, next) => {
  //* Get Token from the Header
  const token = req.header("x-api-key");

  //* check if not token

  if (!token) {
    return res.status(401).json({
      msg: "No Token, Access Denied ! ",
    });
  }

  // Verify Token

  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401);
    console.log(error.message);
  }
};
