const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../models/User");
const Student = require("../models/Student");
const Parent = require("../models/Parent");
const Class = require("../models/Class");
const AppError = require("../utils/AppError");

function generatePassword() {
  return crypto.randomBytes(4).toString("hex"); // 8 karakter
}

class AdminStudentService {
  // 🔹 Listele
  async getAllStudents() {
    const students = await Student.find()
      .populate("user", "name email")
      .populate("classId", "name")
      .sort({ createdAt: -1 });

    return students.map((s) => ({
      _id: s._id,
      name: s.user.name,
      email: s.user.email,
      className: s.classId?.name || "-",
      createdAt: s.createdAt,
    }));
  }

  // 🔹 Tekli öğrenci oluştur
  async createStudent(data) {
    const {
      name,
      email,
      password,
      classId,
      parentId, // opsiyonel
    } = data;

    if (!name || !email || !classId) {
      throw new AppError(
        "name, email ve classId zorunludur",
        400
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("Bu email zaten kullanılıyor", 400);
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new AppError("Sınıf bulunamadı", 404);
    }

    let finalPassword = password;
    if (!finalPassword || String(finalPassword).trim() === "") {
      finalPassword = generatePassword();
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(finalPassword, 10),
      role: "student",
    });

    const student = await Student.create({
      user: user._id,
      classId,
    });

    // 🔗 Veli bağlama (opsiyonel)
    if (parentId) {
      const parent = await Parent.findById(parentId);
      if (!parent) {
        throw new AppError("Veli bulunamadı", 404);
      }

      if (!parent.students.includes(student._id)) {
        parent.students.push(student._id);
        await parent.save();
      }
    }

    return {
      message: "Öğrenci oluşturuldu",
      studentId: student._id,
      autoPassword: !password ? finalPassword : null,
    };
  }

  // 🔹 Öğrenci sil
  async deleteStudent(studentId) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError("Öğrenci bulunamadı", 404);
    }

    // 🔗 Velilerden kopar
    await Parent.updateMany(
      { students: student._id },
      { $pull: { students: student._id } }
    );

    // 👤 User sil
    await User.findByIdAndDelete(student.user);

    // 🎓 Student sil
    await student.deleteOne();

    return {
      message: "Öğrenci silindi",
    };
  }
}

module.exports = new AdminStudentService();
