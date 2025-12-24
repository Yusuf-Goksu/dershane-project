const emailService = require('./emailService');
const pushService = require('./pushService');
const User = require('../../models/User');
const NotificationSetting = require("../../models/NotificationSetting");

class NotificationManager {

  async sendAll(
    userId,
    {
      title,
      body,
      emailText = null,
      emailHtml = null,
      data = {},
      mode // override (opsiyonel)
    },
    configKey
  ) {
    const user = await User.findById(userId);
    if (!user) return;

    // 🔔 DB'den notification ayarını oku
    let setting = null;

    if (configKey) {
      setting = await NotificationSetting.findOne({ key: configKey });
    }

    // 🎯 Öncelik sırası:
    // 1. Fonksiyona parametre olarak gelen mode
    // 2. Database'deki ayar
    // 3. Default: push
    const finalMode =
      mode ||
      setting?.mode ||
      "push";

    // --- Bildirim modları ---

    if (finalMode === "none") {
      return; // hiçbir bildirim gönderme
    }

    if (finalMode === "push") {
      await pushService.sendPush(userId, {title,body,data,});
      return;
    }

    if (finalMode === "email") {
      await emailService.sendMail(
        user.email,
        title,
        emailText,
        emailHtml
      );
      return;
    }

    if (finalMode === "both") {
      if (emailText || emailHtml) {
        await emailService.sendMail(
          user.email,
          title,
          emailText,
          emailHtml
        );
      }
      await pushService.sendPush(userId, {title,body,data,});
      return;
    }
  }


  // ⭐ Devamsızlık
  async sendAttendanceWarning(parentId, studentName, dateString) {
    return this.sendAll(
      parentId,
      {
        title: "Devamsızlık Bilgilendirmesi",
        body: `${studentName} ${dateString} tarihinde derse katılmadı.`,
        emailText: `Öğrenciniz ${studentName} ${dateString} tarihinde derse katılmamıştır.`,
        emailHtml: `
          <h3>Devamsızlık Bilgilendirmesi</h3>
          <p><b>Öğrenci:</b> ${studentName}</p>
          <p><b>Tarih:</b> ${dateString}</p>
          <p>Bu tarihte derse katılmamıştır.</p>
        `,
        data: {
          type: 'attendance',
          studentName,
          date: dateString,
        }
      },
      "attendance" //  notificationConfig içindeki key
    );
  }

  // ⭐ Deneme Sonucu
  async sendExamResult(studentId, examTitle, net) {
    return this.sendAll(
      studentId,
      {
        title: "Yeni Deneme Sonucu",
        body: `${examTitle} sonuçlarınız açıklandı! Net: ${net}`,
        emailText: `Sınav: ${examTitle}\nToplam Net: ${net}`,
        emailHtml: `
          <h3>Yeni Deneme Sonucunuz Yayınlandı</h3>
          <p><b>Sınav:</b> ${examTitle}</p>
          <p><b>Toplam Net:</b> ${net}</p>
        `,
        data: {
          type: "exam-result",
          examTitle,
          net: String(net)
        }
      },
      "examResult" //  config anahtarı
    );
  }

  // Etkinlik
  async sendSchedule(userId, text) {
    return this.sendAll(
      userId,
      {
        title: "Yeni Etkinlik",
        body: text,
        emailText: text,
        emailHtml: `
          <h3>Yeni Etkinlik</h3>
          <p>${text}</p>
        `,
        data: { type: "schedule" }
      },
      "schedule"
    );
  }

  async sendAnnouncement(userId, text) {
    const title = "📢 Yeni Duyuru";

    const emailText = `
  Yeni Duyuru

  ${text}

  ---
  Bu mesaj dershane yönetim sistemi tarafından gönderilmiştir.
  Lütfen bu maili yanıtlamayınız.
    `.trim();

    const emailHtml = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:6px;">
        
        <h2 style="color:#1976d2;">📢 Yeni Duyuru</h2>

        <p style="font-size:14px; color:#333; white-space:pre-line;">
          ${text}
        </p>

        <hr style="margin:20px 0;" />

        <p style="font-size:12px; color:#777;">
          Bu mesaj <b>Dershane Yönetim Sistemi</b> tarafından otomatik olarak gönderilmiştir.<br/>
          Lütfen bu maili yanıtlamayınız.
        </p>

      </div>
    </body>
  </html>
    `;

    return this.sendAll(
      userId,
      {
        title,
        body: "Yeni bir duyuru yayınlandı.",
        emailText,
        emailHtml,
        data: { type: "announcement" }
      },
      "announcement"
    );
  }

  //  Öğrenci ilk giriş bilgileri
async sendStudentWelcome(userId, email, password) {
  return this.sendAll(
    userId,
    {
      title: "Öğrenci Hesabınız Oluşturuldu",
      body: "Dershane sistemine giriş bilgileriniz mail adresinize gönderildi.",
      emailText: `
Merhaba,

Öğrenci hesabınız oluşturuldu.

Email: ${email}
Şifre: ${password}

Lütfen ilk girişinizden sonra şifrenizi değiştiriniz.
      `,
      emailHtml: `
        <h3>Öğrenci Hesabınız Oluşturuldu</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Şifre:</b> ${password}</p>
        <p>Lütfen ilk girişinizden sonra şifrenizi değiştiriniz.</p>
      `,
      mode: "email" // 🔥 config’i bypass et
    },
    "welcome" // configKey (kullanılmayacak ama zorunlu)
  );
}

//  Veli ilk giriş bilgileri
async sendParentWelcome(userId, email, password) {
  return this.sendAll(
    userId,
    {
      title: "Veli Hesabınız Oluşturuldu",
      body: "Veli giriş bilgileriniz mail adresinize gönderildi.",
      emailText: `
Merhaba,

Veli hesabınız oluşturuldu.

Email: ${email}
Şifre: ${password}

Sisteme giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.
      `,
      emailHtml: `
        <h3>Veli Hesabınız Oluşturuldu</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Şifre:</b> ${password}</p>
      `,
      mode: "email"
    },
    "welcome"
  );
}

async sendTeacherWelcome(userId, email, password) {
  return this.sendAll(
    userId,
    {
      title: "Öğretmen Hesabınız Oluşturuldu",
      body: "Dershane sistemine giriş bilgileriniz mail adresinize gönderildi.",
      emailText: `
Merhaba,

Öğretmen hesabınız oluşturuldu.

Email: ${email}
Şifre: ${password}

Lütfen ilk girişinizden sonra şifrenizi değiştiriniz.
      `,
      emailHtml: `
        <h3>Öğretmen Hesabınız Oluşturuldu</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Şifre:</b> ${password}</p>
        <p>Lütfen ilk girişinizden sonra şifrenizi değiştiriniz.</p>
      `,
      mode: "email" // 🔥 config bypass
    },
    "welcome"
  );
}



}

module.exports = new NotificationManager();
