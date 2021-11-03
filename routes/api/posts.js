const express = require("express");
const router = express.Router();

const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const config = require("config");

// Post Route
// @Desc : Create post

router.post(
  "/",
  [auth, [check("text", "text is Required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json({
        msg: "Post Added !",
        post: post,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

//Get Route
// Get All Post

router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({
      date: -1,
    });

    res.json(posts);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// Get POST By Id

router.get("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({
        msg: "Post not Found !",
      });
    }

    res.json(post);
  } catch (error) {
    console.log(error.message);
    if (error.kind === "objectId") {
      return res.status(404).json({
        msg: "Post not Found !",
      });
    }
    res.status(500).send("Server Error");
  }
});

// Delete Route
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: "Post not Found !",
      });
    }
    //   Check on the user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: "User Not Authorized!",
      });
    }

    await post.remove();

    res.json({
      msg: "Post Removed !!",
    });
  } catch (error) {
    console.log(error.message);
    if (error.kind === "objectId") {
      return res.status(404).json({
        msg: "Post not Found !",
      });
    }
    res.status(500).send("Server Error");
  }
});

// Put Route : for likes on id

router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.json({
        msg: "Post Not Found !!",
      });
    }

    // check the post is already liked or not

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({
        msg: "POST already liked !",
      });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    return res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// Put Route : for unlikes on id

router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.json({
        msg: "Post Not Found !!",
      });
    }

    // check the post is already liked or not

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({
        msg: "POST has not yet been liked !",
      });
    }

    //   Get Remove Index
    const removeIndex = post.likes.map((like) =>
      like.user.toString().indexOf(req.user.id)
    );

    post.likes.splice(removeIndex, 1);

    await post.save();

    return res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

// Post Route
// @Desc : Create comment on post

router.post(
  "/comment/:id",
  [auth, [check("text", "text is Required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json({
        post: post.comments,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

//  dELETE Route
// @Desc : dELETE comment on post

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Pull the comment form post

    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure commet is exist

    if (!comment) {
      return res.status(404).json({
        msg: "Commnet does not exist",
      });
    }

    // Check user

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: "User Not Authorized",
      });
    }

    //   Get Remove Index
    const removeIndex = post.comments.map((comment) =>
      comment.user.toString().indexOf(req.user.id)
    );

    post.comments.splice(removeIndex, 1);

    await post.save();

    return res.json(post.comments);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
