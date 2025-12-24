const Schedule = require("../models/Schedule");
const Student = require("../models/Student");
const Class = require("../models/Class");
const AppError = require("../utils/AppError");
const notificationManager = require("./notification/notificationManager");

class ScheduleService {

  // ⭐ Yaklaşan etkinlikler
  async getUpcomingEvents(classId) {
    if (!classId) {
      throw new AppError("classId zorunludur", 400);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const events = await Schedule.find({
      classId,
      date: { $gte: todayStart },
    })
      .sort({ date: 1 })
      .lean();

    if (!events.length) {
      throw new AppError("Yaklaşan etkinlik bulunamadı", 404);
    }

    return events;
  }

  // ⭐ En yakın etkinlik
  async getNextEvent(classId) {
    if (!classId) {
      throw new AppError("classId zorunludur", 400);
    }

    const now = new Date();

    const event = await Schedule.findOne({
      classId,
      date: { $gte: now },
    })
      .sort({ date: 1 })
      .lean();

    if (!event) {
      throw new AppError("Yaklaşan etkinlik bulunamadı", 404);
    }

    return event;
  }

  async create(data) {
    const { title, description, date, type, classId } = data;

    if (!title || !date) {
      throw new AppError("Başlık ve tarih zorunludur", 400);
    }

    const schedule = await Schedule.create({
      title,
      description,
      date,
      type: type || "lesson",
      classId: classId || null,
    });

    // 🔔 BİLDİRİM
    await this.notifyStudents(schedule);

    return schedule;
  }

  // ⭐ Tüm etkinlikler (admin)
  async getAll({ classId, from, to }) {
    const filter = {};

    // 🎯 Sınıf filtresi
    if (classId) {
      filter.$or = [
        { classId },
        { classId: null }, // genel etkinlikler
      ];
    }

    // 📅 Tarih filtresi (takvim için)
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    return await Schedule.find(filter)
      .populate("classId", "name")
      .sort({ date: 1 });
  }


  async remove(id) {
    const item = await Schedule.findById(id);
    if (!item) {
      throw new AppError("Etkinlik bulunamadı", 404);
    }

    await item.deleteOne();
    return { message: "Etkinlik silindi" };
  }


  // ⭐  öğrencilere bildirim
  async notifyStudents(schedule) {
    const { title, type, classId } = schedule;

    let students = [];

    if (classId) {
      // 🎯 Sadece o sınıf
      students = await Student.find({ classId }).select("user");
    } else {
      // 🌍 Tüm öğrenciler
      students = await Student.find().select("user");
    }

    for (const s of students) {
      await notificationManager.sendSchedule(
        s.user,
        `Yeni etkinlik: ${title}`
      );
    }
  }
}

module.exports = new ScheduleService();
