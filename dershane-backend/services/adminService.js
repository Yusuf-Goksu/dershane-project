const XLSX = require("xlsx");
const User = require("../models/User");
const Student = require("../models/Student");
const Parent = require("../models/Parent");
const Class = require("../models/Class");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const crypto = require("crypto");
const notificationManager = require("./notification/notificationManager");

function generatePassword() {
  return crypto.randomBytes(4).toString("hex"); // 8 karakter güçlü
}

class AdminService {
async bulkCreateUsers(buffer) {
  // 🔥 SINIF CACHE (BURASI EKSİKTİ)
  const classCache = {};

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  if (!rows.length) {
    throw new AppError("Excel dosyası boş", 400);
  }

  // ==========================
  // 1️⃣ VALIDATION PASS
  // ==========================
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.student_email || !row.class_name) {
      throw new AppError(
        `Satır ${i + 2}: öğrenci email ve sınıf zorunlu`,
        400
      );
    }

    // 🔥 cache’li class bulma
    let classDoc = classCache[row.class_name];
    if (!classDoc) {
      classDoc = await Class.findOne({ name: row.class_name });
      if (!classDoc) {
        throw new AppError(
          `Satır ${i + 2}: sınıf bulunamadı (${row.class_name})`,
          400
        );
      }
      classCache[row.class_name] = classDoc;
    }
  }

  // ==========================
  // 2️⃣ CREATE PASS
  // ==========================
  let createdUsers = 0;
  let createdStudents = 0;
  let createdParents = 0;

    for (const row of rows) {
        const classDoc = classCache[row.class_name];

        // ==========================
        // 👨‍🎓 ÖĞRENCİ
        // ==========================
        let studentUser = await User.findOne({
            email: row.student_email,
        });

        let student;
        let studentPassword;
        let isStudentPasswordAuto = false;

        if (!studentUser) {
            studentPassword = row.student_password;

            if (!studentPassword || String(studentPassword).trim() === "") {
            studentPassword = generatePassword();
            isStudentPasswordAuto = true;
            } else {
            studentPassword = String(studentPassword);
            }

            studentUser = await User.create({
            name: row.student_name,
            email: row.student_email,
            password: await bcrypt.hash(studentPassword, 10),
            role: "student",
            });

            student = await Student.create({
            user: studentUser._id,
            classId: classDoc._id,
            });

            createdUsers++;
            createdStudents++;

            // 🔥 Öğrenci maili
            if (isStudentPasswordAuto) {
            await notificationManager.sendStudentWelcome(
                studentUser._id,
                row.student_email,
                studentPassword
            );
            }
        } else {
            student = await Student.findOne({ user: studentUser._id });
        }

        // ==========================
        // 👨‍👩‍👧 VELİ
        // ==========================
        if (row.parent_email) {
            let parentUser = await User.findOne({
            email: row.parent_email,
            });

            if (!parentUser) {
            let parentPassword = row.parent_password;
            let isParentPasswordAuto = false;

            if (!parentPassword || String(parentPassword).trim() === "") {
                parentPassword = generatePassword();
                isParentPasswordAuto = true;
            } else {
                parentPassword = String(parentPassword);
            }

            parentUser = await User.create({
                name: row.parent_name,
                email: row.parent_email,
                password: await bcrypt.hash(parentPassword, 10),
                role: "parent",
            });

            const parent = await Parent.create({
                user: parentUser._id,
                students: [student._id],
            });

            createdUsers++;
            createdParents++;

            // 🔥 Veli maili
            if (isParentPasswordAuto) {
                await notificationManager.sendParentWelcome(
                parentUser._id,
                row.parent_email,
                parentPassword
                );
            }
            } else {
            // veli varsa öğrenciyi bağla (idempotent)
            const parent = await Parent.findOne({ user: parentUser._id });
            if (!parent.students.includes(student._id)) {
                parent.students.push(student._id);
                await parent.save();
            }
            }
        }
        }

    return {
      createdUsers,
      createdStudents,
      createdParents,
    };
  }
}

module.exports = new AdminService();
