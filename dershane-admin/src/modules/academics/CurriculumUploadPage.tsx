import { useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Stack,
  Tooltip,
  List,
  ListItem,
  ListItemText
} from "@mui/material";

// --- İKONLAR ---
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import TableChartIcon from '@mui/icons-material/TableChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoStoriesIcon from '@mui/icons-material/AutoStories'; // Ders/Kitap ikonu
import CategoryIcon from '@mui/icons-material/Category'; // Konu ikonu

type UploadResult = {
  success: boolean;
  message: string;
  createdSubjects: number;
  createdTopics: number;
};

const CurriculumUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
        if (!isExcel) {
            setError("Lütfen geçerli bir Excel dosyası (.xlsx) seçiniz.");
            setFile(null);
            return;
        }
        setFile(selectedFile);
        setError("");
        setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Lütfen bir Excel dosyası seçin");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await api.post(
        "/admin/curriculum/bulk",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Müfredat yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
      alert("Örnek müfredat şablonu indiriliyor...");
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', pb: 5 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
            Müfredat Yönetimi
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Dersleri, konuları ve kazanım sıralamasını Excel ile toplu yükleyin.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        
        {/* SOL: YÜKLEME ALANI */}
        <Grid item xs={12} md={7}>
            <Paper 
                elevation={0}
                variant="outlined"
                sx={{ 
                    p: 4, 
                    borderRadius: 4, 
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: file ? 'primary.main' : '#e0e0e0',
                    bgcolor: file ? 'primary.50' : '#fafafa',
                    textAlign: 'center',
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                }}
            >
                {!file ? (
                    <>
                        <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" gutterBottom>Müfredat Dosyasını Yükleyin</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Sürükleyin veya dosya seçin (.xlsx)
                        </Typography>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            Dosya Seç
                            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} />
                        </Button>
                    </>
                ) : (
                    <Box sx={{ width: '100%' }}>
                        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <InsertDriveFileIcon color="primary" fontSize="large" />
                                <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">{file.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </Typography>
                                </Box>
                                <Tooltip title="Dosyayı Kaldır">
                                    <IconButton color="error" onClick={() => { setFile(null); setResult(null); }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </CardContent>
                        </Card>

                        <Button 
                            variant="contained" 
                            fullWidth 
                            size="large" 
                            onClick={handleUpload} 
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        >
                            {loading ? "Müfredatı İşle..." : "Sisteme Yükle"}
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* HATA */}
            {error && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>
            )}

            {/* BAŞARI SONUCU */}
            {result && (
                <Box sx={{ mt: 4 }}>
                    <Alert 
                        severity="success" 
                        sx={{ mb: 3, borderRadius: 2 }} 
                        icon={<CheckCircleIcon fontSize="inherit" />}
                    >
                        <Typography fontWeight="bold">Yükleme Tamamlandı</Typography>
                        <Typography variant="body2">Müfredat veritabanına başarıyla işlendi.</Typography>
                    </Alert>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: '#e8f5e9', border: 'none' }}>
                                <CardContent>
                                    <AutoStoriesIcon color="success" sx={{ mb: 1 }} />
                                    <Typography variant="h4" fontWeight="bold" color="success.main">
                                        {result.createdSubjects}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Ders Eklendi</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: '#fff3e0', border: 'none' }}>
                                <CardContent>
                                    <CategoryIcon color="warning" sx={{ mb: 1 }} />
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                                        {result.createdTopics}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Konu Eklendi</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Grid>

        {/* SAĞ: REHBER & ŞABLON */}
        <Grid item xs={12} md={5}>
            <Stack spacing={3}>
                

                {/* 2. Format Rehberi (Visual Table) */}
                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fffde7', border: '1px solid #fff59d' }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TableChartIcon color="warning" fontSize="small" /> Zorunlu Sütun Yapısı
                        </Typography>
                        
                        <Typography variant="body2" paragraph color="text.secondary">
                            Excel dosyanızdaki sütun başlıkları aşağıdaki gibi olmalıdır:
                        </Typography>

                        {/* FAKE EXCEL TABLE */}
                        
                        <Box sx={{ 
                            border: '1px solid #ddd', 
                            borderRadius: 1, 
                            overflow: 'hidden', 
                            bgcolor: 'white',
                            fontSize: '0.75rem',
                            mb: 2
                        }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                                <Box sx={{ p: 1, flex: 1, borderRight: '1px solid #eee' }}>subject_name</Box>
                                <Box sx={{ p: 1, width: 60, borderRight: '1px solid #eee' }}>grade</Box>
                                <Box sx={{ p: 1, flex: 1, borderRight: '1px solid #eee' }}>topic_name</Box>
                                <Box sx={{ p: 1, width: 50 }}>order</Box>
                            </Box>
                            {/* Row 1 */}
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                                <Box sx={{ p: 1, flex: 1, borderRight: '1px solid #eee' }}>Matematik</Box>
                                <Box sx={{ p: 1, width: 60, borderRight: '1px solid #eee' }}>12</Box>
                                <Box sx={{ p: 1, flex: 1, borderRight: '1px solid #eee' }}>Türev</Box>
                                <Box sx={{ p: 1, width: 50 }}>1</Box>
                            </Box>
                             {/* Row 2 */}
                             <Box sx={{ display: 'flex' }}>
                                <Box sx={{ p: 1, flex: 1, borderRight: '1px solid #eee' }}>Matematik</Box>
                                <Box sx={{ p: 1, width: 60, borderRight: '1px solid #eee' }}>12</Box>
                                <Box sx={{ p: 1, flex: 1, borderRight: '1px solid #eee' }}>İntegral</Box>
                                <Box sx={{ p: 1, width: 50 }}>2</Box>
                            </Box>
                        </Box>

                         <List dense disablePadding>
                            <ListItem sx={{ px:0 }}>
                                <ListItemText 
                                    primary={<Typography variant="caption" fontWeight="bold">subject_name</Typography>} 
                                    secondary={<Typography variant="caption">Ders adı (Örn: Fizik, Kimya)</Typography>}
                                />
                            </ListItem>
                            <ListItem sx={{ px:0 }}>
                                <ListItemText 
                                    primary={<Typography variant="caption" fontWeight="bold">order</Typography>} 
                                    secondary={<Typography variant="caption">Konunun sıralaması (1, 2, 3...)</Typography>}
                                />
                            </ListItem>
                         </List>

                    </CardContent>
                </Card>

            </Stack>
        </Grid>

      </Grid>
    </Box>
  );
};

export default CurriculumUploadPage;