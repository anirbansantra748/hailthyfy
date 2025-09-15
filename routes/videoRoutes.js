const express = require("express");
const router = express.Router();
const videoController = require('../controllers/videoController');
const { isLoggedIn } = require('../middleware/isLoggedIn');

// Video call routes
router.get('/', isLoggedIn, videoController.getUserVideoCalls);
router.post('/create/:chatId', isLoggedIn, videoController.createVideoCall);
router.post('/join', isLoggedIn, videoController.joinByMeetingId);
router.get('/:callId', isLoggedIn, videoController.joinVideoCall);
router.post('/:callId/end', isLoggedIn, videoController.endVideoCall);

module.exports = router;