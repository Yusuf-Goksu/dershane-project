const Student = require("../models/Student");
const Parent = require("../models/Parent");
const TeacherProfile = require("../models/TeacherProfile");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");

class AdminStatsService {
  async getDashboardStats() {
    const [
      totalStudents,
      totalParents,
      totalTeachers,
      totalExams,
      totalSubjects,
    ] = await Promise.all([
      Student.countDocuments({}),
      Parent.countDocuments({}),
      TeacherProfile.countDocuments({}),
      Exam.countDocuments({}),
      Subject.countDocuments({}),
    ]);

    return {
      totalStudents,
      totalParents,
      totalTeachers,
      totalExams,
      totalSubjects,
    };
  }
}

module.exports = new AdminStatsService();
