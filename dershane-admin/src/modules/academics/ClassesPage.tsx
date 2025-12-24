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
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  InputAdornment,
  Alert,
  Snackbar,
  Stack,
  Tooltip
} from "@mui/material";

// --- İKONLAR ---
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import ClassIcon from '@mui/icons-material/Class';
import CloseIcon from '@mui/icons-material/Close';

type ClassItem = {
  _id: string;
  name: string;
  gradeLevel: number;
  year: string;
};

// Seviyeye göre renk belirleme (Görsel ipucu)
const getGradeColor = (grade: number) => {
    if (grade >= 12) return "error"; // Sınav senesi (Kırmızı)
    if (grade >= 10) return "primary"; // Lise ara sınıf (Mavi)
    return "success"; // Alt sınıflar (Yeşil)
};

const ClassesPage = () => {
  // --- STATE ---
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number | "">("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  // Silme State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { snack, show, close } = useSnackbar();

  // --- API ---
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/classes");
      // İsme göre sıralı gelsin
      const sorted = res.data.sort((a: ClassItem, b: ClassItem) => a.gradeLevel - b.gradeLevel);
      setClasses(sorted);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // --- ACTIONS ---
  const handleCloseAdd = () => {
      setOpenAdd(false);
      setName("");
      setGradeLevel("");
      setYear("");
      setError("");
  };

  const createClass = async () => {
    if (!name || !gradeLevel || !year) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      await api.post("/classes", {
        name: name.trim(),
        gradeLevel,
        year: year.trim(),
      });

      show("Sınıf başarıyla oluşturuldu", "success");
      handleCloseAdd();
      fetchClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || "Sınıf eklenemedi");
    }
  };

  const openDelete = (classId: string) => {
    setSelectedClassId(classId);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const deleteClass = async () => {
    if (!selectedClassId) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await api.delete(`/classes/${selectedClassId}`);

      show("Sınıf silindi", "success");
      setDeleteOpen(false);
      setSelectedClassId("");
      fetchClasses();
    } catch (err: any) {
      setDeleteError(getApiError(err, "Sınıf silinemedi. İçinde öğrenci olabilir."));
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- FILTER ---
  const filteredClasses = useMemo(() => {
      return classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [classes, searchTerm]);

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Sınıf Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary">
                Toplam {classes.length} aktif sınıf.
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenAdd(true)}
            sx={{ borderRadius: 2 }}
        >
            Yeni Sınıf Ekle
        </Button>
      </Box>

      {/* SEARCH BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
          <TextField
            fullWidth
            placeholder="Sınıf adı ile ara (Örn: 12-A)..."
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

      {/* DATA TABLE */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid #eee' }} elevation={0}>
        <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
                <TableCell width={80}>Simge</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sınıf Adı</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Seviye</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Eğitim Yılı</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {filteredClasses.map((c) => (
                <TableRow key={c._id} hover>
                <TableCell>
                    <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0', width: 32, height: 32 }}>
                        <ClassIcon fontSize="small" />
                    </Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {c.name}
                </TableCell>
                <TableCell>
                    <Chip 
                        label={`${c.gradeLevel}. Sınıf`} 
                        color={getGradeColor(c.gradeLevel) as any} 
                        size="small" 
                        variant="outlined"
                        icon={<SchoolIcon fontSize="small" />}
                    />
                </TableCell>
                <TableCell>
                    <Stack direction="row" alignItems="center" gap={1} color="text.secondary">
                        <CalendarTodayIcon fontSize="small" />
                        {c.year}
                    </Stack>
                </TableCell>
                <TableCell align="right">
                    <Tooltip title="Sınıfı Sil">
                        <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => openDelete(c._id)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </TableCell>
                </TableRow>
            ))}

            {!loading && filteredClasses.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Kayıt bulunamadı.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </Paper>

      {/* 🟢 CREATE DIALOG */}
      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Sınıf Ekle
            <IconButton onClick={handleCloseAdd} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="Sınıf Adı"
                    placeholder="Örn: 12-A Sayısal"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><ClassIcon color="action" /></InputAdornment>,
                    }}
                />

                <TextField
                    label="Sınıf Seviyesi"
                    type="number"
                    fullWidth
                    inputProps={{ min: 1, max: 12 }}
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value ? Number(e.target.value) : "")}
                    helperText="1 ile 12 arasında bir değer giriniz."
                />

                <TextField
                    label="Eğitim Yılı"
                    placeholder="Örn: 2024-2025"
                    fullWidth
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><CalendarTodayIcon color="action" /></InputAdornment>,
                    }}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseAdd} color="inherit">Vazgeç</Button>
            <Button onClick={createClass} variant="contained" disableElevation>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 DELETE CONFIRMATION */}
      <ConfirmDialog
        open={deleteOpen}
        title="Sınıf Silinsin mi?"
        description="Bu işlem geri alınamaz. Eğer sınıfta kayıtlı öğrenciler varsa işlem başarısız olabilir."
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteClass}
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

export default ClassesPage;