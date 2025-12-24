import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  TextField,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  InputAdornment,
  Avatar,
  Chip,
  Stack,
  Tooltip,
  OutlinedInput
} from "@mui/material";

// --- İKONLAR ---
import AddLinkIcon from '@mui/icons-material/AddLink';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClassIcon from '@mui/icons-material/Class';
import SubjectIcon from '@mui/icons-material/MenuBook';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';

// --- TYPES ---
type ClassItem = { _id: string; name: string; gradeLevel: number; year: string };
type Subject = { _id: string; name: string };
type TeacherProfile = {
  _id: string; 
  userId: { _id: string; name: string; email: string };
};

type Assignment = {
  _id: string;
  classId: ClassItem;
  subjectId: Subject;
  teacherId: TeacherProfile;
  weeklyHours: number;
  createdAt: string;
};

// Avatar Rengi Üreteci
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

const TeacherAssignmentsPage = () => {
  // --- STATE ---
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [openDialog, setOpenDialog] = useState(false);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState(""); 
  const [weeklyHours, setWeeklyHours] = useState<number | "">("");
  
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // --- API ---
  useEffect(() => {
    // Dropdown verilerini paralel çekelim
    Promise.all([
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/admin/teachers")
    ]).then(([resClass, resSub, resTeach]) => {
        setClasses(resClass.data);
        setSubjects(resSub.data);
        setTeachers(resTeach.data);
    });

    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
        const res = await api.get("/admin/class-courses");
        setAssignments(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleCloseDialog = () => {
      setOpenDialog(false);
      setClassId("");
      setSubjectId("");
      setTeacherId("");
      setWeeklyHours("");
      setError("");
      setMsg("");
  };

  const upsertAssignment = async () => {
    setMsg("");
    setError("");

    if (!classId || !subjectId || !teacherId || !weeklyHours) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/admin/class-courses", {
        classId,
        subjectId,
        teacherId,
        weeklyHours: Number(weeklyHours),
      });

      setMsg("Atama başarıyla kaydedildi.");
      setTimeout(() => setMsg(""), 3000); // 3 sn sonra mesajı sil
      handleCloseDialog();
      await fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Atama yapılamadı");
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await api.delete(`/admin/class-courses/${deleteTarget}`);
      setDeleteTarget(null);
      await fetchAssignments();
    } catch (err: any) {
      setError("Silme işlemi başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER ---
  const filteredAssignments = useMemo(() => {
      return assignments.filter(a => 
        a.teacherId?.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.classId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subjectId?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [assignments, searchTerm]);

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Ders Atamaları</Typography>
            <Typography variant="body2" color="text.secondary">
                Öğretmen, sınıf ve ders eşleştirmelerini yönetin.
            </Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddLinkIcon />} 
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2 }}
        >
            Yeni Atama Yap
        </Button>
      </Box>

      {/* SEARCH BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
          <TextField
            fullWidth
            placeholder="Öğretmen, Sınıf veya Ders ara..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>Öğretmen</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sınıf</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ders</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Haftalık Saat</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {filteredAssignments.map((a) => (
                <TableRow key={a._id} hover>
                {/* Öğretmen Kolonu */}
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                            sx={{ 
                                bgcolor: stringToColor(a.teacherId?.userId?.name || ""), 
                                width: 32, height: 32, fontSize: 14 
                            }}
                        >
                            {a.teacherId?.userId?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" fontWeight="500">
                                {a.teacherId?.userId?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {a.teacherId?.userId?.email}
                            </Typography>
                        </Box>
                    </Box>
                </TableCell>

                {/* Sınıf Kolonu */}
                <TableCell>
                    <Chip 
                        icon={<ClassIcon fontSize="small" />} 
                        label={`${a.classId?.name} (${a.classId?.gradeLevel}. Sınıf)`} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                    />
                </TableCell>

                {/* Ders Kolonu */}
                <TableCell>
                    <Chip 
                        icon={<SubjectIcon fontSize="small" />} 
                        label={a.subjectId?.name} 
                        size="small" 
                        sx={{ bgcolor: '#fff3e0', color: '#e65100', border: 'none' }}
                    />
                </TableCell>

                {/* Saat Kolonu */}
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">{a.weeklyHours} Saat</Typography>
                    </Box>
                </TableCell>

                {/* Aksiyon Kolonu */}
                <TableCell align="right">
                    <Tooltip title="Atamayı Kaldır">
                        <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => setDeleteTarget(a._id)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </TableCell>
                </TableRow>
            ))}

            {!loading && filteredAssignments.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                        Kayıt bulunamadı.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </Paper>

      {/* 🟢 CREATE/EDIT DIALOG */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Ders Ataması Yap
            <IconButton onClick={handleCloseDialog} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                
                {error && <Alert severity="error">{error}</Alert>}

                <FormControl fullWidth>
                    <InputLabel>Sınıf Seçimi</InputLabel>
                    <Select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        input={<OutlinedInput label="Sınıf Seçimi" startAdornment={<InputAdornment position="start"><ClassIcon color="action"/></InputAdornment>} />}
                    >
                        {classes.map((c) => (
                            <MenuItem key={c._id} value={c._id}>
                                {c.name} ({c.gradeLevel}. Sınıf)
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Ders Seçimi</InputLabel>
                    <Select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        input={<OutlinedInput label="Ders Seçimi" startAdornment={<InputAdornment position="start"><SubjectIcon color="action"/></InputAdornment>} />}
                    >
                        {subjects.map((s) => (
                            <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Öğretmen Seçimi</InputLabel>
                    <Select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        input={<OutlinedInput label="Öğretmen Seçimi" startAdornment={<InputAdornment position="start"><PersonIcon color="action"/></InputAdornment>} />}
                    >
                        {teachers.map((t) => (
                            <MenuItem key={t._id} value={t._id}>
                                {t.userId?.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Haftalık Ders Saati"
                    type="number"
                    fullWidth
                    inputProps={{ min: 1 }}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value ? Number(e.target.value) : "")}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><AccessTimeIcon color="action"/></InputAdornment>,
                    }}
                />

            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">Vazgeç</Button>
            <Button onClick={upsertAssignment} variant="contained" disabled={loading}>
                {loading ? "Kaydediliyor..." : "Atamayı Kaydet"}
            </Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Atamayı Sil</DialogTitle>
        <DialogContent>
            <Typography>
                Bu ders atamasını silmek istediğinize emin misiniz? Bu işlem öğretmenin ders programını etkileyecektir.
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>İptal</Button>
            <Button onClick={removeAssignment} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TeacherAssignmentsPage;