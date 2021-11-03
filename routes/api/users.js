const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

const User = require("../../models/User");

// @router  Get api/user
// @Desc    Register uset
// @access  Public

router.post(
  "/",
  [
    check("name", "Name is Required").not().isEmpty(),
    check("email", "Please include a Valid Email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more character"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        msg: errors.array(),
      });
    }

    // Main Login

    const { name, email, password } = req.body;
    try {
      //! See if the user Exist

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          //msg: "User Already Exist !",
          errors: [{ msg: "User Already Exists ! " }],
        });
      }

      //! Get Users Gravatar

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      //!Creating new user form schema and save to database
      user = await new User({
        name,
        email,
        avatar,
        password,
      });
      //! Encrypt Pasword

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();
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
          expiresIn: 36000000,
        },
        (err, token) => {
          if (err) throw err;
          return res.json({
            StatusCode: 200,
            user: user,
            token: token,
            msg: "User Registerd ! ",
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
