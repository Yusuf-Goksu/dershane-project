import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useSnackbar } from "../../hooks/useSnackbar";
import { getApiError } from "../../utils/getApiError";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel
} from "@mui/material";

// --- İKONLAR ---
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit'; // Sonuç gir için
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';

type ClassItem = {
  _id: string;
  name: string;
  gradeLevel?: number;
  year?: string;
};

type ExamStatus = "DRAFT" | "RESULT_ENTRY" | "FINALIZED";

type ExamItem = {
  _id: string;
  title: string;
  date: string;
  difficulty: "easy" | "medium" | "hard";
  status?: ExamStatus;
  classId: ClassItem | string;
  analytics?: {
    studentCount?: number;
    classAvgTotalNet?: number;
    finalizedAt?: string;
  };
};

const statusConfig: Record<ExamStatus, { label: string; color: "default" | "warning" | "success" }> = {
  DRAFT: { label: "Taslak", color: "default" },
  RESULT_ENTRY: { label: "Sonuç Girişi", color: "warning" },
  FINALIZED: { label: "Tamamlandı", color: "success" },
};

const difficultyLabel: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const ExamsListPage = () => {
  const navigate = useNavigate();
  const { show, close } = useSnackbar(); // Kendi hook'unu kullandığını varsayıyorum

  // --- STATE ---
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtreler
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<ExamStatus | "">("");

  // Dialogs
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);

  // Menu State (Dropdown için)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuExam, setMenuExam] = useState<ExamItem | null>(null);

  // --- API CALLS ---
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    if (status) params.set("status", status);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [classId, status]);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data));
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/exams${queryString}`);
      setExams(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Denemeler alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION HANDLERS ---
  
  // Menüyü Aç
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, exam: ExamItem) => {
    setAnchorEl(event.currentTarget);
    setMenuExam(exam);
  };

  // Menüyü Kapat
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuExam(null);
  };

  // 1. Finalize İşlemleri
  const openFinalizeDialog = () => {
    if (menuExam) {
        setSelectedExam(menuExam);
        setFinalizeDialogOpen(true);
        handleMenuClose();
    }
  };

  const finalizeExam = async () => {
    if (!selectedExam) return;
    try {
      setActionLoading(true);
      await api.post(`/exams/${selectedExam._id}/finalize`);
      show("Deneme başarıyla finalize edildi", "success");
      setFinalizeDialogOpen(false);
      await fetchExams();
    } catch (err: any) {
      show(getApiError(err, "Finalize işlemi başarısız"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Silme İşlemleri
  const openDeleteDialog = () => {
    if (menuExam) {
        setSelectedExam(menuExam);
        setDeleteDialogOpen(true);
        handleMenuClose();
    }
  };

  const deleteExam = async () => {
    if (!selectedExam) return;
    try {
      setActionLoading(true);
      await api.delete(`/admin/exams/${selectedExam._id}`);
      show("Deneme silindi", "success");
      setDeleteDialogOpen(false);
      await fetchExams();
    } catch (err: any) {
      show(getApiError(err, "Silme başarısız"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- UTILS ---
  const getClassName = (c: ExamItem["classId"]) => {
    if (!c) return "-";
    if (typeof c === "string") {
      const found = classes.find((x) => x._id === c);
      return found ? found.name : c;
    }
    return c.name;
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER & CREATE BUTTON */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Sınav Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary">Tüm deneme sınavlarını buradan yönetebilirsiniz.</Typography>
        </Box>
        <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate("/admin/exams/create")}
            sx={{ borderRadius: 2 }}
        >
            Yeni Deneme Oluştur
        </Button>
      </Box>

      {/* FILTERS AREA */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1 }}>
                <FilterListIcon />
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sınıf Filtrele</InputLabel>
                <Select
                    value={classId}
                    label="Sınıf Filtrele"
                    onChange={(e) => setClassId(e.target.value)}
                >
                    <MenuItem value="">Tümü</MenuItem>
                    {classes.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Durum Filtrele</InputLabel>
                <Select
                    value={status}
                    label="Durum Filtrele"
                    onChange={(e) => setStatus(e.target.value as any)}
                >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="DRAFT">Taslak</MenuItem>
                    <MenuItem value="RESULT_ENTRY">Sonuç Bekleyen</MenuItem>
                    <MenuItem value="FINALIZED">Tamamlandı</MenuItem>
                </Select>
            </FormControl>

            <Button 
                variant="outlined" 
                onClick={fetchExams} 
                disabled={loading}
                sx={{ ml: 'auto !important' }} // En sağa itmek için (Desktopta)
            >
                {loading ? "Yükleniyor..." : "Uygula"}
            </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* DATA TABLE */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid #eee' }} elevation={0}>
        <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Sınav Adı</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Sınıf</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tarih</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Zorluk</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Katılım</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>İşlemler</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {exams.map((e) => {
                const st = (e.status || "DRAFT") as ExamStatus;
                
                return (
                <TableRow key={e._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{e.title}</TableCell>
                    <TableCell>
                        <Chip label={getClassName(e.classId)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{e.date ? new Date(e.date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{difficultyLabel[e.difficulty] || e.difficulty}</TableCell>
                    <TableCell>
                        <Chip
                            label={statusConfig[st].label}
                            color={statusConfig[st].color}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                    </TableCell>
                    <TableCell align="center">
                        {e.analytics?.studentCount ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <AssessmentIcon fontSize="small" color="action" />
                                {e.analytics.studentCount}
                            </Box>
                        ) : "-"}
                    </TableCell>
                    <TableCell align="right">
                        {/* Birincil Aksiyon: Detay */}
                        <Tooltip title="Detayları Gör">
                            <IconButton 
                                color="primary" 
                                onClick={() => navigate(`/admin/exams/${e._id}`)}
                                sx={{ mr: 1 }}
                            >
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Diğer Aksiyonlar: Menü */}
                        <IconButton onClick={(event) => handleMenuOpen(event, e)}>
                            <MoreVertIcon />
                        </IconButton>
                    </TableCell>
                </TableRow>
                );
            })}
            
            {!loading && exams.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Kriterlere uygun sınav bulunamadı.
                    </TableCell>
                </TableRow>
            )}

            {loading && (
                <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </Paper>

      {/* --- ACTION MENU --- */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 180, boxShadow: 3 } }}
      >
        <MenuItem onClick={() => { navigate(`/admin/exams/${menuExam?._id}/results`); handleMenuClose(); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Sonuç Gir / Yükle</ListItemText>
        </MenuItem>

        <MenuItem 
            onClick={openFinalizeDialog} 
            disabled={menuExam?.status !== 'RESULT_ENTRY'}
        >
            <ListItemIcon><CheckCircleIcon fontSize="small" color={menuExam?.status === 'RESULT_ENTRY' ? 'warning' : 'disabled'} /></ListItemIcon>
            <ListItemText>Finalize Et</ListItemText>
        </MenuItem>

        <MenuItem onClick={openDeleteDialog} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Sil</ListItemText>
        </MenuItem>
      </Menu>

      {/* --- FINALIZE DIALOG --- */}
      <Dialog open={finalizeDialogOpen} onClose={() => setFinalizeDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="warning" />
            Sınav Finalize Edilsin mi?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            <b>{selectedExam?.title}</b> sınavını finalize etmek üzeresiniz.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Bu işlemden sonra sonuç girişi kapatılacak ve öğrenciler için AI raporları oluşturulacaktır.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialogOpen(false)}>Vazgeç</Button>
          <Button variant="contained" color="warning" onClick={finalizeExam} disabled={actionLoading}>
            {actionLoading ? "İşleniyor..." : "Finalize Et"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DELETE DIALOG --- */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Sınavı Sil</DialogTitle>
        <DialogContent>
          <Typography>
             <b>{selectedExam?.title}</b> sınavını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm sonuç verileri silinir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Vazgeç</Button>
          <Button variant="contained" color="error" onClick={deleteExam} disabled={actionLoading}>
             {actionLoading ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ExamsListPage;