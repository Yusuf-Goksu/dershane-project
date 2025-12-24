// ----------------------------------------------------
// 🔹 1) Environment + Core Modules
// ----------------------------------------------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const aiRoutes = require('./routes/aiRoutes');
// Chat service (istersen sonra aktif ederiz)
const chatService = require("./services/chatService");

// ----------------------------------------------------
// 🔹 2) Express App
// ----------------------------------------------------
const app = express();
const server = http.createServer(app);



// ----------------------------------------------------
// 🔹 3) Socket.io (Flutter uyumlu, JWT ZORUNLU DEĞİL)
// ----------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"], // <-- Railway + Flutter için kritik
});

// 🚨 JWT ZORUNLULUĞU KAPATILDI — Flutter token göndermiyor
io.use((socket, next) => {
  console.log("⚠️ JWT doğrulama devre dışı — socket kabul edildi.");
  // İstersen sender bilgisini Flutter’dan alacağız
  socket.user = null;
  next();
});

// ----------------------------------------------------
// 🔹 4) Socket Events
// ----------------------------------------------------
io.on("connection", (socket) => {
  console.log("🟢 Socket bağlandı:", socket.id);

  // 🔸 Odaya katıl
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`📌 Socket ${socket.id} odaya katıldı → ${roomId}`);
  });

  // 🔸 Mesaj gönder (Flutter uyumlu format)
  socket.on("sendMessage", async (data) => {
    try {
      // 1️⃣ Mesajı DB’ye kaydet
      const savedMessage = await chatService.sendMessage(
        { _id: data.sender }, // sender ID
        { roomId: data.roomId, text: data.text, audioUrl: data.audioUrl }
      );

      const cleanMessage = {
        id: savedMessage.id.toString(),
        roomId: savedMessage.roomId.toString(),
        sender: savedMessage.sender.toString(),
        receiver: savedMessage.receiver.toString(),
        text: savedMessage.text,
        audioUrl: savedMessage.audioUrl,
        time: savedMessage.time,
      };

      // 2️⃣ Odaya gerçek zamanlı yayınla
      io.to(data.roomId).emit("receiveMessage", cleanMessage);

      // 4️⃣ ChatListScreen için — son mesaj güncellemesi
      io.to(data.roomId).emit("receiveChatUpdate", {
        roomId: data.roomId,
        lastMessage: cleanMessage.text || "🎤 Sesli mesaj",
        lastMessageTime: cleanMessage.time,
        sender: cleanMessage.sender,
      });

      console.log("📤 Mesaj gönderildi:", savedMessage);

    } catch (err) {
      console.error("❌ sendMessage Socket.io hatası:", err);
      socket.emit("errorMessage", { message: err.message });
    }
  });

    socket.on("disconnect", () => {
      console.log("🔴 Socket ayrıldı:", socket.id);
    });
  });

// ----------------------------------------------------
// 🔹 5) Middleware’ler
// ----------------------------------------------------
app.use(cors({
  origin: [
    "http://localhost:5173",              // Admin panel (local)
    "https://dershane-admin.vercel.app",  // Admin panel (Vercel)
  ],
  credentials: true,
}));

app.use(express.json());
// ----------------------------------------------------
// 🔹 6) Database Bağlantısı
// ----------------------------------------------------
connectDB();

// ----------------------------------------------------
// 🔹 7) Route Imports
// ----------------------------------------------------

app.get("/", (req, res) => {
   res.send("🎓 Dershane API çalışıyor (Kurumsal) ✅"); 
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/parents", require("./routes/parentRoutes"));
app.use("/api/schedule", require("./routes/scheduleRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.static("public"));
app.use('/api/ai', aiRoutes);
app.use("/api", require("./routes/examRoutes"));
app.use("/api/classes", require("./routes/classRoutes"));
app.use("/api/exam-results", require("./routes/examResultRoutes"));
app.use("/api/topic-coverage",require("./routes/topicCoverageRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/topics", require("./routes/topicRoutes"));
app.use("/api/admin", require("./routes/adminCurriculumRoutes"));
app.use("/api/admin/class-courses", require("./routes/adminClassCourseRoutes"));
app.use("/api/admin", require("./routes/adminTeacherRoutes"));
app.use("/api/admin/exams", require("./routes/adminExamRoutes"));
app.use("/api/admin", require("./routes/notificationSettingsRoutes"));
app.use("/api/admin", require("./routes/adminStatsRoutes"));
app.use("/api/admin", require("./routes/adminStudentRoutes"));
app.use("/api/admin", require("./routes/adminParentRoutes"));
app.use("/api/class-courses", require("./routes/teacherClassCourseRoutes"));


// ----------------------------------------------------
// 🔹 8) Global Error Handler
// ----------------------------------------------------
const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

// ----------------------------------------------------
// 🔹 9) Server Başlatma
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Sunucu Socket.io ile birlikte ${PORT} portunda çalışıyor`);
});
