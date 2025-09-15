const Chat = require("../models/Chat");
const ChatRequest = require("../models/ChatRequest");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

// Get chat by ID
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate("participants", "name profileImage")
      .populate("messages.sender", "name profileImage")
      .populate("messages.receiver", "name profileImage");

    if (!chat) {
      req.flash("error", "Chat not found");
      return res.redirect("/users/dashboard");
    }

    // Check if user is participant in this chat
    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      req.flash("error", "Access denied");
      return res.redirect("/users/dashboard");
    }

    // Get all chats for sidebar
    const allChats = await Chat.find({
      participants: req.user._id,
      chatType: "user_doctor",
    })
      .populate("participants", "name profileImage")
      .sort({ lastUpdated: -1 });

    res.render("chat/chat", {
      user: req.user,
      title: "Chat",
      chat,
      allChats,
      isDoctor: req.user.isDoctor,
    });
  } catch (error) {
    console.error("Error getting chat:", error);
    req.flash("error", "Failed to load chat");
    res.redirect("/users/dashboard");
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  console.log('\n=== SEND MESSAGE REQUEST RECEIVED ===');
  console.log('Chat ID:', req.params.chatId);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user ? req.user._id : 'No user');
  
  try {
    const { chatId } = req.params;
    const { content, type = "text" } = req.body;

    console.log('Extracted content:', content);
    console.log('Message type:', type);

    if (!content || content.trim() === "") {
      console.log('ERROR: Empty content');
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Determine receiver (other participant)
    const receiver = chat.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    const message = {
      sender: req.user._id,
      senderModel: req.user.isDoctor ? "Doctor" : "User",
      receiver: receiver,
      receiverModel: req.user.isDoctor ? "User" : "Doctor",
      content: content.trim(),
      type: type,
    };

    chat.messages.push(message);
    await chat.save();

    // Get the saved message from chat to ensure proper structure
    const savedChat = await Chat.findById(chatId)
      .populate('messages.sender', 'name profileImage')
      .populate('messages.receiver', 'name profileImage');
    
    const savedMessage = savedChat.messages[savedChat.messages.length - 1];
    
    console.log('\n=== 📋 MESSAGE SAVED TO DATABASE ===');
    console.log('Total messages in chat now:', savedChat.messages.length);
    console.log('Sender ID:', req.user._id);
    console.log('Message content:', content);
    console.log('Saved message ID:', savedMessage._id);
    console.log('Saved message structure:', {
      _id: savedMessage._id,
      sender: savedMessage.sender,
      content: savedMessage.content,
      type: savedMessage.type,
      createdAt: savedMessage.createdAt
    });

    // Check if this is a form submission (has content-type: application/x-www-form-urlencoded)
    const isFormSubmission = req.headers['content-type'] && 
      req.headers['content-type'].includes('application/x-www-form-urlencoded');
    
    console.log('Is form submission:', isFormSubmission);
    console.log('Content-Type:', req.headers['content-type']);
    
    if (isFormSubmission) {
      // Form submission - redirect back to chat page
      console.log('📨 Redirecting to chat page after form submission');
      return res.redirect(`/chat/${chatId}`);
    } else {
      // AJAX request - return JSON response
      const responseData = {
        success: true,
        message: "Message sent successfully",
        data: savedMessage,
      };
      
      console.log('📨 Sending JSON response to client:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    }
  } catch (error) {
    console.error('\n=== ❌ ERROR IN SEND MESSAGE ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Chat ID:', req.params.chatId);
    console.error('User ID:', req.user ? req.user._id : 'No user');
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check if this is a form submission
    const isFormSubmission = req.headers['content-type'] && 
      req.headers['content-type'].includes('application/x-www-form-urlencoded');
    
    if (isFormSubmission) {
      // Form submission - redirect back to chat page with error
      console.error('Redirecting to chat page with error flash message');
      req.flash('error', 'Failed to send message: ' + error.message);
      return res.redirect(`/chat/${req.params.chatId}`);
    } else {
      // AJAX request - return JSON error response
      const errorResponse = {
        success: false,
        message: "Failed to send message: " + error.message,
        error: error.name
      };
      
      console.error('Sending error response:', JSON.stringify(errorResponse, null, 2));
      res.status(500).json(errorResponse);
    }
  }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    // Get chats where user is a participant
    const chats = await Chat.find({
      participants: req.user._id,
      chatType: "user_doctor",
    })
      .populate("participants", "name profileImage")
      .sort({ lastUpdated: -1 });

    res.render("chat/list", {
      user: req.user,
      title: "My Chats",
      chats,
      chatRequests: [] // No more chat requests
    });
  } catch (error) {
    console.error("Error getting user chats:", error);
    req.flash("error", "Failed to load chats");
    res.redirect("/users/dashboard");
  }
};

// Start direct chat with doctor (no request needed)
exports.startDirectChat = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user._id;
    
    console.log('=== START DIRECT CHAT ===');
    console.log('User:', userId, 'Doctor:', doctorId);
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) {
      req.flash('error', 'Doctor not found');
      return res.redirect('/users/chat-doctors');
    }
    
    // Check if doctor has a user account
    if (!doctor.user) {
      console.error('Doctor has no associated user account:', doctor._id);
      req.flash('error', 'Doctor profile incomplete. Please contact support.');
      return res.redirect('/users/chat-doctors');
    }
    
    console.log('Doctor user ID:', doctor.user._id);
    
    // Check if chat already exists between user and doctor
    let existingChat = await Chat.findOne({
      participants: { $all: [userId, doctor.user._id] },
      chatType: "user_doctor"
    });
    
    if (existingChat) {
      console.log('Found existing chat:', existingChat._id);
      return res.redirect(`/chat/${existingChat._id}`);
    }
    
    // Create new chat
    const newChat = new Chat({
      participants: [userId, doctor.user._id],
      participantModels: ["User", "User"],
      chatType: "user_doctor",
      consultationType: "general",
      isActive: true
    });
    
    await newChat.save();
    console.log('Created new chat:', newChat._id);
    
    // Redirect to the chat
    res.redirect(`/chat/${newChat._id}`);
    
  } catch (error) {
    console.error('\n=== ERROR IN START DIRECT CHAT ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Doctor ID:', doctorId);
    console.error('User ID:', userId);
    
    req.flash('error', 'Failed to start chat: ' + error.message);
    res.redirect('/users/chat-doctors');
  }
};

// Create chat request (DEPRECATED - keeping for backward compatibility)
exports.createChatRequest = async (req, res) => {
  try {
    console.log('=== CREATE CHAT REQUEST DEBUG ===');
    console.log('doctorId from params:', req.params.doctorId);
    console.log('req.body:', req.body);
    console.log('user:', req.user ? req.user._id : 'No user');
    
    const { doctorId } = req.params;
    const { 
      consultationType = "general", 
      reason, 
      urgency = "medium", 
      symptoms = "", 
      currentMedications = "", 
      allergies = ""
    } = req.body;
    
    // Validate required fields
    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reason for consultation is required"
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Check if request already exists
    const existingRequest = await ChatRequest.findOne({
      user: req.user._id,
      doctor: doctorId,
      status: { $in: ["pending", "accepted"] }
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending or accepted request with this doctor"
      });
    }
    
    // Process arrays - handle both array and string inputs
    const symptomsArray = Array.isArray(symptoms) ? symptoms.filter(Boolean) : 
                          (symptoms ? symptoms.split(',').map(s => s.trim()).filter(Boolean) : []);
    const medicationsArray = Array.isArray(currentMedications) ? currentMedications.filter(Boolean) : 
                           (currentMedications ? currentMedications.split(',').map(m => m.trim()).filter(Boolean) : []);
    const allergiesArray = Array.isArray(allergies) ? allergies.filter(Boolean) : 
                         (allergies ? allergies.split(',').map(a => a.trim()).filter(Boolean) : []);
    
    // Create new request
    const newRequest = new ChatRequest({
      user: req.user._id,
      doctor: doctorId,
      status: "pending",
      consultationType,
      reason: reason.trim(),
      urgency,
      symptoms: symptomsArray,
      currentMedications: medicationsArray,
      allergies: allergiesArray,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    await newRequest.save();
    
    return res.status(200).json({
      success: true,
      message: "Chat request sent successfully",
      requestId: newRequest._id
    });
  } catch (error) {
    console.error("Error creating chat request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send chat request. Please try again."
    });
  }
};

// Accept chat request
exports.acceptChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes = "" } = req.body;
    
    // Find the request
    const request = await ChatRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Chat request not found"
      });
    }
    
    // Check if the logged-in user is the doctor who received the request
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor || request.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to respond to this request"
      });
    }
    
    // Check if request is already accepted or rejected
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}`
      });
    }
    
    // Create new chat
    const newChat = new Chat({
      participants: [request.user, doctor.user],
      participantModels: ["User", "User"],
      chatType: "user_doctor",
      consultationType: request.consultationType || "general",
    });
    
    await newChat.save();
    
    // Update request status
    request.status = "accepted";
    request.acceptedAt = new Date();
    request.doctorNotes = notes;
    request.chatCreated = true;
    request.chatId = newChat._id;
    await request.save();
    
    return res.status(200).json({
      success: true,
      message: "Chat request accepted",
      chatId: newChat._id
    });
  } catch (error) {
    console.error("Error accepting chat request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept chat request. Please try again."
    });
  }
};

// Reject chat request
exports.rejectChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason = "" } = req.body;
    
    // Find the request
    const request = await ChatRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Chat request not found"
      });
    }
    
    // Check if the logged-in user is the doctor who received the request
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor || request.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to respond to this request"
      });
    }
    
    // Check if request is already accepted or rejected
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${request.status}`
      });
    }
    
    // Update request status
    request.status = "rejected";
    request.rejectedAt = new Date();
    request.rejectedReason = reason;
    await request.save();
    
    return res.status(200).json({
      success: true,
      message: "Chat request rejected"
    });
  } catch (error) {
    console.error("Error rejecting chat request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject chat request. Please try again."
    });
  }
};

// Get chat requests for user
exports.getUserChatRequests = async (req, res) => {
  try {
    let query;
    
    if (req.user.isDoctor) {
      // For doctors, find the doctor profile first
      const doctor = await Doctor.findOne({ user: req.user._id });
      
      if (!doctor) {
        req.flash("error", "Doctor profile not found");
        return res.redirect("/doctors/register");
      }
      
      // Get requests sent to this doctor
      query = { doctor: doctor._id };
    } else {
      // For regular users, get requests they've sent
      query = { user: req.user._id };
    }
    
    const chatRequests = await ChatRequest.find(query)
      .populate("user", "name email profileImage")
      .populate({
        path: "doctor",
        select: "fullName specialization user",
        populate: {
          path: "user",
          select: "name email profileImage"
        }
      })
      .populate("chatId")
      .sort({ createdAt: -1 });

    // Determine which view to render based on user type
    const viewPath = req.user.isDoctor ? "doctor/chat-requests" : "chat/requests";
    
    res.render(viewPath, {
      user: req.user,
      title: "Chat Requests",
      chatRequests,
      isDoctor: req.user.isDoctor
    });
  } catch (error) {
    console.error("Error getting chat requests:", error);
    req.flash("error", "Failed to load chat requests");
    res.redirect("/users/dashboard");
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the receiver
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await chat.save();

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Chat.aggregate([
      {
        $match: {
          participants: req.user._id,
        },
      },
      {
        $unwind: "$messages",
      },
      {
        $match: {
          "messages.receiver": req.user._id,
          "messages.isRead": false,
        },
      },
      {
        $count: "count",
      },
    ]);

    res.json({
      success: true,
      count: unreadCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};
