import { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api";
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
  Paper,
  Chip,
  LinearProgress,
  Grid,
  FormControl,
  InputLabel,
  Stack,
  Card,
  CardContent,
  Avatar,
  CircularProgress
} from "@mui/material";

// --- İKONLAR ---
import TimelineIcon from '@mui/icons-material/Timeline';
import ClassIcon from '@mui/icons-material/Class';
import SubjectIcon from '@mui/icons-material/MenuBook';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonIcon from '@mui/icons-material/Person';

type ClassItem = { _id: string; name: string; };
type Subject = { _id: string; name: string; };

type TopicProgress = {
  topicId: string;
  topicName: string;
  order: number;
  status: "planned" | "in_progress" | "completed";
  updatedAt: string | null;
  updatedBy?: { name: string; email: string; } | null;
};

// Durum Konfigürasyonu (Renk ve İkon)
const statusConfig: Record<string, { label: string; color: "default" | "primary" | "success" | "warning"; icon: React.ReactNode }> = {
  planned: { label: "Planlandı", color: "default", icon: <RadioButtonUncheckedIcon fontSize="small" /> },
  in_progress: { label: "İşleniyor", color: "primary", icon: <AutorenewIcon fontSize="small" /> },
  completed: { label: "Tamamlandı", color: "success", icon: <CheckCircleIcon fontSize="small" /> },
};

const TopicProgressPage = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [rows, setRows] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false); // Arama yapıldı mı?

  useEffect(() => {
    // Dropdown verilerini çek
    Promise.all([
        api.get("/classes"),
        api.get("/subjects")
    ]).then(([resClasses, resSubjects]) => {
        setClasses(resClasses.data);
        setSubjects(resSubjects.data);
    });
  }, []);

  const fetchProgress = async () => {
    if (!classId || !subjectId) return;
    
    setLoading(true);
    setFetched(true);
    try {
        const res = await api.get(`/topic-coverage/class/${classId}/subject/${subjectId}`);
        // Sıraya göre dizelim (Order)
        const sorted = res.data.sort((a: TopicProgress, b: TopicProgress) => a.order - b.order);
        setRows(sorted);
    } catch (error) {
        console.error("Veri çekilemedi", error);
    } finally {
        setLoading(false);
    }
  };

  // --- İSTATİSTİK HESAPLAMA ---
  const stats = useMemo(() => {
      const total = rows.length;
      if (total === 0) return { percent: 0, completed: 0, remaining: 0 };
      
      const completed = rows.filter(r => r.status === 'completed').length;
      return {
          percent: Math.round((completed / total) * 100),
          completed,
          remaining: total - completed
      };
  }, [rows]);

  return (
    <Box sx={{ maxWidth: 1100, margin: '0 auto', pb: 5 }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="primary" /> Konu İlerleyiş Takibi
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Sınıfların müfredat tamamlama durumlarını buradan inceleyebilirsiniz.
        </Typography>
      </Box>

      {/* FILTER BAR */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mr: 1 }}>
                <FilterListIcon />
            </Box>

            <FormControl fullWidth size="small">
                <InputLabel>Sınıf Seçiniz</InputLabel>
                <Select
                    value={classId}
                    label="Sınıf Seçiniz"
                    onChange={(e) => setClassId(e.target.value)}
                    startAdornment={<ClassIcon color="action" sx={{ mr: 1, fontSize: 20 }} />}
                >
                    {classes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth size="small">
                <InputLabel>Ders Seçiniz</InputLabel>
                <Select
                    value={subjectId}
                    label="Ders Seçiniz"
                    onChange={(e) => setSubjectId(e.target.value)}
                    startAdornment={<SubjectIcon color="action" sx={{ mr: 1, fontSize: 20 }} />}
                >
                    {subjects.map((s) => (
                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button 
                variant="contained" 
                onClick={fetchProgress} 
                disabled={loading || !classId || !subjectId}
                sx={{ minWidth: 120, height: 40 }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Analiz Et"}
            </Button>
        </Stack>
      </Paper>

      {/* SONUÇ ALANI */}
      {fetched && (
          <>
            {rows.length > 0 ? (
                <Grid container spacing={3}>
                    {/* ÖZET KART (PROGRESS) */}
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{ bgcolor: '#f8faff', border: '1px solid #e3f2fd' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress variant="determinate" value={stats.percent} size={60} thickness={4} />
                                    <Box sx={{
                                        top: 0, left: 0, bottom: 0, right: 0,
                                        position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Typography variant="caption" component="div" color="text.secondary" fontWeight="bold">
                                            %{stats.percent}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">Müfredat Tamamlanma Oranı</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam <b>{rows.length}</b> konudan <b>{stats.completed}</b> tanesi tamamlandı.
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* DETAYLI TABLO */}
                    <Grid item xs={12}>
                        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid #eee' }} elevation={0}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', width: 60 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Konu Adı</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Güncelleyen</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Tarih</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((r) => {
                                        const conf = statusConfig[r.status] || statusConfig.planned;
                                        return (
                                            <TableRow key={r.topicId} hover>
                                                <TableCell sx={{ color: 'text.secondary' }}>{r.order}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{r.topicName}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        icon={conf.icon as any} 
                                                        label={conf.label} 
                                                        color={conf.color as any} 
                                                        size="small" 
                                                        variant={r.status === 'planned' ? 'outlined' : 'filled'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {r.updatedBy ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: '#eee', color: '#666' }}>
                                                                <PersonIcon fontSize="inherit" />
                                                            </Avatar>
                                                            <Typography variant="body2">{r.updatedBy.name}</Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">-</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" color="text.secondary">
                                                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "-"}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                </Grid>
            ) : (
                /* BOŞ DURUM */
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fafafa', borderRadius: 2, border: '1px dashed #ddd' }}>
                    <TimelineIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Kayıt Bulunamadı</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Bu sınıf ve ders için henüz müfredat veya ilerleme kaydı oluşturulmamış.
                    </Typography>
                </Box>
            )}
          </>
      )}

      {!fetched && (
          <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.5 }}>
              <Typography variant="body1">Lütfen yukarıdan bir sınıf ve ders seçerek "Analiz Et" butonuna basınız.</Typography>
          </Box>
      )}

    </Box>
  );
};

export default TopicProgressPage;