import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  InputAdornment,
  Tooltip,
  Chip,
} from "@mui/material";

// --- İKONLAR ---
import SchoolIcon from "@mui/icons-material/School"; // Öğrenci/Başlık
import PersonAddIcon from "@mui/icons-material/PersonAdd"; // Ekleme
import PersonIcon from "@mui/icons-material/Person"; // İsim input
import EmailIcon from "@mui/icons-material/Email"; // Email input
import LockIcon from "@mui/icons-material/Lock"; // Şifre input
import ClassIcon from "@mui/icons-material/Class"; // Sınıf seçimi
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle"; // Veli seçimi
import SearchIcon from "@mui/icons-material/Search"; // Arama
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"; // Silme

type Student = {
  _id: string;
  name: string;
  email: string;
  className: string;
};

type ClassItem = {
  _id: string;
  name: string;
};

type ParentItem = {
  _id: string;
  name: string;
  email: string;
};

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [parents, setParents] = useState<ParentItem[]>([]);

  // form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");
  const [parentId, setParentId] = useState("");

  // ui
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 Arama State
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 🔄 fetch
  const fetchAll = async () => {
    try {
      const [sRes, cRes, pRes] = await Promise.all([
        api.get("/admin/students"),
        api.get("/classes"),
        api.get("/admin/parents"),
      ]);

      setStudents(sRes.data);
      setClasses(cRes.data);
      setParents(pRes.data);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🔍 FİLTRELEME
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.className.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // ➕ create
  const createStudent = async () => {
    setError("");
    setMsg("");

    if (!name || !email || !classId) {
      setError("Ad, email ve sınıf seçimi zorunludur.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    try {
      const res = await api.post("/admin/students", {
        name,
        email,
        password,
        classId,
        parentId: parentId || undefined,
      });

      setMsg(
        res.data.autoPassword
          ? `Öğrenci oluşturuldu! Otomatik şifre: ${res.data.autoPassword}`
          : "Öğrenci başarıyla eklendi."
      );

      setName("");
      setEmail("");
      setPassword("");
      setClassId("");
      setParentId("");

      fetchAll();
      setTimeout(() => setMsg(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Öğrenci eklenirken hata oluştu.");
    }
  };

  // ❌ delete logic
  const openDelete = (s: Student) => {
    setSelectedStudent(s);
    setDeleteOpen(true);
  };

  const deleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await api.delete(`/admin/students/${selectedStudent._id}`);
      setMsg("Öğrenci kaydı silindi.");
      setDeleteOpen(false);
      setSelectedStudent(null);
      fetchAll();
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Silme işlemi başarısız.");
    }
  };

  // Avatar Rengi Üretici
  const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", pb: 5 }}>
      
      {/* --- HEADER --- */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
            <SchoolIcon fontSize="large" />
        </Avatar>
        <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Öğrenci Yönetimi
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sınıf atamaları, yeni kayıtlar ve öğrenci listesi.
            </Typography>
        </Box>
      </Box>

      {/* --- EKLEME KARTI --- */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="info" /> Yeni Öğrenci Kaydı
          </Typography>

          <Grid container spacing={2}>
            {/* 1. Satır: İsim, Email, Şifre */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="password"
                label="Şifre (Boş bırakılabilir)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                }}
              />
            </Grid>

            {/* 2. Satır: Sınıf, Veli, Buton */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Sınıf Seç"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><ClassIcon color="action" /></InputAdornment>,
                }}
              >
                {classes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Veli Ata (Opsiyonel)"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SupervisedUserCircleIcon color="action" /></InputAdornment>,
                }}
              >
                <MenuItem value="">Veli Yok</MenuItem>
                {parents.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={createStudent}
                color="info"
                sx={{ height: "56px", borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
                startIcon={<PersonAddIcon />}
              >
                Öğrenciyi Kaydet
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            {error && <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>{error}</Alert>}
            {msg && <Alert severity="success" onClose={() => setMsg("")} sx={{ borderRadius: 2 }}>{msg}</Alert>}
          </Box>
        </CardContent>
      </Card>

      {/* --- ARAMA KUTUSU --- */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
            placeholder="Öğrenci adı, email veya sınıf ara..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: 350 }, bgcolor: 'white' }}
            InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                sx: { borderRadius: 2 }
            }}
        />
      </Box>

      {/* --- TABLO --- */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>ÖĞRENCİ</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>İLETİŞİM</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>SINIF</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", color: "text.secondary" }}>İŞLEMLER</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((s) => {
              const avatarColor = stringToColor(s.name);
              return (
                <TableRow key={s._id} hover sx={{ transition: "0.2s" }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: avatarColor, width: 40, height: 40, fontSize: '1rem' }}>
                            {s.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body1" fontWeight="500">
                            {s.name}
                        </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                        {s.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={s.className} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        icon={<ClassIcon style={{fontSize: 14}} />}
                        sx={{ fontWeight: 'bold', bgcolor: 'primary.50', border: 'none' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Öğrenciyi Sil" arrow>
                        <IconButton 
                            onClick={() => openDelete(s)} 
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
                        >
                            <DeleteOutlineIcon />
                        </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}

            {!filteredStudents.length && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                     <SearchIcon sx={{ fontSize: 40, mb: 1 }} />
                     <Typography color="text.secondary">
                         {students.length === 0 ? "Henüz kayıtlı öğrenci yok." : "Arama kriterlerine uygun öğrenci bulunamadı."}
                     </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* --- SİLME DIALOG --- */}
      <Dialog 
        open={deleteOpen} 
        onClose={() => setDeleteOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, padding: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
            <DeleteOutlineIcon /> Öğrenciyi Sil
        </DialogTitle>
        <DialogContent>
          <Typography>
            <b>{selectedStudent?.name}</b> isimli öğrenciyi silmek istediğinize emin misiniz? <br/>
            <Typography component="span" variant="caption" color="text.secondary">
                Bu işlem geri alınamaz ve öğrencinin sınav/devamsızlık verilerini etkileyebilir.
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: 'text.secondary' }}>Vazgeç</Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={deleteStudent}
            sx={{ borderRadius: 2 }}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsPage;