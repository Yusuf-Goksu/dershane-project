import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from "@mui/material";

// --- İKONLAR ---
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

type Exam = {
  _id: string;
  title: string;
  date: string;
  status?: "DRAFT" | "RESULT_ENTRY" | "FINALIZED";
  classId?: { _id: string; name: string } | string;
};

const statusLabel: Record<string, string> = {
  DRAFT: "Taslak",
  RESULT_ENTRY: "Sonuç Girişi",
  FINALIZED: "Finalize Edildi",
};

const ExamResultsUploadPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const canUpload = useMemo(() => {
    return Boolean(file && examId && exam?.status !== "FINALIZED");
  }, [file, examId, exam?.status]);

  useEffect(() => {
    if (!examId) return;
    fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${examId}`);
      setExam(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Deneme bilgisi alınamadı");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
        // Basit bir validasyon
        const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv');
        if (!isExcel) {
            setError("Lütfen sadece Excel (.xlsx, .xls) veya CSV dosyası yükleyin.");
            setFile(null);
            return;
        }
    }
    setFile(f);
    setMsg("");
    setError("");
  };

  const upload = async () => {
    if (!examId || !file) return;

    setMsg("");
    setError("");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `/exam-results/${examId}/bulk`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMsg(
        `${res.data.message} (Başarıyla eklenen: ${res.data.createdCount})`
      );
      setFile(null); // Başarılı yükleme sonrası dosyayı temizle
      await fetchExam(); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Yükleme başarısız");
    } finally {
      setLoading(false);
    }
  };

  // Excel Şablonu İndirme Fonksiyonu (Mock)
  const downloadTemplate = () => {
    // Gerçekte backend'den bir örnek excel dosyası linki verilebilir
    // Veya frontend tarafında basit bir CSV oluşturup indirilebilir.
    // Şimdilik sadece alert verelim:
    alert("Bu özellik eklendiğinde 'ornek_sablon.xlsx' inecektir.");
  };

  const status = exam?.status || "DRAFT";
  const isFinalized = status === "FINALIZED";

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', pb: 5 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(`/admin/exams/${examId}`)} // Detay sayfasına dönsün
            sx={{ bgcolor: 'white' }}
        >
          Geri Dön
        </Button>
        <Box>
            <Typography variant="h5" fontWeight="bold">Toplu Sonuç Yükleme</Typography>
            <Typography variant="body2" color="text.secondary">
                {exam?.title} • {exam?.date ? new Date(exam.date).toLocaleDateString() : ""}
            </Typography>
        </Box>
        {isFinalized && (
             <Chip label="Finalize Edildi - Yükleme Kapalı" color="error" icon={<InfoIcon />} sx={{ ml: 'auto' }} />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon fontSize="inherit" />}>{msg}</Alert>}

      <Grid container spacing={4}>
        
        {/* SOL TARA: YÜKLEME ALANI */}
        <Grid item xs={12} md={7}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    borderRadius: 4, 
                    border: '2px dashed',
                    borderColor: file ? 'primary.main' : '#ccc',
                    bgcolor: file ? 'primary.50' : '#fafafa',
                    transition: 'all 0.3s',
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {!file ? (
                    <>
                        <CloudUploadIcon sx={{ fontSize: 80, color: isFinalized ? '#ccc' : '#1976d2', mb: 2 }} />
                        <Typography variant="h6" color="text.primary" gutterBottom>
                            Excel Dosyasını Buraya Sürükleyin
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            veya dosya seçmek için butona tıklayın (.xlsx, .xls)
                        </Typography>
                        
                        <Button
                            variant="contained"
                            component="label"
                            size="large"
                            disabled={isFinalized}
                            startIcon={<InsertDriveFileIcon />}
                            sx={{ borderRadius: 2, px: 4, py: 1.5 }}
                        >
                            Dosya Seç
                            <input
                                type="file"
                                hidden
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </Button>
                    </>
                ) : (
                    <Box sx={{ width: '100%' }}>
                        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'white' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <InsertDriveFileIcon color="success" sx={{ fontSize: 40 }} />
                                <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </Typography>
                                </Box>
                                <Tooltip title="Dosyayı Kaldır">
                                    <IconButton color="error" onClick={() => setFile(null)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </CardContent>
                        </Card>

                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            onClick={upload}
                            disabled={loading || isFinalized}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                            sx={{ borderRadius: 2, py: 1.5 }}
                        >
                            {loading ? "Yükleniyor..." : "Sonuçları Sisteme Aktar"}
                        </Button>
                    </Box>
                )}
            </Paper>
        </Grid>

        {/* SAĞ TARAF: REHBER VE ŞABLON */}
        <Grid item xs={12} md={5}>
            <Stack spacing={3}>
                
                

                {/* 2. ADIM: Format Rehberi */}
                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fffde7', border: '1px solid #fff59d' }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon color="warning" fontSize="small" />
                            Excel Format Kuralları
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Aşağıdaki sütun yapısını <b>bozmadan</b> verilerinizi giriniz.
                        </Typography>
                        
                        {/* Fake Excel Table Visualization */}
                        <Box sx={{ 
                            border: '1px solid #ccc', 
                            borderRadius: 1, 
                            overflow: 'hidden', 
                            fontSize: '0.75rem', 
                            bgcolor: 'white' 
                        }}>
                            {/* Header Row */}
                            <Box sx={{ display: 'flex', bgcolor: '#f0f0f0', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>
                                <Box sx={{ p: 1, width: '40%', borderRight: '1px solid #ccc' }}>student_email</Box>
                                <Box sx={{ p: 1, width: '30%', borderRight: '1px solid #ccc' }}>Mat_correct</Box>
                                <Box sx={{ p: 1, width: '30%' }}>Mat_wrong</Box>
                            </Box>
                            {/* Data Row */}
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ p: 1, width: '40%', borderRight: '1px solid #eee' }}>ali@mail.com</Box>
                                <Box sx={{ p: 1, width: '30%', borderRight: '1px solid #eee' }}>15</Box>
                                <Box sx={{ p: 1, width: '30%' }}>2</Box>
                            </Box>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            * <b>student_email</b> zorunludur ve sistemdeki öğrenci ile eşleşmelidir.
                            <br />
                          
                        </Typography>
                    </CardContent>
                </Card>

            </Stack>
        </Grid>

      </Grid>
    </Box>
  );
};

export default ExamResultsUploadPage;