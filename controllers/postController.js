const path = require("path");
const fs = require("fs");
const Post = require("../models/Post");

// Render create form
exports.renderCreate = (req, res) => {
  res.render("posts/create.ejs", {
    user: req.user,
    error: req.flash("error"),
    success: req.flash("success"),
  });
};

// Create post
exports.create = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content) {
      req.flash("error", "Title and content are required");
      return res.redirect("/posts/new");
    }
    const images = (req.files || []).map((f) => `/uploads/posts/${f.filename}`);
    const tagList = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const post = new Post({
      title,
      content,
      category: category || "general",
      tags: tagList,
      images,
      author: req.user._id,
    });
    await post.save();
    req.flash("success", "Post created");
    return res.redirect(`/posts/${post._id}`);
  } catch (e) {
    console.error(e);
    req.flash("error", e.message || "Failed to create post");
    return res.redirect("/posts/new");
  }
};

// List posts with filters and search
exports.list = async (req, res) => {
  const { q, tag, category } = req.query;
  const criteria = {};
  if (q)
    criteria.$or = [
      { title: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } },
    ];
  if (tag) criteria.tags = tag;
  if (category) criteria.category = category;
  const posts = await Post.find(criteria)
    .sort({ createdAt: -1 })
    .populate("author", "name email");
  res.render("posts/list.ejs", { user: req.user, posts, query: req.query });
};

// Show single post
exports.show = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email profilePicture")
      .populate("comments.user", "name email profilePicture")
      .populate("likes.user", "name")
      .lean();

    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    // Increment view count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Sort comments by newest first
    if (post.comments) {
      post.comments.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Related posts: same category or overlapping tags, exclude current
    const tagCriteria =
      post.tags && post.tags.length ? { tags: { $in: post.tags } } : {};
    const related = await Post.find({
      _id: { $ne: post._id },
      $or: [{ category: post.category }, tagCriteria],
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("title images createdAt author category tags")
      .populate("author", "name")
      .lean();

    return res.render("posts/show.ejs", { user: req.user, post, related });
  } catch (error) {
    console.error("Error showing post:", error);
    req.flash("error", "Error loading post");
    return res.redirect("/posts");
  }
};

// Render edit form
exports.renderEdit = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    req.flash("error", "Post not found");
    return res.redirect("/posts");
  }
  if (String(post.author) !== String(req.user._id)) {
    req.flash("error", "Not authorized");
    return res.redirect(`/posts/${post._id}`);
  }
  return res.render("posts/edit.ejs", { user: req.user, post });
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      req.flash("error", "Comment text is required");
      return res.redirect(`/posts/${req.params.id}#comments`);
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();
    req.flash("success", "Comment added successfully");
    return res.redirect(`/posts/${post._id}#comments`);
  } catch (error) {
    console.error("Error adding comment:", error);
    req.flash("error", "Failed to add comment");
    return res.redirect(`/posts/${req.params.id}#comments`);
  }
};

// Delete post
exports.remove = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new Error("Post not found");
    if (String(post.author) !== String(req.user._id))
      throw new Error("Not authorized");
    // Delete associated image files from disk
    (post.images || []).forEach((imgUrl) => {
      try {
        const relative = imgUrl.replace(/^\//, "");
        const filePath = path.join(process.cwd(), relative);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn("Failed to delete file:", imgUrl, err.message);
      }
    });
    await post.deleteOne();
    req.flash("success", "Post deleted");
    return res.redirect("/posts");
  } catch (e) {
    req.flash("error", e.message || "Failed to delete");
    return res.redirect("/posts");
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      req.flash("error", "Comment not found");
      return res.redirect(`/posts/${post._id}`);
    }

    if (String(comment.user) !== String(req.user._id)) {
      req.flash("error", "Not authorized");
      return res.redirect(`/posts/${post._id}`);
    }

    comment.remove();
    await post.save();

    req.flash("success", "Comment deleted successfully");
    return res.redirect(`/posts/${post._id}`);
  } catch (error) {
    console.error("Error deleting comment:", error);
    req.flash("error", "Failed to delete comment");
    return res.redirect(`/posts/${req.params.id}`);
  }
};

// Update post
exports.update = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new Error("Post not found");
    if (String(post.author) !== String(req.user._id))
      throw new Error("Not authorized");
    const { title, content, category, tags, removeImages } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (typeof tags !== "undefined")
      post.tags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    const newImages = (req.files || []).map(
      (f) => `/uploads/posts/${f.filename}`
    );
    if (newImages.length) post.images.push(...newImages);
    if (removeImages) {
      const toRemove = Array.isArray(removeImages)
        ? removeImages
        : [removeImages];
      // Remove from post document
      post.images = post.images.filter((img) => !toRemove.includes(img));
      // Delete files from disk
      toRemove.forEach((imgUrl) => {
        try {
          // imgUrl example: /uploads/posts/filename.jpg
          const relative = imgUrl.replace(/^\//, "");
          const filePath = path.join(process.cwd(), relative);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.warn("Failed to delete file:", imgUrl, err.message);
        }
      });
    }
    await post.save();
    req.flash("success", "Post updated");
    return res.redirect(`/posts/${post._id}`);
  } catch (e) {
    console.error(e);
    req.flash("error", e.message || "Failed to update post");
    return res.redirect("/posts");
  }
};

// Delete post
exports.remove = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new Error("Post not found");
    if (String(post.author) !== String(req.user._id))
      throw new Error("Not authorized");
    // Delete associated image files from disk
    (post.images || []).forEach((imgUrl) => {
      try {
        const relative = imgUrl.replace(/^\//, "");
        const filePath = path.join(process.cwd(), relative);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn("Failed to delete file:", imgUrl, err.message);
      }
    });
    await post.deleteOne();
    req.flash("success", "Post deleted");
    return res.redirect("/posts");
  } catch (e) {
    req.flash("error", e.message || "Failed to delete");
    return res.redirect("/posts");
  }
};

// Like / Unlike toggle
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }

    const idx = post.likes.findIndex(
      (like) => String(like.user) === String(req.user._id)
    );

    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push({ user: req.user._id });
    }

    await post.save();
    return res.redirect(`/posts/${post._id}#post-content`);
  } catch (error) {
    console.error('Error toggling like:', error);
    req.flash('error', 'Failed to update like');
    return res.redirect(`/posts/${req.params.id}`);
  }
};

// Record share
exports.recordShare = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }

    post.shares.push({ user: req.user._id });
    await post.save();
    return res.redirect(`/posts/${post._id}#post-content`);
  } catch (error) {
    console.error('Error recording share:', error);
    req.flash('error', 'Failed to share post');
    return res.redirect(`/posts/${req.params.id}`);
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      req.flash('error', 'Comment text is required');
      return res.redirect(`/posts/${req.params.id}#comments`);
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();
    req.flash('success', 'Comment added successfully');
    return res.redirect(`/posts/${post._id}#comments`);
  } catch (error) {
    console.error('Error adding comment:', error);
    req.flash('error', 'Failed to add comment');
    return res.redirect(`/posts/${req.params.id}#comments`);
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const post = await Post.findById(req.params.id);

    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }

    const commentIndex = post.comments.findIndex(
      (comment) => String(comment._id) === commentId
    );

    if (commentIndex === -1) {
      req.flash('error', 'Comment not found');
      return res.redirect(`/posts/${post._id}#comments`);
    }

    // Check if user is authorized to delete the comment
    const comment = post.comments[commentIndex];
    if (String(comment.user) !== String(req.user._id)) {
      req.flash('error', 'Not authorized to delete this comment');
      return res.redirect(`/posts/${post._id}#comments`);
    }

    post.comments.splice(commentIndex, 1);
    await post.save();
    req.flash('success', 'Comment deleted successfully');
    return res.redirect(`/posts/${post._id}#comments`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    req.flash('error', 'Failed to delete comment');
    return res.redirect(`/posts/${req.params.id}#comments`);
  }
};

// Edit comment
exports.editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      req.flash('error', 'Comment text is required');
      return res.redirect(`/posts/${req.params.id}#comments`);
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Post not found');
      return res.redirect('/posts');
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      req.flash('error', 'Comment not found');
      return res.redirect(`/posts/${post._id}#comments`);
    }

    if (String(comment.user) !== String(req.user._id)) {
      req.flash('error', 'Not authorized to edit this comment');
      return res.redirect(`/posts/${post._id}#comments`);
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await post.save();
    
    req.flash('success', 'Comment updated successfully');
    return res.redirect(`/posts/${post._id}#comments`);
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ ok: false, message: "Failed to edit comment" });
  }
};
