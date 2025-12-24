import { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useSnackbar } from "../../hooks/useSnackbar";
import { getApiError } from "../../utils/getApiError";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
  FormControl,
  InputLabel,
  OutlinedInput,
  Tooltip,
  Snackbar // <--- EKLENDİ
} from "@mui/material";

// --- İKONLAR ---
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';

type Subject = { _id: string; name: string };

type Teacher = {
  _id: string;
  userId: { name: string; email: string };
  branches: Subject[];
};

// Avatar için rastgele renk üretici
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

const TeachersPage = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Arama State
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Silme State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const { snack, show, close } = useSnackbar();

  const fetchAll = async () => {
    setLoading(true);
    try {
        const [t, s] = await Promise.all([
        api.get("/admin/teachers"),
        api.get("/subjects"),
        ]);
        setTeachers(t.data);
        setSubjects(s.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- FILTRELEME MANTIĞI ---
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
        t.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.userId.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  // --- EYLEMLER ---
  const handleCloseAdd = () => {
      setOpenAdd(false);
      setName("");
      setEmail("");
      setBranches([]);
      setError("");
      setSuccess("");
  };

  const createTeacher = async () => {
    setError("");
    setSuccess("");

    if (!name || !email) {
      setError("İsim ve email alanları zorunludur.");
      return;
    }

    try {
      await api.post("/admin/teachers", {
        name,
        email,
        branches,
      });

      show("Öğretmen başarıyla eklendi", "success");
      handleCloseAdd();
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || "Öğretmen oluşturulamadı");
    }
  };

  const openDelete = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const deleteTeacher = async () => {
    if (!selectedTeacherId) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await api.delete(`/admin/teachers/${selectedTeacherId}`);

      show("Öğretmen silindi", "success");
      setDeleteOpen(false);
      setSelectedTeacherId("");
      fetchAll();
    } catch (err: any) {
      setDeleteError(getApiError(err, "Öğretmen silinemedi. Atanmış dersleri olabilir."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Öğretmen Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary">
                Toplam {teachers.length} kayıtlı öğretmen bulunuyor.
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />} 
            onClick={() => setOpenAdd(true)}
            size="large"
            sx={{ borderRadius: 2 }}
        >
            Yeni Öğretmen Ekle
        </Button>
      </Box>

      {/* SEARCH BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
          <TextField
            fullWidth
            placeholder="İsim veya E-posta ile ara..."
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
                <TableCell width={60}>Avatar</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ad Soyad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>İletişim</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Branşlar</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {filteredTeachers.map((t) => (
                <TableRow key={t._id} hover>
                <TableCell>
                    <Avatar 
                        sx={{ 
                            bgcolor: stringToColor(t.userId.name), 
                            fontSize: 16, 
                            fontWeight: 'bold' 
                        }}
                    >
                        {t.userId.name.charAt(0).toUpperCase()}
                    </Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>
                    {t.userId.name}
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                        <EmailIcon fontSize="inherit" /> {t.userId.email}
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {t.branches.length > 0 ? (
                            t.branches.map((b) => (
                                <Chip 
                                    key={b._id} 
                                    label={b.name} 
                                    size="small" 
                                    icon={<SchoolIcon fontSize="small" />}
                                    variant="outlined"
                                />
                            ))
                        ) : (
                            <Typography variant="caption" color="text.secondary">Branş Yok</Typography>
                        )}
                    </Box>
                </TableCell>
                <TableCell align="right">
                    <Tooltip title="Sil">
                        <IconButton 
                            color="error" 
                            onClick={() => openDelete(t._id)}
                            size="small"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </TableCell>
                </TableRow>
            ))}
            
            {filteredTeachers.length === 0 && !loading && (
                <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                        Kayıt bulunamadı.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </Paper>

      {/* 🟢 CREATE DIALOG */}
      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Öğretmen Ekle
            <IconButton onClick={handleCloseAdd} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                
                {error && <Alert severity="error">{error}</Alert>}
                
                <TextField
                    label="Ad Soyad"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                
                <TextField
                    label="E-posta Adresi"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText="Öğretmene giriş bilgileri bu maile gönderilecektir."
                />

                <FormControl fullWidth>
                    <InputLabel>Branş Seçimi</InputLabel>
                    <Select
                        multiple
                        value={branches}
                        onChange={(e) => setBranches(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        input={<OutlinedInput label="Branş Seçimi" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={subjects.find(s => s._id === value)?.name} size="small" />
                            ))}
                            </Box>
                        )}
                    >
                        {subjects.map((s) => (
                            <MenuItem key={s._id} value={s._id}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseAdd} color="inherit">Vazgeç</Button>
            <Button onClick={createTeacher} variant="contained" disableElevation>Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 DELETE CONFIRMATION */}
      <ConfirmDialog
        open={deleteOpen}
        title="Öğretmen silinsin mi?"
        description="Bu işlem geri alınamaz. Eğer öğretmenin aktif ders programı veya sınıf ataması varsa işlem başarısız olabilir."
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteTeacher}
      />

      {/* FEEDBACK SNACKBAR */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={close}>
        <Alert onClose={close} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeachersPage;