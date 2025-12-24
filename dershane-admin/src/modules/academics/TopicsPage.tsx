import { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
  ListItemAvatar
} from "@mui/material";

// --- İKONLAR ---
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';

import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useSnackbar } from "../../hooks/useSnackbar";
import { getApiError } from "../../utils/getApiError";

type Subject = { _id: string; name: string };

type Topic = {
  _id: string;
  name: string;
  gradeLevel: number;
  order: number;
  subjectId: Subject;
};

const TopicsPage = () => {
  // --- STATE ---
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtre State
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState<number | "">("");
  const [isFetched, setIsFetched] = useState(false); // Listele butonuna basıldı mı?

  // Form State
  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState("");
  const [order, setOrder] = useState<number | "">("");
  // Form içindeki selectler (Filtreden bağımsız değiştirilebilsin diye)
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formGradeLevel, setFormGradeLevel] = useState<number | "">("");
  
  const [error, setError] = useState("");

  // Silme State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const { snack, show, close } = useSnackbar();

  // --- API ---
  useEffect(() => {
    api.get("/subjects").then((res) => {
        // Dersleri alfabetik sırala
        setSubjects(res.data.sort((a: Subject, b: Subject) => a.name.localeCompare(b.name)));
    });
  }, []);

  const fetchTopics = async () => {
    if (!filterSubject || !filterGrade) return;
    
    setLoading(true);
    setIsFetched(true);
    try {
      const res = await api.get(`/topics?subjectId=${filterSubject}&gradeLevel=${filterGrade}`);
      // Sıraya (Order) göre diz
      const sorted = res.data.sort((a: Topic, b: Topic) => a.order - b.order);
      setTopics(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- EYLEMLER ---
  const handleOpenAdd = () => {
      // Form açıldığında, filtredeki değerleri varsayılan olarak ata (UX Kolaylığı)
      setFormSubjectId(filterSubject || "");
      setFormGradeLevel(filterGrade || "");
      // Sıradaki order numarasını tahmin et (Mevcutların en büyüğü + 1)
      const maxOrder = topics.length > 0 ? Math.max(...topics.map(t => t.order)) : 0;
      setOrder(maxOrder + 1);
      
      setName("");
      setError("");
      setOpenAdd(true);
  };

  const createTopic = async () => {
    if (!formSubjectId || !formGradeLevel || !name.trim() || !order) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      await api.post("/topics", {
        subjectId: formSubjectId,
        gradeLevel: formGradeLevel,
        name: name.trim(),
        order,
      });

      show("Konu başarıyla eklendi", "success");
      setOpenAdd(false);
      
      // Eğer eklenen konu şu anki listeye uyuyorsa listeyi yenile
      if (formSubjectId === filterSubject && formGradeLevel === filterGrade) {
          fetchTopics();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Konu eklenemedi");
    }
  };

  const openDelete = (topic: Topic) => {
    setSelectedTopic(topic);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const deleteTopic = async () => {
    if (!selectedTopic?._id) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await api.delete(`/topics/${selectedTopic._id}`);

      show("Konu silindi", "success");
      setDeleteOpen(false);
      setSelectedTopic(null);
      fetchTopics();
    } catch (err: any) {
      setDeleteError(getApiError(err, "Konu silinemedi"));
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- FİLTRELEME (Local Search) ---
  const filteredList = useMemo(() => {
      return topics.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [topics, searchTerm]);

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Konu Havuzu</Typography>
            <Typography variant="body2" color="text.secondary">
                Müfredat konularını sınıf ve ders bazlı yönetin.
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenAdd}
            sx={{ borderRadius: 2 }}
        >
            Yeni Konu Ekle
        </Button>
      </Box>

      {/* FILTER BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <FilterListIcon color="action" />
            
            <FormControl fullWidth size="small">
                <InputLabel>Ders Seçiniz</InputLabel>
                <Select
                    value={filterSubject}
                    label="Ders Seçiniz"
                    onChange={(e) => setFilterSubject(e.target.value)}
                >
                    {subjects.map((s) => (
                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth size="small">
                <InputLabel>Sınıf Seviyesi</InputLabel>
                <Select
                    value={filterGrade}
                    label="Sınıf Seviyesi"
                    onChange={(e) => setFilterGrade(e.target.value ? Number(e.target.value) : "")}
                >
                    {[9, 10, 11, 12].map((g) => (
                        <MenuItem key={g} value={g}>{g}. Sınıf</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button 
                variant="outlined" 
                onClick={fetchTopics} 
                disabled={!filterSubject || !filterGrade || loading}
                sx={{ minWidth: 100 }}
            >
                {loading ? "..." : "Listele"}
            </Button>
        </Stack>
      </Paper>

      {/* DATA LIST AREA */}
      {isFetched && (
          <Paper sx={{ width: '100%', borderRadius: 2, border: '1px solid #eee', p: 0 }} elevation={0}>
            {/* Search within results */}
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <TextField
                    fullWidth
                    placeholder="Listelenen konular içinde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon color="disabled" /></InputAdornment>
                    }}
                />
            </Box>

            <List disablePadding>
                {filteredList.map((t, index) => (
                    <Box key={t._id}>
                        <ListItem 
                            secondaryAction={
                                <Tooltip title="Sil">
                                    <IconButton edge="end" color="error" onClick={() => openDelete(t)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            }
                            sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'bold', fontSize: 14 }}>
                                    {t.order}
                                </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText 
                                primary={
                                    <Typography fontWeight="500">{t.name}</Typography>
                                }
                                secondary={
                                    <Stack direction="row" spacing={1} component="span" sx={{ mt: 0.5 }}>
                                        <Chip 
                                            label={`${t.gradeLevel}. Sınıf`} 
                                            size="small" 
                                            icon={<SchoolIcon fontSize="small" />} 
                                            variant="outlined" 
                                        />
                                        <Chip 
                                            label={t.subjectId.name} 
                                            size="small" 
                                            icon={<CategoryIcon fontSize="small" />} 
                                            variant="outlined" 
                                        />
                                    </Stack>
                                }
                            />
                        </ListItem>
                        {index < filteredList.length - 1 && <Divider component="li" />}
                    </Box>
                ))}

                {!loading && filteredList.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        <CategoryIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                        <Typography>Bu kriterlere uygun konu bulunamadı.</Typography>
                    </Box>
                )}
            </List>
          </Paper>
      )}

      {/* 🟢 CREATE DIALOG */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Yeni Konu Ekle
            <IconButton onClick={() => setOpenAdd(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                
                {error && <Alert severity="error">{error}</Alert>}

                <Stack direction="row" spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>Ders</InputLabel>
                        <Select
                            value={formSubjectId}
                            label="Ders"
                            onChange={(e) => setFormSubjectId(e.target.value)}
                        >
                            {subjects.map((s) => (
                                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Sınıf</InputLabel>
                        <Select
                            value={formGradeLevel}
                            label="Sınıf"
                            onChange={(e) => setFormGradeLevel(e.target.value ? Number(e.target.value) : "")}
                        >
                            {[9, 10, 11, 12].map((g) => (
                                <MenuItem key={g} value={g}>{g}. Sınıf</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

                <TextField
                    label="Konu Adı"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Türev Alma Kuralları"
                />

                <TextField
                    label="Sıralama (Order)"
                    type="number"
                    fullWidth
                    inputProps={{ min: 1 }}
                    value={order}
                    onChange={(e) => setOrder(e.target.value ? Number(e.target.value) : "")}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SortIcon color="action" /></InputAdornment>,
                    }}
                    helperText="Konunun müfredattaki sırasını belirler."
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAdd(false)} color="inherit">Vazgeç</Button>
            <Button onClick={createTopic} variant="contained" disableElevation>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 DELETE CONFIRMATION */}
      <ConfirmDialog
        open={deleteOpen}
        title="Konu Silinsin mi?"
        description={
            selectedTopic
              ? `"${selectedTopic.name}" konusu silinecek. Buna bağlı ilerleyiş kayıtları ve soru bankası verileri etkilenebilir.`
              : ""
          }
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteTopic}
      />

      {/* SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={close}>
        <Alert onClose={close} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TopicsPage;