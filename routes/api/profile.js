const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const request = require("request");
const config = require("config");

// !!! --->GET PROFILE <--- ***
// * @Route : Get Route ==> api/profile/me
// *@Desc  : Get Prfile of the user
// *@access => private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({
        msg: "No Profile for the user !",
      });
    }

    res.status(200).json({
      profile: profile,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// !!! --->Post PROFILE <--- ***
// * @Route : post Route ==> api/profile/me
// *@Desc  : create Prfile of the user
// *@access => private

router.post(
  "/",
  [
    auth,
    [
      check("status", "status is required").not().isEmpty(),
      check("skills", "skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // *Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    //   Build social object
    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // update

        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          {
            $set: profileFields,
          },
          { new: true }
        );

        return res.status(200).json({
          msg: "Profile Updated",
          profile: profile,
        });
      }

      // Create
      profile = new Profile(profileFields);

      await profile.save();
      res.status(200).json({
        msg: "Profile Added",
        profile: profile,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// !!! --->Get all PROFILE <--- ***
// * @Route : post Route ==> api/profile/me
// *@Desc  : create Prfile of the user
// *@access => public

router.get("/", async (req, res) => {
  try {
    var profile = await Profile.find().populate("user", ["name", "avatar"]);

    res.status(200).json({
      msg: "Profiles",
      profile: profile,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// !!! --->Get user PROFILE <--- ***
// * @Route : post Route ==> api/profile/user/user_id
// *@Desc  : create Prfile by user id
// *@access => public

router.get("/user/:user_id", async (req, res) => {
  try {
    var profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({
        msg: "Profile Not Found !",
      });
    }
    res.status(200).json({
      msg: "Profiles",
      profile: profile,
    });
  } catch (error) {
    console.log(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({
        msg: "Profile Not Found",
      });
    }
    res.status(500).send("Server Error");
  }
});

// !!! --->Delete user <--- ***
// * @Route : post Route ==> api/profile/user/user_id
// *@Desc  : delete Prfile user & post
// *@access => private

router.delete("/", auth, async (req, res) => {
  try {
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({
      msg: "User Deleted !!!",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error !!");
  }
});

// !!! --->add user Experience <--- ***
// * @Route : put Route ==> api/profile/experience
// *@Desc  : delete Prfile user & post
// *@access => private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is Required ").not().isEmpty(),
      check("company", "company is Required ").not().isEmpty(),
      check("from", "from date is Required ").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({
        errors: errors.array(),
      });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      // push or unshift
      profile.experience.unshift(newExp);

      await profile.save();

      res.json({
        profile: profile,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error !!!");
    }
  }
);

// !!! --->Delete Experience <--- ***
// * @Route : put Route ==> api/profile/experience/:exp_id
// *@Desc  : delete exp user & post
// *@access => private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.json({
        msg: "User Does Not Exist !!",
      });
    }
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    if (removeIndex < 0)
      return res.json({ msg: "Experience Details Not found !!" });

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json({ msg: "Experience Deleted !", profile: profile });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error !!!");
  }
});

// !!! --->add user Education <--- ***
// * @Route : put Route ==> api/profile/experience
// *@Desc  : delete Prfile user & post
// *@access => private

router.put(
  "/education",
  [
    auth,
    [
      check("school", "School name  is Required ").not().isEmpty(),
      check("degree", "degree is Required ").not().isEmpty(),
      check("fieldofstudy", "fieldofstudy is Required ").not().isEmpty(),
      check("from", "from date is Required ").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({
        errors: errors.array(),
      });
    }

    const { school, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      // push or unshift
      profile.education.unshift(newEducation);

      await profile.save();

      res.json({
        profile: profile,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error !!!");
    }
  }
);

// !!! --->Delete Education <--- ***
// * @Route : put Route ==> api/profile/experience/:exp_id
// *@Desc  : delete exp user & post
// *@access => private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.json({
        msg: "User Does Not Exist !!",
      });
    }
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    if (removeIndex < 0)
      return res.json({ msg: "Education Detail Not found !!" });

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json({ msg: "Education Detail Deleted !", profile: profile });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error !!!");
  }
});

// !!! --->get github repo <--- ***

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created: asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,

      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) console.log(error);

      if (response.statusCode !== 200)
        return res.status(404).json({ msg: "No Github profile found !" });

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error !!!");
  }
});

module.exports = router;
