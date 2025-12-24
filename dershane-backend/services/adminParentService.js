const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../models/User");
const Parent = require("../models/Parent");
const Student = require("../models/Student");
const AppError = require("../utils/AppError");

function generatePassword() {
  return crypto.randomBytes(4).toString("hex");
}

class AdminParentService {
  // 🔹 Liste
  async getAllParents() {
    const parents = await Parent.find()
      .populate("user", "name email")
      .populate({
        path: "students",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    return parents.map((p) => ({
      _id: p._id,
      name: p.user.name,
      email: p.user.email,
      students: p.students.map((s) => ({
        _id: s._id,
        name: s.user?.name,
        email: s.user?.email,
      })),
    }));
  }

  // 🔹 Tekli oluştur
  async createParent(data) {
    const { name, email, password, studentIds = [] } = data;

    if (!name || !email) {
      throw new AppError("name ve email zorunludur", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError("Bu email zaten kullanılıyor", 400);
    }

    let finalPassword = password;
    if (!finalPassword || String(finalPassword).trim() === "") {
      finalPassword = generatePassword();
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(finalPassword, 10),
      role: "parent",
    });

    // 🔗 Öğrencileri doğrula
    const students = [];
    for (const sid of studentIds) {
      const student = await Student.findById(sid);
      if (!student) {
        throw new AppError("Bağlanacak öğrenci bulunamadı", 404);
      }
      students.push(student._id);
    }

    const parent = await Parent.create({
      user: user._id,
      students,
    });

    return {
      message: "Veli oluşturuldu",
      parentId: parent._id,
      autoPassword: !password ? finalPassword : null,
    };
  }

  // 🔹 Sil
  async deleteParent(parentId) {
    const parent = await Parent.findById(parentId);
    if (!parent) {
      throw new AppError("Veli bulunamadı", 404);
    }

    // 👤 User sil
    await User.findByIdAndDelete(parent.user);

    // 👨‍👩‍👧 Parent sil
    await parent.deleteOne();

    return { message: "Veli silindi" };
  }
}

module.exports = new AdminParentService();
