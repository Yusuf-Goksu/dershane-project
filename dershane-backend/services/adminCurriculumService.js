const XLSX = require("xlsx");
const Subject = require("../models/Subject");
const Topic = require("../models/Topic");
const AppError = require("../utils/AppError");

class AdminCurriculumService {
  async bulkUpload(buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new AppError("Excel dosyası boş", 400);
    }

    // 🔥 VALIDATION PASS
    const seenKeys = new Set();

    rows.forEach((row, i) => {
      const line = i + 2;

      if (!row.subject_name || !row.topic_name) {
        throw new AppError(
          `Satır ${line}: ders adı ve konu adı zorunlu`,
          400
        );
      }

      const grade = Number(row.gradeLevel);
      if (![9, 10, 11, 12].includes(grade)) {
        throw new AppError(
          `Satır ${line}: geçersiz sınıf seviyesi`,
          400
        );
      }

      if (!row.order || isNaN(row.order)) {
        throw new AppError(
          `Satır ${line}: sıra (order) zorunlu`,
          400
        );
      }

      const key = `${row.subject_name}-${grade}-${row.order}`;
      if (seenKeys.has(key)) {
        throw new AppError(
          `Satır ${line}: aynı ders ve seviye için sıra çakışması`,
          400
        );
      }
      seenKeys.add(key);
    });

    // 🔥 SUBJECT CACHE
    const subjectCache = {};
    let createdSubjects = 0;
    let createdTopics = 0;

    for (const row of rows) {
      const subjectName = row.subject_name.trim();

      let subject = subjectCache[subjectName];
      if (!subject) {
        subject = await Subject.findOne({ name: subjectName });
        if (!subject) {
          subject = await Subject.create({ name: subjectName });
          createdSubjects++;
        }
        subjectCache[subjectName] = subject;
      }

      try {
        await Topic.create({
          subjectId: subject._id,
          name: row.topic_name.trim(),
          gradeLevel: Number(row.gradeLevel),
          order: Number(row.order),
        });
        createdTopics++;
      } catch (err) {
        if (err.code === 11000) {
          throw new AppError(
            `Konu zaten mevcut: ${row.topic_name} (${row.gradeLevel}. sınıf)`,
            400
          );
        }
        throw err;
      }
    }

    return { createdSubjects, createdTopics };
  }
}

module.exports = new AdminCurriculumService();
