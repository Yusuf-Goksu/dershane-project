import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Paper, 
  InputAdornment, 
  CircularProgress,
  Container
} from "@mui/material";

// İkonları eklemek profesyonel bir hava katar
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School'; // Logo niyetine

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // UX için loading state'i

  const handleLogin = async () => {
    // Boş alan kontrolü
    if(!email || !password) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setLoading(true); // Yükleniyor...
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      if (user.role !== "admin") {
        setError("Bu panel sadece admin yetkisi olanlar içindir.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Giriş başarısız, bilgilerinizi kontrol edin."
      );
    } finally {
      setLoading(false); // İşlem bitti (başarılı veya hatalı)
    }
  };

  // Enter tuşuna basınca giriş yapmayı tetikler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh", // Tüm ekranı kapla
        display: "flex",
        alignItems: "center", // Dikey ortala
        justifyContent: "center", // Yatay ortala
        backgroundColor: "#f0f2f5", // Hafif gri, modern arka plan
        padding: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={6} // Kart gölgesi (derinlik hissi)
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3, // Köşeleri yumuşat
          }}
        >
          {/* Logo / İkon Alanı */}
          <Box 
            sx={{ 
              backgroundColor: '#1976d2', // Ana renk
              borderRadius: '50%', 
              padding: 1.5, 
              marginBottom: 2,
              display: 'flex'
            }}
          >
            <SchoolIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>

          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
            Yönetici Girişi
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Dershane Yönetim Paneli
          </Typography>

          <Box component="form" sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="E-posta Adresi"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              // İkon Ekleme
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Şifre"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Hata Mesajı Alanı - Yeri sabit kalsın diye minHeight */}
            <Box sx={{ minHeight: '24px', mt: 1 }}>
                {error && (
                <Typography color="error" variant="body2" align="center">
                    {error}
                </Typography>
                )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large" // Daha büyük, tıklanabilir buton
              onClick={handleLogin}
              disabled={loading} // Yüklenirken tıklamayı engelle
              sx={{ mt: 2, mb: 2, height: 48, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Giriş Yap"}
            </Button>
            
            {/* Alt Footer Linki (Opsiyonel) */}
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 2 }}>
                Şifrenizi mi unuttunuz? <span style={{color: '#1976d2', cursor: 'pointer'}}>Sıfırla</span>
            </Typography>

          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;