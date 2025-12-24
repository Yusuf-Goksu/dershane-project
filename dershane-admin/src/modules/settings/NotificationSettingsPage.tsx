import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Chip,
  Divider
} from "@mui/material";

// --- İKONLAR ---
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'; // Push
import MailIcon from '@mui/icons-material/Mail'; // Mail
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'; // Both
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'; // None
import CampaignIcon from '@mui/icons-material/Campaign'; // Duyuru
import QuizIcon from '@mui/icons-material/Quiz'; // Sınav
import CoPresentIcon from '@mui/icons-material/CoPresent'; // Devamsızlık
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // Takvim
import SettingsIcon from '@mui/icons-material/Settings';

type Mode = "push" | "email" | "both" | "none";

type Setting = {
  key: string;
  mode: Mode;
};

// Her ayar tipi için İkon ve Renk Konfigürasyonu
const keyConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  attendance: { label: "Devamsızlık Bildirimi", icon: <CoPresentIcon />, color: "#d32f2f" },
  examResult: { label: "Deneme Sonucu", icon: <QuizIcon />, color: "#1976d2" },
  announcement: { label: "Duyuru / Haber", icon: <CampaignIcon />, color: "#ed6c02" },
  schedule: { label: "Etkinlik / Takvim", icon: <CalendarMonthIcon />, color: "#9c27b0" },
};

const allowedKeys = ["attendance", "examResult", "announcement", "schedule"];

// Seçeneklerin Görsel Karşılıkları
const modeOptions = [
    { value: "push", label: "Sadece Bildirim", icon: <NotificationsActiveIcon fontSize="small" /> },
    { value: "email", label: "Sadece E-Posta", icon: <MailIcon fontSize="small" /> },
    { value: "both", label: "Bildirim + E-Posta", icon: <AllInclusiveIcon fontSize="small" /> },
    { value: "none", label: "Kapalı", icon: <NotificationsOffIcon fontSize="small" /> },
];

const NotificationSettingsPage = () => {
  const [rows, setRows] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "error";
  }>({ open: false, msg: "", type: "success" });

  const normalizedRows = useMemo(() => {
    const map = new Map<string, Setting>();
    rows.forEach((r) => map.set(r.key, r));
    return allowedKeys.map((k) => map.get(k) || { key: k, mode: "push" });
  }, [rows]);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/notification-settings");
      setRows(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ayarlar alınamadı");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, mode: Mode) => {
    // Optimistic UI Update
    setRows((prev) =>
      prev.some((x) => x.key === key)
        ? prev.map((x) => (x.key === key ? { ...x, mode } : x))
        : [...prev, { key, mode }]
    );

    try {
      await api.put(`/admin/notification-settings/${key}`, { mode });
      setSnack({ open: true, msg: "Ayar başarıyla güncellendi", type: "success" });
    } catch (err: any) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Kaydetme başarısız",
        type: "error",
      });
      fetchSettings(); // Rollback
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" /> Bildirim Yapılandırması
        </Typography>
        <Typography variant="body1" color="text.secondary">
            Sistem tarafından üretilen otomatik mesajların veli ve öğrencilere hangi kanaldan iletileceğini yönetin.
        </Typography>
      </Box>

      {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress />
          </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* SETTINGS GRID */}
      <Grid container spacing={3}>
        {normalizedRows.map((r) => {
            const config = keyConfig[r.key] || { label: r.key, icon: <SettingsIcon />, color: 'grey' };
            const currentMode = r.mode as Mode;
            
            return (
                <Grid item xs={12} md={6} key={r.key}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 3,
                            transition: 'all 0.2s',
                            '&:hover': {
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderColor: config.color
                            }
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: `${config.color}15`, color: config.color, width: 48, height: 48 }}>
                                        {config.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {config.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Sistem Kodu: {r.key}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                {/* Mevcut Durum Göstergesi (Chip) */}
                                <Chip 
                                    size="small"
                                    label={modeOptions.find(o => o.value === currentMode)?.label}
                                    icon={currentMode === 'none' ? undefined : modeOptions.find(o => o.value === currentMode)?.icon as any}
                                    color={currentMode === 'none' ? 'default' : 'primary'}
                                    variant={currentMode === 'none' ? 'outlined' : 'filled'}
                                    sx={{ fontWeight: 500 }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <FormControl fullWidth size="small">
                                <InputLabel>İletişim Kanalı</InputLabel>
                                <Select
                                    value={currentMode}
                                    label="İletişim Kanalı"
                                    onChange={(e) => updateSetting(r.key, e.target.value as Mode)}
                                >
                                    {modeOptions.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value} sx={{ display: 'flex', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                                {opt.icon}
                                            </Box>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                        </CardContent>
                    </Card>
                </Grid>
            );
        })}
      </Grid>

      {/* INFO FOOTER */}
      <Alert severity="info" variant="outlined" sx={{ mt: 4, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">Önemli Bilgi</Typography>
          <Typography variant="body2">
             Hesap oluşturma, şifre sıfırlama gibi güvenlik bildirimleri bu ayarlardan etkilenmez ve her zaman <b>E-Posta</b> yoluyla gönderilir.
          </Typography>
      </Alert>

      {/* SNACKBAR */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.type}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettingsPage;