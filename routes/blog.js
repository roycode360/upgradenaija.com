// jshint esversion: 8
const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

// get all blog posts
router.get("/", async (req, res) => {
  const blog = await Blog.find().sort({ createdAt: "desc" });
  res.render("blog", { blog: blog });
});

// create new blog post view
router.get("/new", (req, res) => {
  res.render("new", { blog: new Blog() });
});

// post request to  /blog
router.post(
  "/",
  async (req, res, next) => {
    req.blog = new Blog();
    next();
  },
  saveBlogAndRedirect("new")
);

// get blog posts by id
router.get("/:slug", async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug });
  if (blog == null) res.redirect("/blog");
  res.render("singleblog", { blog: blog });
});

// get edits
router.get("/edit/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.render("edit", { blog: blog });
});

// edit blog
router.put(
  "/:id",
  async (req, res, next) => {
    req.blog = await Blog.findById(req.params.id);
    next();
  },
  saveBlogAndRedirect("edit")
);

//delete blogs
router.delete("/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/blog");
});

function saveBlogAndRedirect(path) {
  return async (req, res) => {
    let blog = req.blog;
    blog.title = req.body.title;
    blog.image = req.body.image;
    blog.description = req.body.description;
    blog.markdown = req.body.markdown;
    try {
      blog = await blog.save();
      res.redirect(`/blog/${blog.slug}`);
    } catch (e) {
      console.log(e);
      res.render(`blog/${path}`, { blog: blog });
    }
  };
}
module.exports = router;
