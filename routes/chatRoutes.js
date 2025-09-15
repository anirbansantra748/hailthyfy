const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { isLoggedIn } = require("../middleware/authMiddleware");

// Get user's chats
router.get("/", isLoggedIn, chatController.getUserChats);

// Get specific chat
router.get("/:chatId", isLoggedIn, chatController.getChat);

// Send message
router.post("/:chatId/messages", isLoggedIn, chatController.sendMessage);

// Mark message as read
router.put(
  "/:chatId/messages/:messageId/read",
  isLoggedIn,
  chatController.markAsRead
);

// Get unread message count
router.get("/unread/count", isLoggedIn, chatController.getUnreadCount);

// Test endpoint for debugging
router.post("/test", (req, res) => {
  console.log('\n=== TEST ENDPOINT HIT ===');
  console.log('Body:', req.body);
  console.log('User authenticated:', !!req.user);
  res.json({ success: true, message: 'Test endpoint working', user: !!req.user });
});

// Direct chat start (no request needed)
router.get("/start/:doctorId", isLoggedIn, chatController.startDirectChat);

module.exports = router;
