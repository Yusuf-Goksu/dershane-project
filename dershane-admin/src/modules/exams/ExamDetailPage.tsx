import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  Stack,
  Tooltip
} from "@mui/material";

// --- İKONLAR ---
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // AI İkonu
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import BarChartIcon from '@mui/icons-material/BarChart';

// --- TİPLER (Aynen korundu) ---
type ExamStatus = "DRAFT" | "RESULT_ENTRY" | "FINALIZED";
type Difficulty = "easy" | "medium" | "hard";

type ExamDetail = {
  _id: string;
  title: string;
  date: string;
  difficulty: Difficulty;
  status: ExamStatus;
  classId: { _id: string; name: string } | string;
  resultCount: number;
  analytics?: {
    studentCount?: number;
    classAvgTotalNet?: number;
    subjectAverages?: { subjectId: any; avgNet: number }[];
  };
  subjects?: {
    subjectId: { _id: string; name: string };
    questionCount: number;
  }[];
};

type ExamResultRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalNet: number;
  subjects: {
    subjectId: any;
    subject?: string | null;
    net: number;
    correct: number;
    wrong: number;
    blank: number;
  }[];
  createdAt: string;
};

const statusConfig: Record<ExamStatus, { label: string; color: "default" | "warning" | "success" | "info" }> = {
  DRAFT: { label: "Taslak", color: "default" },
  RESULT_ENTRY: { label: "Sonuç Girişi Aktif", color: "warning" }, // Dikkat çeksin diye warning
  FINALIZED: { label: "Tamamlandı", color: "success" },
};

const difficultyLabel: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

// --- YARDIMCI BİLEŞEN: İSTATİSTİK KARTI ---
const StatCard = ({ title, value, icon, color }: any) => (
    <Card elevation={0} sx={{ border: '1px solid #eee', height: '100%', display: 'flex', alignItems: 'center', p: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color, mr: 2 }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h5" fontWeight="bold">{value}</Typography>
        </Box>
    </Card>
);

const ExamDetailPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // UI State
  const [tabValue, setTabValue] = useState(0); // 0: Analiz, 1: Liste

  // Dialog States
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResultRow | null>(null);
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailResult, setDetailResult] = useState<ExamResultRow | null>(null);
  
  const [manualOpen, setManualOpen] = useState(false);
  
  // AI Report
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Manual Add States
  const [students, setStudents] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [manualSubjects, setManualSubjects] = useState<{
    subjectId: string;
    subjectName: string;
    correct: number;
    wrong: number;
    blank: number;
  }[]>([]);

  // --- MEMOS ---
  const className = useMemo(() => {
    if (!exam?.classId) return "-";
    return typeof exam.classId === "string" ? exam.classId : exam.classId.name;
  }, [exam?.classId]);

  const subjectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (exam?.subjects || []).forEach((s) => {
      map[String(s.subjectId?._id)] = s.subjectId?.name;
    });
    return map;
  }, [exam?.subjects]);

  // --- FETCHING ---
  useEffect(() => {
    if (!examId) return;
    fetchAll();
  }, [examId]);

  const fetchAll = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const [ex, rs] = await Promise.all([
         api.get(`/exams/${examId}/detail`),
         api.get(`/exam-results/exam/${examId}`)
      ]);
      setExam(ex.data);
      setResults(rs.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Veriler alınamadı");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const finalizeExam = async () => {
    if (!examId) return;
    setLoading(true);
    try {
      const res = await api.post(`/exams/${examId}/finalize`);
      setMsg(`${res.data.message}`);
      setFinalizeOpen(false);
      await fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || "Finalize başarısız");
    } finally {
      setLoading(false);
    }
  };

  const deleteResult = async () => {
    if (!selectedResult) return;
    setLoading(true);
    try {
      await api.delete(`/exam-results/${selectedResult.id}`);
      setMsg("Sonuç silindi");
      setDeleteOpen(false);
      setSelectedResult(null);
      await fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || "Silme başarısız");
    } finally {
      setLoading(false);
    }
  };

  const openManualAdd = async () => {
    if (!exam || !examId) return;
    setError("");
    
    // Öğrencileri çek (Sadece bu modal açıldığında çekmek performans için iyi)
    try {
        const res = await api.get(`/students/class/${(exam.classId as any)._id}`);
        setStudents(res.data);
    
        const subs = exam.subjects?.map((s) => ({
          subjectId: s.subjectId._id,
          subjectName: s.subjectId.name,
          correct: 0, wrong: 0, blank: 0,
        })) || [];
    
        setManualSubjects(subs);
        setSelectedStudentId("");
        setManualOpen(true);
    } catch (e) { setError("Öğrenci listesi alınamadı"); }
  };

  const submitManualResult = async () => {
    if (!examId || !selectedStudentId) {
        setError("Öğrenci seçilmelidir");
        return;
    }
    setLoading(true);
    try {
        await api.post("/exam-results/manual", {
        examId,
        studentId: selectedStudentId,
        resultsBySubject: manualSubjects.map((s) => ({
            subjectId: s.subjectId,
            correct: s.correct, wrong: s.wrong, blank: s.blank,
        })),
        });
        setManualOpen(false);
        setMsg("Sonuç başarıyla eklendi");
        await fetchAll();
    } catch (err: any) {
        setError(err.response?.data?.message || "Hata oluştu");
    } finally {
        setLoading(false);
    }
  };

  const openResultDetail = async (r: ExamResultRow) => {
    setDetailResult(r);
    setDetailOpen(true);
    setAiReport(null); // Önceki raporu temizle

    try {
      setAiLoading(true);
      const res = await api.get(`/ai/report/exam/${examId}/student/${r.studentId}`);
      setAiReport(res.data);
    } catch (err) {
      setAiReport(null); // Rapor yoksa null kalsın
    } finally {
      setAiLoading(false);
    }
  };

  const status = exam?.status || "DRAFT";
  const canFinalize = status === "RESULT_ENTRY";
  const canEditResults = status !== "FINALIZED";

  if (loading && !exam) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', pb: 5 }}>
      
      {/* --- HEADER --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate("/admin/exams")} sx={{ bgcolor: 'white', border: '1px solid #eee' }}>
                <ArrowBackIcon />
            </IconButton>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight="bold">{exam?.title}</Typography>
                    {exam && <Chip size="small" label={statusConfig[status].label} color={statusConfig[status].color as any} sx={{ fontWeight: 'bold' }} />}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14 }} /> {exam?.date ? new Date(exam.date).toLocaleDateString() : "-"}
                    <span style={{ margin: '0 4px' }}>•</span>
                    <SchoolIcon sx={{ fontSize: 14 }} /> {className}
                </Typography>
            </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
            {canEditResults && (
                <>
                <Button 
                    variant="outlined" 
                    startIcon={<UploadFileIcon />} 
                    onClick={() => navigate(`/admin/exams/${examId}/results`)}
                >
                    Excel Yükle
                </Button>
                <Button 
                    variant="contained" 
                    startIcon={<CheckCircleIcon />} 
                    color="warning" 
                    onClick={() => setFinalizeOpen(true)}
                    disabled={!canFinalize}
                >
                    Finalize Et
                </Button>
                </>
            )}
            {!canEditResults && (
                 <Button variant="contained" disabled startIcon={<CheckCircleIcon />}>Sınav Tamamlandı</Button>
            )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}

      {/* --- TABS --- */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            textColor="primary" 
            indicatorColor="primary"
            sx={{ borderBottom: '1px solid #eee' }}
        >
            <Tab label="Genel Analiz" icon={<BarChartIcon />} iconPosition="start" />
            <Tab label={`Öğrenci Sonuçları (${results.length})`} icon={<AssessmentIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* --- TAB 1: ANALİZ --- */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
            {/* KPI Kartları */}
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Katılım" 
                    value={exam?.resultCount ?? 0} 
                    icon={<SchoolIcon />} 
                    color="#1976d2" 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Sınıf Ortalaması" 
                    value={exam?.analytics?.classAvgTotalNet?.toFixed(2) || "-"} 
                    icon={<AssessmentIcon />} 
                    color="#2e7d32" 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Zorluk Seviyesi" 
                    value={difficultyLabel[exam?.difficulty || "medium"]} 
                    icon={<BarChartIcon />} 
                    color="#ed6c02" 
                />
            </Grid>

            {/* Ders Bazlı Grafikler (Tablo yerine Progress Bar) */}
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Ders Bazlı Başarı Analizi</Typography>
                    <Grid container spacing={4}>
                        {(exam?.analytics?.subjectAverages || []).map((s: any, idx) => {
                             const name = subjectNameMap[s.subjectId] || "Ders";
                             const maxScore = 40; // Örnek: Her ders max 40 net varsayalım veya dinamik hesaplanabilir
                             const percent = Math.min(100, Math.max(0, (s.avgNet / maxScore) * 100)); // Basit yüzde hesabı
                             
                             return (
                                 <Grid item xs={12} md={6} key={idx}>
                                     <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                                         <Typography fontWeight="500">{name}</Typography>
                                         <Typography fontWeight="bold" color="primary">{Number(s.avgNet).toFixed(2)} Net</Typography>
                                     </Box>
                                     <LinearProgress variant="determinate" value={percent} sx={{ height: 10, borderRadius: 5 }} />
                                 </Grid>
                             )
                        })}
                        {!exam?.analytics?.subjectAverages?.length && (
                            <Typography sx={{ p: 2, color: 'text.secondary' }}>Henüz veri oluşmadı.</Typography>
                        )}
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
      )}

      {/* --- TAB 2: LİSTE --- */}
      {tabValue === 1 && (
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<AddCircleIcon />} 
                    disabled={!canEditResults}
                    onClick={openManualAdd}
                >
                    Manuel Ekle
                </Button>
            </Box>
            <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                        <TableCell>Öğrenci Adı</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="center">Toplam Net</TableCell>
                        <TableCell align="center">Kayıt Tarihi</TableCell>
                        <TableCell align="right">İşlemler</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((r) => (
                        <TableRow key={r.id} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{r.studentName}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{r.studentEmail}</TableCell>
                            <TableCell align="center">
                                <Chip label={Number(r.totalNet).toFixed(2)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                            </TableCell>
                            <TableCell align="center">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                                <Tooltip title="Detaylı Karne">
                                    <IconButton size="small" color="primary" onClick={() => openResultDetail(r)}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </Tooltip>
                                {canEditResults && (
                                    <Tooltip title="Sil">
                                        <IconButton size="small" color="error" onClick={() => { setSelectedResult(r); setDeleteOpen(true); }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {!results.length && (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Henüz sonuç girişi yapılmamış.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Paper>
      )}

      {/* --- MODAL: DETAYLI KARNE (REPORT CARD STYLE) --- */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                <Typography variant="h6">Öğrenci Sınav Karnesi</Typography>
            </Box>
            <Chip label={detailResult?.studentName} color="primary" />
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f8f9fa', p: 3 }}>
            {detailResult && (
                <Grid container spacing={3}>
                    {/* SOL KOLON: Sayısal Veriler */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Net Dağılımı</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" display="block">Toplam Net</Typography>
                                    <Typography variant="h4" color="primary" fontWeight="bold">{Number(detailResult.totalNet).toFixed(2)}</Typography>
                                </Box>
                            </Box>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ders</TableCell>
                                        <TableCell align="center">D</TableCell>
                                        <TableCell align="center">Y</TableCell>
                                        <TableCell align="center">B</TableCell>
                                        <TableCell align="right">Net</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {detailResult.subjects.map((s, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell component="th" scope="row">{s.subject}</TableCell>
                                            <TableCell align="center" sx={{ color: 'success.main' }}>{s.correct}</TableCell>
                                            <TableCell align="center" sx={{ color: 'error.main' }}>{s.wrong}</TableCell>
                                            <TableCell align="center" sx={{ color: 'text.secondary' }}>{s.blank}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Number(s.net).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>

                    {/* SAĞ KOLON: AI Raporu */}
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, height: '100%', border: '1px solid #cce5ff', bgcolor: '#f0f7ff' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#0d47a1' }}>
                                <AutoAwesomeIcon />
                                <Typography variant="h6" fontWeight="bold">Yapay Zeka Analizi</Typography>
                            </Box>
                            
                            {aiLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                                    <CircularProgress size={20} /> <Typography>Analiz oluşturuluyor...</Typography>
                                </Box>
                            ) : !aiReport ? (
                                <Alert severity="info">Bu sınav için henüz AI yorumu oluşturulmamış.</Alert>
                            ) : (
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">Genel Değerlendirme</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            "{aiReport.summary}"
                                        </Typography>
                                    </Box>
                                    
                                    {aiReport.strengths?.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" color="success.main" fontWeight="bold">Güçlü Yönler 🌟</Typography>
                                            <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                                                {aiReport.strengths.map((s:string, i:number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </Box>
                                    )}

                                    {aiReport.weaknesses?.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" color="error.main" fontWeight="bold">Gelişim Alanları 🚀</Typography>
                                            <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                                                {aiReport.weaknesses.map((w:string, i:number) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </Box>
                                    )}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDetailOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* --- DELETE DIALOG --- */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Sonuç Silinecek</DialogTitle>
        <DialogContent>
            <Typography>
                <b>{selectedResult?.studentName}</b> öğrencisinin sonucu kalıcı olarak silinecek. Onaylıyor musunuz?
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>İptal</Button>
            <Button onClick={deleteResult} color="error" variant="contained">Sil</Button>
        </DialogActions>
      </Dialog>

      {/* --- FINALIZE DIALOG --- */}
      <Dialog open={finalizeOpen} onClose={() => setFinalizeOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <CheckCircleIcon color="warning" /> Sınavı Finalize Et
        </DialogTitle>
        <DialogContent>
             <Alert severity="warning" sx={{ mt: 1 }}>
                Bu işlemden sonra <b>sonuç girişi kapatılacak</b> ve tüm öğrenciler için <b>AI Analiz Raporları</b> oluşturulmaya başlanacaktır. Bu işlem geri alınamaz.
             </Alert>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setFinalizeOpen(false)}>İptal</Button>
            <Button onClick={finalizeExam} color="warning" variant="contained">Onayla ve Bitir</Button>
        </DialogActions>
      </Dialog>
      
      {/* Manual Add Modal (Basit tutuldu, sadece style fix) */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Manuel Sonuç Ekleme</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField
                        select
                        label="Öğrenci Seçiniz"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        fullWidth
                    >
                        {students.map((s) => (
                             <MenuItem key={s._id} value={s._id}>{s.name} ({s.email})</MenuItem>
                        ))}
                    </TextField>

                    <Grid container spacing={2}>
                        {manualSubjects.map((s, idx) => (
                            <Grid item xs={12} sm={6} key={idx}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle2" gutterBottom>{s.subjectName}</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField size="small" label="D" type="number" value={s.correct} onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setManualSubjects(prev => prev.map((x, i) => i === idx ? { ...x, correct: v } : x));
                                            }} />
                                            <TextField size="small" label="Y" type="number" color="error" value={s.wrong} onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setManualSubjects(prev => prev.map((x, i) => i === idx ? { ...x, wrong: v } : x));
                                            }} />
                                            <TextField size="small" label="B" type="number" value={s.blank} onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setManualSubjects(prev => prev.map((x, i) => i === idx ? { ...x, blank: v } : x));
                                            }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setManualOpen(false)}>Vazgeç</Button>
                <Button onClick={submitManualResult} variant="contained">Kaydet</Button>
            </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ExamDetailPage;