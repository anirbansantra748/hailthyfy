const VideoCall = require('../models/VideoCall');
const User = require('../models/User');
const Chat = require('../models/Chat');

// Create a new video call request
exports.createVideoCall = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log('\n=== 🎥 CREATING VIDEO CALL ===');
    console.log('Chat ID:', chatId);
    console.log('Initiator:', req.user._id);
    
    // Find the chat to get participants
    const chat = await Chat.findById(chatId).populate('participants');
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    // Check if user is part of this chat
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not authorized to create a video call in this chat' });
    }
    
    // Generate a simple 6-digit meeting ID
    const meetingId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Create a new video call
    const videoCall = new VideoCall({
      chat: chatId,
      initiator: req.user._id,
      participants: chat.participants.map(p => p._id),
      status: 'active',
      meetingId: meetingId
    });
    
    await videoCall.save();
    
    console.log('Video call created:', videoCall._id);
    console.log('Meeting ID:', meetingId);
    
    // Automatically send meeting ID to chat as a system message
    const otherParticipant = chat.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );
    
    const systemMessage = {
      sender: req.user._id,
      senderModel: req.user.isDoctor ? "Doctor" : "User",
      receiver: otherParticipant._id,
      receiverModel: req.user.isDoctor ? "User" : "Doctor",
      content: `📹 Video call started! Meeting ID: ${meetingId}`,
      type: "video_call_request",
      videoCallId: videoCall._id,
      meetingId: meetingId
    };
    
    chat.messages.push(systemMessage);
    await chat.save();
    
    console.log('Meeting ID sent to chat as system message');
    
    // Check if this is a form submission or AJAX
    const isFormSubmission = req.headers['content-type'] && 
      req.headers['content-type'].includes('application/x-www-form-urlencoded');
    
    if (isFormSubmission) {
      // Redirect to the video call page
      return res.redirect(`/video-calls/${videoCall._id}`);
    } else {
      // Return JSON response
      return res.status(200).json({ 
        success: true, 
        callId: videoCall._id,
        meetingId: meetingId,
        message: 'Video call created and meeting ID sent to chat'
      });
    }
    
  } catch (error) {
    console.error('Error creating video call:', error);
    return res.status(500).json({ success: false, message: 'Failed to create video call' });
  }
};

// Join video call by meeting ID
exports.joinByMeetingId = async (req, res) => {
  try {
    const { meetingId } = req.body;
    
    console.log('\n=== 🎆 JOINING BY MEETING ID ===');
    console.log('Meeting ID:', meetingId);
    console.log('User:', req.user._id);
    
    if (!meetingId || meetingId.trim() === '') {
      req.flash('error', 'Please enter a valid meeting ID');
      return res.redirect('/chat');
    }
    
    // Find video call by meeting ID
    const videoCall = await VideoCall.findOne({ 
      meetingId: meetingId.trim().toUpperCase() 
    })
      .populate('initiator')
      .populate('participants')
      .populate('chat');
    
    if (!videoCall) {
      req.flash('error', 'Invalid meeting ID. Please check and try again.');
      return res.redirect('/chat');
    }
    
    // Check if call is still active
    if (videoCall.status !== 'active') {
      req.flash('error', 'This video call has ended.');
      return res.redirect('/chat');
    }
    
    // Check if user is authorized (participant in the chat)
    if (!videoCall.participants.some(p => p._id.toString() === req.user._id.toString())) {
      req.flash('error', 'You are not authorized to join this video call');
      return res.redirect('/chat');
    }
    
    console.log('Meeting ID found, redirecting to call:', videoCall._id);
    
    // Redirect to the video call page
    return res.redirect(`/video-calls/${videoCall._id}`);
    
  } catch (error) {
    console.error('Error joining by meeting ID:', error);
    req.flash('error', 'Failed to join video call. Please try again.');
    res.redirect('/chat');
  }
};

// Join a video call
exports.joinVideoCall = async (req, res) => {
  try {
    const { callId } = req.params;
    
    const videoCall = await VideoCall.findById(callId)
      .populate('initiator')
      .populate('participants')
      .populate('chat');
    
    if (!videoCall) {
      req.flash('error', 'Video call not found');
      return res.redirect('/chat');
    }
    
    // Check if user is part of this call
    if (!videoCall.participants.some(p => p._id.toString() === req.user._id.toString())) {
      req.flash('error', 'You are not authorized to join this video call');
      return res.redirect('/chat');
    }
    
    // Update call status if joining
    if (videoCall.status === 'pending' && videoCall.initiator._id.toString() !== req.user._id.toString()) {
      videoCall.status = 'active';
      videoCall.joinedAt = Date.now();
      await videoCall.save();
    }
    
    // Find the other participant
    const otherParticipant = videoCall.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );
    
    res.render('video/call', { 
      title: 'Video Call', 
      call: videoCall,
      chat: videoCall.chat,
      otherParticipant: otherParticipant || { name: 'Unknown User' },
      user: req.user
    });
  } catch (error) {
    console.error('Error joining video call:', error);
    req.flash('error', 'Failed to join video call');
    res.redirect('/chat');
  }
};

// End a video call
exports.endVideoCall = async (req, res) => {
  try {
    const { callId } = req.params;
    
    const videoCall = await VideoCall.findById(callId);
    
    if (!videoCall) {
      return res.status(404).json({ success: false, message: 'Video call not found' });
    }
    
    // Check if user is part of this call
    if (!videoCall.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not authorized to end this video call' });
    }
    
    videoCall.status = 'ended';
    videoCall.endedAt = Date.now();
    await videoCall.save();
    
    return res.status(200).json({ success: true, message: 'Call ended successfully', chatId: videoCall.chat });
  } catch (error) {
    console.error('Error ending video call:', error);
    return res.status(500).json({ success: false, message: 'Failed to end video call' });
  }
};

// Get active video calls for a user
exports.getUserVideoCalls = async (req, res) => {
  try {
    const calls = await VideoCall.find({
      participants: req.user._id
    })
      .populate('initiator')
      .populate('participants')
      .populate('chat')
      .sort({ createdAt: -1 });
    
    res.render('video/list', { 
      title: 'My Video Calls', 
      calls,
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching video calls:', error);
    req.flash('error', 'Failed to load video calls');
    res.redirect('/chat');
  }
};