const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const Subject = require("../models/Subject");
const AppError = require("../utils/AppError");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const notificationManager = require("./notification/notificationManager");
const mongoose = require("mongoose");
const ClassCourse = require("../models/ClassCourse");

function generatePassword() {
  return crypto.randomBytes(4).toString("hex"); // 8 karakter
}

class AdminTeacherService {
  async getAllTeachers() {
    return await TeacherProfile.find()
      .populate("userId", "name email")
      .populate("branches", "name")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createTeacher(data) {
    const { name, email, password, branches } = data;

    if (!name || !email) {
      throw new AppError("İsim ve email zorunludur", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError("Bu email zaten kayıtlı", 400);
    }

    // 🔐 Şifre
    let finalPassword = password;
    let isAutoPassword = false;

    if (!finalPassword || finalPassword.trim() === "") {
      finalPassword = generatePassword();
      isAutoPassword = true;
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // 👤 User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
    });

    // 📘 Branş doğrulama
    let validBranches = [];
    if (branches && branches.length) {
      validBranches = await Subject.find({
        _id: { $in: branches },
      }).select("_id");
    }

    // 🎓 TeacherProfile
    const profile = await TeacherProfile.create({
      userId: user._id,
      branches: validBranches.map((b) => b._id),
    });

    // ✉️ Mail (sadece otomatik şifre varsa)
    if (isAutoPassword) {
      await notificationManager.sendTeacherWelcome(
        user._id,
        email,
        finalPassword
      );
    }

    return {
      message: "Öğretmen oluşturuldu",
      teacherId: profile._id,
    };
  }

  /**
   * ❌ Öğretmen silme (aktif ders varsa ENGEL)
   */
  async deleteTeacherCascade(teacherId) {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new AppError("Geçersiz teacherId", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Öğretmen profili var mı?
      const teacherProfile = await TeacherProfile.findById(teacherId)
        .session(session);

      if (!teacherProfile) {
        throw new AppError("Öğretmen profili bulunamadı", 404);
      }

      // 2️⃣ Aktif ders/sınıf ataması var mı?
      const assignmentCount = await ClassCourse.countDocuments({
        teacherId: teacherProfile._id,
      }).session(session);

      if (assignmentCount > 0) {
        throw new AppError(
          "Bu öğretmenin aktif ders/sınıf ataması olduğu için silinemez",
          400
        );
      }

      // 3️⃣ User kaydı
      const userId = teacherProfile.userId;

      // 4️⃣ TeacherProfile sil
      await TeacherProfile.deleteOne({
        _id: teacherProfile._id,
      }).session(session);

      // 5️⃣ User sil
      await User.deleteOne({
        _id: userId,
        role: "teacher",
      }).session(session);

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Öğretmen başarıyla silindi",
        deletedTeacherId: teacherId,
      };

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}


module.exports = new AdminTeacherService();
