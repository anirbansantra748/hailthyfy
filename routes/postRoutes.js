const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isLoggedIn } = require("../middleware/authMiddleware");
const postController = require("../controllers/postController");

// Ensure upload directory exists
const uploadsDir = path.join("uploads", "posts");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
// Accept only images and limit file size (5MB per file)
function imageFileFilter(req, file, cb) {
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeImage = (file.mimetype || "").startsWith("image/");
  if (isMimeImage && allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, jpeg, png, gif, webp)"));
  }
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});

router.get("/", postController.list);
router.get("/new", isLoggedIn, postController.renderCreate);
router.get("/:id/edit", isLoggedIn, postController.renderEdit);
router.get("/:id", postController.show);
router.post("/", isLoggedIn, upload.array("images", 6), postController.create);
// Use method-override friendly verbs
router.delete("/:id", isLoggedIn, postController.remove);
router.put("/:id/like", isLoggedIn, postController.toggleLike);
router.put("/:id/share", isLoggedIn, postController.recordShare);
// Comments endpoints (pluralized)
router.post("/:id/comments", isLoggedIn, postController.addComment);
router.delete(
  "/:id/comments/:commentId",
  isLoggedIn,
  postController.deleteComment
);
router.put(
  "/:id/comments/:commentId",
  isLoggedIn,
  express.json(),
  postController.editComment
);
router.put(
  "/:id",
  isLoggedIn,
  upload.array("images", 6),
  postController.update
);

module.exports = router;
