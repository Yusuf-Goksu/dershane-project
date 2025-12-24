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
  Alert,
  Chip,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  useTheme,
} from "@mui/material";

// --- İKONLAR ---
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search"; // ✅ YENİ EKLENDİ

type Parent = {
  _id: string;
  name: string;
  email: string;
  students: {
    _id: string;
    name?: string;
    email?: string;
  }[];
};

const ParentsPage = () => {
  const theme = useTheme();
  const [parents, setParents] = useState<Parent[]>([]);

  // form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ui
  const [searchQuery, setSearchQuery] = useState(""); // ✅ ARAMA STATE'İ
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  const fetchParents = async () => {
    try {
      const res = await api.get("/admin/parents");
      setParents(res.data);
    } catch (err) {
      console.error("Veri çekme hatası", err);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  // 🔥 FİLTRELEME VE SIRALAMA (GÜNCELLENDİ)
  const filteredParents = useMemo(() => {
    // 1. Önce Arama Filtresi
    const filtered = parents.filter((p) => {
      const query = searchQuery.toLowerCase();
      
      // Veli adı, Veli emaili veya Öğrenci adlarından herhangi biri eşleşiyor mu?
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesEmail = p.email.toLowerCase().includes(query);
      const matchesStudent = p.students.some(s => s.name?.toLowerCase().includes(query));

      return matchesName || matchesEmail || matchesStudent;
    });

    // 2. Sonra Sıralama (Öğrencisi olmayanlar üstte kalsın mantığı veya alfabetik)
    return filtered.sort((a, b) => {
      const aCount = a.students?.length || 0;
      const bCount = b.students?.length || 0;

      // İsterseniz burada alfabetik sıralama da yapabilirsiniz, 
      // şimdilik mevcut mantığı (öğrencisizler üstte) koruyorum:
      if (aCount === 0 && bCount > 0) return -1;
      if (aCount > 0 && bCount === 0) return 1;
      return 0; 
    });
  }, [parents, searchQuery]);

  // ➕ create
  const createParent = async () => {
    setError("");
    setMsg("");

    if (!name || !email) {
      setError("Ad ve email zorunludur.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Lütfen geçerli bir email adresi giriniz.");
      return;
    }

    try {
      const res = await api.post("/admin/parents", {
        name,
        email,
        password,
      });

      setMsg(
        res.data.autoPassword
          ? `Kayıt Başarılı! Otomatik şifre: ${res.data.autoPassword}`
          : "Veli başarıyla sisteme eklendi."
      );

      setName("");
      setEmail("");
      setPassword("");
      fetchParents();

      setTimeout(() => setMsg(""), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Veli eklenirken bir hata oluştu.");
    }
  };

  // ❌ delete logic
  const openDelete = (p: Parent) => {
    setSelectedParent(p);
    setDeleteOpen(true);
  };

  const deleteParent = async () => {
    if (!selectedParent) return;

    try {
      await api.delete(`/admin/parents/${selectedParent._id}`);
      setMsg("Veli kaydı silindi.");
      setDeleteOpen(false);
      setSelectedParent(null);
      fetchParents();
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Silme işlemi başarısız oldu.");
    }
  };

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
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <FamilyRestroomIcon fontSize="large" />
        </Avatar>
        <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
            Veli Yönetimi
            </Typography>
            <Typography variant="body1" color="text.secondary">
            Sisteme yeni veli ekleyebilir ve mevcut kayıtları yönetebilirsiniz.
            </Typography>
        </Box>
      </Box>

      {/* --- FORM KARTI --- */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" /> Yeni Veli Ekle
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Ad Soyad"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email Adresi"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Şifre (Boş bırakılabilir)"
                variant="outlined"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={createParent}
                sx={{ height: "56px", borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
                startIcon={<PersonAddIcon />}
              >
                Kaydet
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            {error && (
                <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
                {error}
                </Alert>
            )}
            {msg && (
                <Alert severity="success" onClose={() => setMsg("")} sx={{ borderRadius: 2 }}>
                {msg}
                </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* --- ARAMA ALANI (YENİ) --- */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
            placeholder="Veli adı, email veya öğrenci adı ara..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: 350 }, bgcolor: 'white' }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
                sx: { borderRadius: 2 }
            }}
        />
      </Box>

      {/* --- TABLO LİSTESİ --- */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>VELİ BİLGİSİ</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>İLETİŞİM</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "text.secondary" }}>BAĞLI ÖĞRENCİLER</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", color: "text.secondary" }}>İŞLEMLER</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParents.map((p) => {
              const hasStudents = p.students.length > 0;
              const avatarColor = stringToColor(p.name);

              return (
                <TableRow
                  key={p._id}
                  hover
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    backgroundColor: !hasStudents ? "rgba(255, 152, 0, 0.04)" : "inherit",
                    transition: "0.2s",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: avatarColor, width: 40, height: 40, fontSize: '1rem' }}>
                            {p.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body1" fontWeight="500">
                            {p.name}
                        </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                        {p.email}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {hasStudents ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {p.students.map((s) => (
                          <Chip
                            key={s._id}
                            icon={<SchoolIcon style={{ fontSize: 16 }} />}
                            label={s.name || "İsimsiz Öğrenci"}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ bgcolor: 'primary.50', border: 'none', fontWeight: 500 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Chip
                        label="Öğrenci Kaydı Yok"
                        color="warning"
                        size="small"
                        sx={{ borderRadius: 1, fontWeight: 'bold' }}
                      />
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Veliyi Sil" arrow>
                        <IconButton 
                            onClick={() => openDelete(p)} 
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
                        >
                            <DeleteOutlineIcon />
                        </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Arama Sonucu Yoksa */}
            {filteredParents.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                     <SearchIcon sx={{ fontSize: 40, mb: 1 }} />
                     <Typography color="text.secondary">
                         {parents.length === 0 ? "Henüz kayıtlı veli yok." : "Arama kriterlerine uygun kayıt bulunamadı."}
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
            <DeleteOutlineIcon /> Veliyi Sil
        </DialogTitle>
        <DialogContent>
          <Typography>
            <b>{selectedParent?.name}</b> isimli veliyi silmek istediğinize emin misiniz? <br/>
            <Typography component="span" variant="caption" color="text.secondary">
                Bu işlem geri alınamaz ve bağlı öğrenci ilişkilerini etkileyebilir.
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: 'text.secondary' }}>Vazgeç</Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={deleteParent}
            sx={{ borderRadius: 2 }}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentsPage;