const bcrypt = require('bcrypt');
const User = require('../models/User');
const Student = require('../models/Student');
const TeacherProfile = require("../models/TeacherProfile");
const Parent = require('../models/Parent');
const AppError = require('../utils/AppError');
const tokenHelper = require('../utils/tokenHelper');

class AuthService {

  // ⭐ REGISTER
async register(data) {
  const { name, email, password, role } = data;

  if (!name || !email || !password || !role) {
    throw new AppError("name, email, password ve role zorunludur", 400);
  }

  // Email kontrol
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Bu email zaten kullanılıyor", 400);
  }

  // Rol kontrolü (NET)
  const allowedRoles = ["student", "teacher", "parent", "admin"];
  if (!allowedRoles.includes(role)) {
    throw new AppError("Geçersiz rol", 400);
  }

  // Öğrenci Kayıt olacaksa kontrol
  if (role === "student" && !data.classId) {
    throw new AppError("Öğrenci için classId zorunludur", 400);
  }

  // Şifre hash
  const hashedPassword = await bcrypt.hash(password, 10);

  // User oluştur
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role
  });

  // Role bağlı profil oluştur
switch (role) {
  case "student": {
    const exists = await Student.findOne({ user: user._id });
    if (!exists) {
      await Student.create({
        user: user._id,
        classId: data.classId,
        attendance: [],
      });
    }
    break;
  }

  case "parent": {
    const exists = await Parent.findOne({ user: user._id });
    if (!exists) {
      await Parent.create({
        user: user._id,
        students: [],
      });
    }
    break;
  }

  case "teacher": {
    const exists = await TeacherProfile.findOne({ userId: user._id });
    if (!exists) {
      await TeacherProfile.create({
        userId: user._id,
        branches: [], // admin panelden doldurulacak
      });
    }
    break;
  }

  case "admin":
    // Admin için ekstra profil gerekmez
    break;
}

  return {
    message: "Kullanıcı başarıyla oluşturuldu",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}


// ⭐ LOGIN
async login(data) {
  const { email, password } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Kullanıcı bulunamadı", 404);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Şifre hatalı", 400);
  }

  // 🔑 Token oluştur
  const token = tokenHelper.generateToken(user);

  let studentId = null;
  let classId = null;

  // 🧠 SADECE öğrenci ise Student tablosuna bak
  if (user.role === "student") {
    const student = await Student.findOne({ user: user._id }).select("_id classId");

    if (student) {
      studentId = student._id;
      classId = student.classId;
    }
  }

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,

      // ⭐ Flutter için KRİTİK alanlar
      studentId,
      classId,
    },
  };
}



/*
  // ⭐ LOGIN
  async login(data) {
    const { email, password } = data;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Kullanıcı bulunamadı", 404);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Şifre hatalı", 400);
    }

    // Token oluştur
    const token = tokenHelper.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }*/
}

module.exports = new AuthService();
