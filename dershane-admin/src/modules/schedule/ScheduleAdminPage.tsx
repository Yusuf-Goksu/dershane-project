import { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api";
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Paper,
  Grid,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Tooltip,
  CircularProgress
} from "@mui/material";

// --- İKONLAR ---
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ClassIcon from '@mui/icons-material/Class';
import SubjectIcon from '@mui/icons-material/Subject';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';

// --- TİPLER ---
type ScheduleItem = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  type: "lesson" | "exam" | "meeting";
  classId?: { _id: string; name: string };
};

type ClassItem = {
  _id: string;
  name: string;
};

// --- RENK VE İKON KONFİGÜRASYONU ---
const typeConfig: Record<
  string,
  { label: string; color: string; bgcolor: string; icon: React.ReactNode }
> = {
  lesson: { 
    label: "Ders", 
    color: "#1976d2", 
    bgcolor: "#e3f2fd", 
    icon: <SchoolIcon fontSize="small" /> 
  }, 
  exam: { 
    label: "Sınav", 
    color: "#d32f2f", 
    bgcolor: "#ffebee", 
    icon: <AssignmentIcon fontSize="small" /> 
  },
  meeting: { 
    label: "Toplantı", 
    color: "#ed6c02", 
    bgcolor: "#fff3e0", 
    icon: <GroupsIcon fontSize="small" /> 
  },
};

const ScheduleAdminPage = () => {
  // --- STATE ---
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtre State
  const [filterClass, setFilterClass] = useState("");
  const [filterType, setFilterType] = useState("");

  // Modal State
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    type: "lesson" as "lesson" | "exam" | "meeting",
    classId: ""
  });

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // --- API ---
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resSchedule, resClasses] = await Promise.all([
         api.get("/schedule"),
         api.get("/classes")
      ]);
      
      // Tarihe göre sıralayalım (Yakın tarih en üstte)
      const sortedItems = resSchedule.data.sort((a: ScheduleItem, b: ScheduleItem) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setItems(sortedItems);
      setClasses(resClasses.data);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- ACTIONS ---
  const handleInputChange = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createItem = async () => {
    if (!formData.title || !formData.date) {
      setError("Başlık ve tarih alanları zorunludur.");
      return;
    }

    try {
      await api.post("/schedule", {
        ...formData,
        classId: formData.classId || null,
      });

      // Formu sıfırla
      setFormData({
        title: "", description: "", date: "", type: "lesson", classId: ""
      });
      setError("");
      setMsg("Etkinlik başarıyla eklendi.");
      setOpen(false);
      fetchAll();
      
      // Mesajı 3 saniye sonra kaldır
      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Kayıt başarısız");
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;
    try {
        await api.delete(`/schedule/${deleteTarget._id}`);
        setDeleteTarget(null);
        fetchAll();
        setMsg("Etkinlik silindi.");
        setTimeout(() => setMsg(""), 3000);
    } catch (e) { setError("Silme başarısız"); }
  };

  // --- FILTER LOGIC ---
  const filteredItems = useMemo(() => {
      return items.filter(item => {
          const matchClass = filterClass ? item.classId?._id === filterClass : true;
          const matchType = filterType ? item.type === filterType : true;
          return matchClass && matchType;
      });
  }, [items, filterClass, filterType]);

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', pb: 5 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Etkinlik Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary">Akademik takvim ve duyurular.</Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 2 }}
        >
            Yeni Etkinlik
        </Button>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 3 }}>{msg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* FILTER BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ color: 'action.active', mr: 1, display: 'flex', alignItems: 'center' }}>
                <FilterListIcon />
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Tür Filtrele</InputLabel>
                <Select
                    value={filterType}
                    label="Tür Filtrele"
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="lesson">Ders</MenuItem>
                    <MenuItem value="exam">Sınav</MenuItem>
                    <MenuItem value="meeting">Toplantı</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sınıf Filtrele</InputLabel>
                <Select
                    value={filterClass}
                    label="Sınıf Filtrele"
                    onChange={(e) => setFilterClass(e.target.value)}
                >
                    <MenuItem value="">Tümü</MenuItem>
                    {classes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
             
             {/* Temizle Butonu */}
             {(filterClass || filterType) && (
                 <Button onClick={() => { setFilterClass(""); setFilterType(""); }} size="small">
                    Filtreleri Temizle
                 </Button>
             )}
        </Stack>
      </Paper>

      {/* TIMELINE LISTE GÖRÜNÜMÜ */}
      <Stack spacing={2}>
        {filteredItems.map((item) => {
            const conf = typeConfig[item.type];
            const dateObj = new Date(item.date);

            return (
                <Card 
                    key={item._id} 
                    elevation={0}
                    sx={{ 
                        border: '1px solid #eee', 
                        borderLeft: `6px solid ${conf.color}`, // Sol kenar renk vurgusu
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                    }}
                >
                    <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pb: '16px !important' }}>
                        
                        {/* Sol Taraf: Tarih Kutusu */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: '#f5f5f5',
                            borderRadius: 2,
                            minWidth: 70,
                            height: 70,
                            border: '1px solid #e0e0e0'
                        }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                                {dateObj.toLocaleDateString('tr-TR', { month: 'short' })}
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ lineHeight: 1 }}>
                                {dateObj.getDate()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {dateObj.toLocaleDateString('tr-TR', { weekday: 'short' })}
                            </Typography>
                        </Box>

                        {/* Orta: İçerik */}
                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" fontSize="1.1rem" fontWeight="bold">
                                    {item.title}
                                </Typography>
                                <Chip 
                                    label={conf.label} 
                                    icon={conf.icon as any}
                                    size="small" 
                                    sx={{ bgcolor: conf.bgcolor, color: conf.color, fontWeight: 'bold' }} 
                                />
                            </Box>
                            
                            <Stack direction="row" spacing={3} sx={{ mb: 1.5, color: 'text.secondary' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTimeIcon fontSize="small" />
                                    <Typography variant="body2" fontWeight="500">
                                        {dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                                {item.classId && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ClassIcon fontSize="small" />
                                        <Typography variant="body2">{item.classId.name}</Typography>
                                    </Box>
                                )}
                            </Stack>

                            {item.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ 
                                    bgcolor: '#fafafa', 
                                    p: 1.5, 
                                    borderRadius: 1,
                                    border: '1px dashed #e0e0e0' 
                                }}>
                                    {item.description}
                                </Typography>
                            )}
                        </Box>

                        {/* Sağ: Sil Butonu */}
                        <Tooltip title="Etkinliği Sil">
                            <IconButton onClick={() => setDeleteTarget(item)} size="small" color="default">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </CardContent>
                </Card>
            );
        })}

        {!loading && filteredItems.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary', bgcolor: '#fafafa', borderRadius: 2, border: '1px dashed #ddd' }}>
                <EventIcon sx={{ fontSize: 60, opacity: 0.2, mb: 1 }} />
                <Typography variant="h6" color="text.secondary">Kayıt Bulunamadı</Typography>
                <Typography variant="body2">
                    Filtrelerinize uygun bir etkinlik yok veya henüz eklenmemiş.
                </Typography>
            </Box>
        )}
        
        {loading && (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                 <CircularProgress />
             </Box>
        )}
      </Stack>

      {/* 🔹 EKLEME DIALOG (MODAL) */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon color="primary" /> Yeni Etkinlik
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
                <TextField
                    label="Etkinlik Başlığı"
                    placeholder="Örn: Veli Toplantısı"
                    fullWidth
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SubjectIcon color="action" /></InputAdornment>,
                    }}
                />
            </Grid>
            
            <Grid item xs={12} sm={6}>
                 <TextField
                    type="datetime-local"
                    label="Tarih ve Saat"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                />
            </Grid>
            
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel>Etkinlik Türü</InputLabel>
                    <Select 
                        value={formData.type} 
                        label="Etkinlik Türü"
                        onChange={(e) => handleInputChange("type", e.target.value)}
                    >
                        <MenuItem value="lesson">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SchoolIcon fontSize="small" color="primary"/> Ders</Box>
                        </MenuItem>
                        <MenuItem value="exam">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AssignmentIcon fontSize="small" color="error"/> Sınav</Box>
                        </MenuItem>
                        <MenuItem value="meeting">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GroupsIcon fontSize="small" color="warning"/> Toplantı</Box>
                        </MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            
            <Grid item xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Sınıf (Opsiyonel)</InputLabel>
                    <Select
                        value={formData.classId}
                        label="Sınıf (Opsiyonel)"
                        onChange={(e) => handleInputChange("classId", e.target.value)}
                        startAdornment={<InputAdornment position="start"><ClassIcon fontSize="small" /></InputAdornment>}
                    >
                        <MenuItem value="">Genel (Tüm Sınıflar)</MenuItem>
                        {classes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            
            <Grid item xs={12}>
                 <TextField
                    label="Açıklama / Notlar"
                    multiline
                    rows={3}
                    fullWidth
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detayları buraya yazabilirsiniz..."
                    InputProps={{
                        startAdornment: <InputAdornment position="start" sx={{ mt: 1.5 }}><DescriptionIcon color="action" /></InputAdornment>,
                    }}
                />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Vazgeç</Button>
          <Button variant="contained" onClick={createItem} disableElevation>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 SİLME ONAY DIALOGU */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Etkinlik Silinecek</DialogTitle>
        <DialogContent>
          <Typography>
             <b>"{deleteTarget?.title}"</b> etkinliğini silmek istediğinize emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>İptal</Button>
          <Button color="error" variant="contained" onClick={deleteItem} autoFocus>
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleAdminPage;