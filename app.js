require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ejsMate = require("ejs-mate");
const path = require("path");
const ejs = require("ejs");
const methodOverride = require("method-override");
const helmet = require("helmet");

const User = require("./models/User");

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000;

// Env & App Setup
const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/healthfy";

// Connect to MongoDB
// Connect to MongoDB
mongoose
  .connect(mongoUrl)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(helmet());
app.use(flash());

// EJS Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session store
const store = MongoStore.create({
  mongoUrl,
  crypto: { secret: process.env.SESSION_SECRET || "AnirbanOpi1234" },
  touchAfter: 24 * 3600,
});
store.on("error", (err) => console.error("❌ MongoStore Error:", err));

app.use(
  session({
    store,
    secret: process.env.SESSION_SECRET || "AnirbanOpi1234",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

// Passport Config
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Ensure proper indexes on startup
mongoose.connection.once("open", async () => {
  try {
    // Drop any conflicting username indexes if they exist
    try {
      await mongoose.connection.db.collection("users").dropIndex("username_1");
    } catch (e) {
      // Index doesn't exist, which is fine
    }
  } catch (e) {
    console.error("Startup index cleanup failed:", e.message);
  }
});

// Set user to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Middleware to make flash messages available in all views
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// Routes
const indexRoutes = require("./routes/indexRoutes");
const userRoutes = require("./routes/userRouetes.js");
const doctorRoutes = require("./routes/doctorRoutes");
const postRoutes = require("./routes/postRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const chatRoutes = require("./routes/chatRoutes");
const videoRoutes = require("./routes/videoRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const healthAnalyticsRoutes = require("./routes/healthAnalyticsRoutes");
const challengeRoutes = require("./routes/challenges");
const RealTimeService = require('./services/realTimeService');
const { isLoggedIn } = require("./middleware/isLoggedIn");
const predictionController = require("./controllers/predictionController");
const aiRoutes = require("./routes/ai");

app.use("/uploads", express.static("uploads"));
app.use("/", indexRoutes);
app.use("/users", userRoutes);
app.use("/doctors", doctorRoutes);
app.use("/posts", postRoutes);
app.use("/prediction", predictionRoutes);
app.use("/chat", chatRoutes);
app.use("/video-calls", videoRoutes);
app.use("/medicine-search", medicineRoutes);
app.use("/", healthAnalyticsRoutes);
app.use("/challenges", challengeRoutes);
app.use("/ai", aiRoutes);

// Convenience aliases
app.post("/upload", isLoggedIn, predictionController.uploadXray);
app.get("/predictions/:id", isLoggedIn, predictionController.renderXrayView);

// 404 handler (catch-all)
app.use((req, res) => {
  res.status(404).render("error/404", { user: req.user });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error/500", { user: req.user });
});

// Initialize Real-time Service for Health Challenges
const realTimeService = new RealTimeService(io);

// Make real-time service available globally for controllers
app.set('realTimeService', realTimeService);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a chat room
  socket.on('join chat', (chatId) => {
    socket.join(chatId);
  });

  // Handle new messages
  socket.on('new message', async (data) => {
    try {
      const { chatId, message } = data;
      // Broadcast the message to all users in the chat room except sender
      socket.to(chatId).emit('message received', message);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('typing', data);
  });

  socket.on('stop typing', (data) => {
    socket.to(data.chatId).emit('stop typing', data);
  });

  // Video Call Handlers
  // Join a video call room
  socket.on('join video call', (callId) => {
    console.log(`\n🎥 === VIDEO CALL JOIN ===`);
    console.log(`📞 Socket ${socket.id} joining call: ${callId}`);

    // Get room info before joining
    const roomBefore = io.sockets.adapter.rooms.get(callId);
    const participantsBefore = roomBefore ? Array.from(roomBefore) : [];
    console.log(`👥 Participants before join:`, participantsBefore);

    socket.join(callId);
    console.log(`✅ Socket ${socket.id} successfully joined room ${callId}`);

    // Get room info after joining
    const roomAfter = io.sockets.adapter.rooms.get(callId);
    const participantsAfter = roomAfter ? Array.from(roomAfter) : [];
    console.log(`👥 Participants after join:`, participantsAfter);

    // Notify other participants that someone joined
    const otherParticipants = participantsAfter.filter(id => id !== socket.id);
    console.log(`📢 Notifying ${otherParticipants.length} other participants`);

    if (otherParticipants.length > 0) {
      socket.to(callId).emit('user joined call', {
        socketId: socket.id,
        callId: callId
      });
      console.log(`📤 Sent 'user joined call' to participants:`, otherParticipants);
    }

    // Send list of current participants to new user
    socket.emit('current participants', otherParticipants);
    console.log(`📥 Sent 'current participants' to ${socket.id}:`, otherParticipants);
    console.log(`🎥 === END VIDEO CALL JOIN ===\n`);
  });

  // Handle WebRTC offer
  socket.on('video call offer', (data) => {
    console.log(`\n📞 === OFFER RELAY ===`);
    console.log(`📤 From: ${socket.id} -> To: ${data.targetSocketId}`);
    console.log(`🎥 Call ID: ${data.callId}`);

    // Check if target socket exists
    const targetSocket = io.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) {
      console.log(`✅ Target socket found, relaying offer`);
      socket.to(data.targetSocketId).emit('video call offer received', {
        offer: data.offer,
        fromSocketId: socket.id,
        callId: data.callId
      });
    } else {
      console.log(`❌ Target socket ${data.targetSocketId} not found!`);
    }
    console.log(`📞 === END OFFER RELAY ===\n`);
  });

  // Handle WebRTC answer
  socket.on('video call answer', (data) => {
    console.log(`\n📬 === ANSWER RELAY ===`);
    console.log(`📤 From: ${socket.id} -> To: ${data.targetSocketId}`);
    console.log(`🎥 Call ID: ${data.callId}`);

    // Check if target socket exists
    const targetSocket = io.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) {
      console.log(`✅ Target socket found, relaying answer`);
      socket.to(data.targetSocketId).emit('video call answer received', {
        answer: data.answer,
        fromSocketId: socket.id,
        callId: data.callId
      });
    } else {
      console.log(`❌ Target socket ${data.targetSocketId} not found!`);
    }
    console.log(`📬 === END ANSWER RELAY ===\n`);
  });

  // Handle ICE candidates
  socket.on('ice candidate', (data) => {
    console.log(`🧊 ICE candidate from ${socket.id} -> ${data.targetSocketId} (Call: ${data.callId})`);

    // Check if target socket exists
    const targetSocket = io.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) {
      socket.to(data.targetSocketId).emit('ice candidate received', {
        candidate: data.candidate,
        fromSocketId: socket.id,
        callId: data.callId
      });
    } else {
      console.log(`❌ Target socket ${data.targetSocketId} not found for ICE candidate!`);
    }
  });

  // Handle call state changes
  socket.on('call state change', (data) => {
    console.log(`Call state change: ${data.state} for call ${data.callId}`);
    socket.to(data.callId).emit('call state changed', {
      state: data.state,
      fromSocketId: socket.id,
      callId: data.callId
    });
  });

  // Handle leaving video call
  socket.on('leave video call', (callId) => {
    console.log(`User left video call: ${callId}`);
    socket.leave(callId);
    socket.to(callId).emit('user left call', {
      socketId: socket.id,
      callId: callId
    });
  });

  // Handle call end
  socket.on('end video call', (callId) => {
    console.log(`Ending video call: ${callId}`);
    // Notify all participants that call is ending
    io.to(callId).emit('call ended', {
      callId: callId,
      endedBy: socket.id
    });

    // Remove all users from the call room
    const room = io.sockets.adapter.rooms.get(callId);
    if (room) {
      room.forEach(socketId => {
        const participantSocket = io.sockets.sockets.get(socketId);
        if (participantSocket) {
          participantSocket.leave(callId);
        }
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Handle cleanup when user disconnects during a call
    // The socket.io rooms will automatically handle cleanup
  });
});

server.listen(port, () => {
  console.log(`🚀 Healthfy server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Visit: http://localhost:${port}`);
});
