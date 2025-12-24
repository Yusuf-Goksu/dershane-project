import { useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from "@mui/material";

// --- İKONLAR ---
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

type BulkUploadResult = {
  success: boolean;
  message: string;
  createdStudents?: number;
  createdParents?: number;
  createdUsers?: number;
  errors?: Array<{ row: number; message: string }>;
};

const BulkUploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
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
        setResult(null); // Yeni dosya seçince eski sonuçları temizle
    }
  };

  const upload = async () => {
    if (!file) {
      setError("Lütfen bir Excel dosyası seçin.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/admin/bulk-users", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Yükleme sırasında sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Şablon indirme fonksiyonu (Mock)
  const downloadTemplate = () => {
      alert("Örnek şablon indirme işlemi başlatılıyor...");
      // window.open('/assets/templates/student_import_template.xlsx'); gibi kullanılabilir.
  };

  return (
    <Box sx={{ maxWidth: 1000, margin: "0 auto", pb: 5 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
            Toplu Kayıt Sihirbazı
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Excel dosyası kullanarak sisteme toplu halde Öğrenci ve Veli kaydedin.
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
                    minHeight: 300,
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
                        <Typography variant="h6" gutterBottom>Dosyayı Sürükleyin veya Seçin</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Desteklenen formatlar: .xlsx, .xls
                        </Typography>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            Excel Dosyası Seç
                            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} />
                        </Button>
                    </>
                ) : (
                    <Box sx={{ width: '100%' }}>
                        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <InsertDriveFileIcon color="success" fontSize="large" />
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
                            onClick={upload} 
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        >
                            {loading ? "Veriler İşleniyor..." : "Yüklemeyi Başlat"}
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* HATA MESAJI (GENEL) */}
            {error && (
                <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* SONUÇ RAPORU */}
            {result && (
                <Box sx={{ mt: 4 }}>
                    <Alert 
                        severity={result.success ? "success" : "warning"} 
                        sx={{ mb: 3, borderRadius: 2 }}
                        icon={<CheckCircleIcon fontSize="inherit" />}
                    >
                        <Typography fontWeight="bold">{result.message}</Typography>
                    </Alert>
                    
                    {/* İstatistik Kartları */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: '#e3f2fd', border: 'none' }}>
                                <CardContent>
                                    <PersonAddIcon color="primary" sx={{ mb: 1 }} />
                                    <Typography variant="h4" fontWeight="bold" color="primary.main">{result.createdStudents ?? 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Öğrenci</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={4}>
                            <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: '#e8f5e9', border: 'none' }}>
                                <CardContent>
                                    <SupervisorAccountIcon color="success" sx={{ mb: 1 }} />
                                    <Typography variant="h4" fontWeight="bold" color="success.main">{result.createdParents ?? 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Veli</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={4}>
                            <Card variant="outlined" sx={{ textAlign: 'center', bgcolor: '#fff3e0', border: 'none' }}>
                                <CardContent>
                                    <GroupAddIcon color="warning" sx={{ mb: 1 }} />
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">{result.createdUsers ?? 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Kullanıcı</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Hata Listesi (Varsa) */}
                    {result.errors && result.errors.length > 0 && (
                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, bgcolor: '#ffebee', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ErrorIcon color="error" />
                                <Typography variant="subtitle2" color="error.main" fontWeight="bold">
                                    İşlenemeyen Satırlar ({result.errors.length})
                                </Typography>
                            </Box>
                            <List sx={{ maxHeight: 200, overflow: 'auto', py: 0 }}>
                                {result.errors.map((e, idx) => (
                                    <ListItem key={idx} divider>
                                        <ListItemText 
                                            primary={<Typography variant="body2" color="text.primary">Satır {e.row}</Typography>}
                                            secondary={<Typography variant="caption" color="error">{e.message}</Typography>}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>
            )}
        </Grid>

        {/* SAĞ: BİLGİLENDİRME & ŞABLON */}
        <Grid item xs={12} md={5}>
            <Stack spacing={3}>


                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fffde7', border: '1px solid #fff59d' }}>
                    <CardContent>
                         <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon color="warning" fontSize="small" /> Zorunlu Alanlar
                        </Typography>
                        <List dense>
                            <ListItem>
                                <ListItemText primary="student_name" secondary="Öğrencinin Tam Adı" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="student_email" secondary="Benzersiz olmalı (Giriş için)" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="class_name" secondary="Örn: 12-A (Sistemde kayıtlı olmalı)" />
                            </ListItem>
                            <Divider component="li" />
                            <ListItem>
                                <ListItemText primary="parent_name" secondary="Velinin tam adı" />
                            </ListItem>
                            <Divider component= "li"/>
                            <ListItem>
                                <ListItemText primary="parent_email" secondary="Benzersiz olmalı(giriş için)"/>
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

export default BulkUploadPage;