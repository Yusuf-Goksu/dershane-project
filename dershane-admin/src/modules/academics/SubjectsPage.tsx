import { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useSnackbar } from "../../hooks/useSnackbar";
import { getApiError } from "../../utils/getApiError";
import {
  Box,
  Button,
  TextField,
  Typography,
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
  InputAdornment,
  Avatar,
  ListItemAvatar,
  Tooltip,
  Divider
} from "@mui/material";

// --- İKONLAR ---
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Kitap İkonu
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

type Subject = {
  _id: string;
  name: string;
};

// Avatar renk üreteci
function stringToColor(string: string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

const SubjectsPage = () => {
  // --- STATE ---
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Silme State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { snack, show, close } = useSnackbar();

  // --- API ---
  const fetchSubjects = async () => {
    setLoading(true);
    try {
        const res = await api.get("/subjects");
        // Alfabetik sıralama
        const sorted = res.data.sort((a: Subject, b: Subject) => a.name.localeCompare(b.name));
        setSubjects(sorted);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // --- ACTIONS ---
  const handleCloseAdd = () => {
      setOpenAdd(false);
      setName("");
      setError("");
  };

  const createSubject = async () => {
    if (!name.trim()) {
      setError("Ders adı boş bırakılamaz.");
      return;
    }

    try {
      await api.post("/subjects", { name });
      
      show("Ders başarıyla eklendi", "success");
      handleCloseAdd();
      fetchSubjects();
    } catch (err: any) {
      setError(err.response?.data?.message || "Ders eklenemedi");
    }
  };

  const openDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const deleteSubject = async () => {
    if (!selectedSubject?._id) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await api.delete(`/subjects/${selectedSubject._id}`);

      show("Ders silindi", "success");
      setDeleteOpen(false);
      setSelectedSubject(null);
      fetchSubjects();
    } catch (err: any) {
      setDeleteError(getApiError(err, "Ders silinemedi. Müfredatta veya sorularda kullanılıyor olabilir."));
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- FILTER ---
  const filteredSubjects = useMemo(() => {
      return subjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [subjects, searchTerm]);

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Ders Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary">
                Sisteme kayıtlı {subjects.length} ders bulunuyor.
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenAdd(true)}
            sx={{ borderRadius: 2 }}
        >
            Yeni Ders Ekle
        </Button>
      </Box>

      {/* SEARCH BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
          <TextField
            fullWidth
            placeholder="Ders ara (Örn: Matematik)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
            }}
            size="small"
          />
      </Paper>

      {/* LISTE */}
      <Paper sx={{ width: '100%', borderRadius: 2, border: '1px solid #eee' }} elevation={0}>
        <List disablePadding>
            {filteredSubjects.map((s, index) => (
                <Box key={s._id}>
                    <ListItem 
                        secondaryAction={
                            <Tooltip title="Dersi Sil">
                                <IconButton edge="end" color="error" onClick={() => openDelete(s)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        }
                        sx={{ py: 1.5 }}
                    >
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: stringToColor(s.name), color: '#fff' }}>
                                <MenuBookIcon fontSize="small" />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                            primary={
                                <Typography fontWeight="500" variant="body1">
                                    {s.name}
                                </Typography>
                            } 
                        />
                    </ListItem>
                    {/* Son eleman hariç çizgi ekle */}
                    {index < filteredSubjects.length - 1 && <Divider component="li" />}
                </Box>
            ))}

            {!loading && filteredSubjects.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    <AutoStoriesIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography>Kayıtlı ders bulunamadı.</Typography>
                </Box>
            )}
        </List>
      </Paper>

      {/* 🟢 ADD DIALOG */}
      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Yeni Ders Ekle
            <IconButton onClick={handleCloseAdd} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ mt: 1 }}>
                <TextField
                    autoFocus
                    label="Ders Adı"
                    placeholder="Örn: Fizik"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={!!error}
                    helperText={error}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><MenuBookIcon color="action" /></InputAdornment>,
                    }}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseAdd} color="inherit">Vazgeç</Button>
            <Button onClick={createSubject} variant="contained" disableElevation>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 DELETE CONFIRMATION */}
      <ConfirmDialog
        open={deleteOpen}
        title="Ders Silinsin mi?"
        description={
            selectedSubject
              ? `"${selectedSubject.name}" dersi silinecek. Bu derse bağlı müfredat konuları, soru havuzu ve öğretmen atamaları etkilenebilir.`
              : ""
          }
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteSubject}
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

export default SubjectsPage;