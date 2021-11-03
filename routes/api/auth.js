const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/auth");

const User = require("../../models/User");

// @router  Get api/auth
// @Desc    Authenticate user
// @access  Public

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      user: user,
    });
  } catch (error) {
    console.log(eror.message);
    res.status(401).send("Server Error");
  }
});

// @router  Post api/auth
// @Desc    Authenticate user
// @access  Public
router.post(
  "/",
  [
    check("email", "Please include a Valid Email").isEmail(),
    check("password", "Password is Required ! ").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        msg: errors.array(),
      });
    }

    // Main Login

    const { email, password } = req.body;
    try {
      //! See if the user Exist

      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          //msg: "User Already Exist !",
          errors: [{ msg: "Invalid Credential " }],
        });
      }

      //   *Password Matching

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.status(401).json({
          errors: [{ msg: "Invalid Credential " }],
        });
      }

      //! Return jsonwebtoken

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 3600000,
        },
        (err, token) => {
          if (err) throw err;
          return res.json({
            msg: "User loggedIn ! ",
            StatusCode: 200,
            user: user,
            token: token,
          });
        }
      );
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ msg: "Server Error ! " });
    }
  }
);

module.exports = router;
