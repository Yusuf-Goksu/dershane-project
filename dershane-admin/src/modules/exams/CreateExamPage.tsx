import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Chip
} from "@mui/material";

// İkonlar
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TitleIcon from '@mui/icons-material/Title';
import EventIcon from '@mui/icons-material/Event';
import ClassIcon from '@mui/icons-material/Class';
import BarChartIcon from '@mui/icons-material/BarChart';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import NumbersIcon from '@mui/icons-material/Numbers';

type ClassItem = {
  _id: string;
  name: string;
};

type Subject = {
  _id: string;
  name: string;
};

type SelectedSubject = {
  subjectId: string;
  questionCount: number;
};

const CreateExamPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [classId, setClassId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Promise.all ile iki isteği paralel atıp bekleyelim (Performans)
    Promise.all([
        api.get("/classes"),
        api.get("/subjects")
    ]).then(([classRes, subjectRes]) => {
        setClasses(classRes.data);
        setSubjects(subjectRes.data);
    }).catch(err => console.error(err));
  }, []);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const exists = prev.find((s) => s.subjectId === subjectId);
      if (exists) {
        return prev.filter((s) => s.subjectId !== subjectId);
      }
      return [...prev, { subjectId, questionCount: 10 }]; // Varsayılan 10 soru ile başlasın
    });
  };

  const updateQuestionCount = (subjectId: string, value: number) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.subjectId === subjectId
          ? { ...s, questionCount: value }
          : s
      )
    );
  };

  const submit = async () => {
    setError("");

    if (!title || !date || !classId || !selectedSubjects.length) {
      setError("Lütfen temel bilgileri doldurun ve en az bir ders seçin.");
      return;
    }

    for (const s of selectedSubjects) {
      if (!s.questionCount || s.questionCount <= 0) {
        setError("Seçilen dersler için geçerli bir soru sayısı girilmelidir.");
        return;
      }
    }

    try {
      setLoading(true);
      await api.post("/exams", {
        title,
        date,
        classId,
        difficulty,
        subjects: selectedSubjects,
      });
      navigate("/admin/exams");
    } catch (err: any) {
      setError(err.response?.data?.message || "Deneme oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  // Toplam soru sayısını hesapla (UI'da göstermek için güzel bir detay)
  const totalQuestions = selectedSubjects.reduce((acc, curr) => acc + curr.questionCount, 0);

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 4 }}>
      
      {/* HEADER ALANI */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate("/admin/exams")}
            sx={{ color: 'text.secondary' }}
        >
            Geri
        </Button>
        <Typography variant="h5" fontWeight="bold">Yeni Deneme Sınavı Oluştur</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        
        {/* SOL KOLON: GENEL BİLGİLER */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                <ClassIcon />
                <Typography variant="h6">Sınav Bilgileri</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Deneme Adı"
                placeholder="Örn: 1. Dönem Tarama Sınavı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                InputProps={{
                    startAdornment: <InputAdornment position="start"><TitleIcon /></InputAdornment>,
                }}
              />

              <TextField
                label="Tarih"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
                InputProps={{
                    startAdornment: <InputAdornment position="start"><EventIcon /></InputAdornment>,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Sınıf Seviyesi</InputLabel>
                <Select
                  value={classId}
                  label="Sınıf Seviyesi"
                  onChange={(e) => setClassId(e.target.value)}
                  startAdornment={<InputAdornment position="start"><ClassIcon /></InputAdornment>}
                >
                  {classes.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Zorluk Seviyesi</InputLabel>
                <Select
                  value={difficulty}
                  label="Zorluk Seviyesi"
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  startAdornment={<InputAdornment position="start"><BarChartIcon /></InputAdornment>}
                >
                  <MenuItem value="easy">Kolay</MenuItem>
                  <MenuItem value="medium">Orta</MenuItem>
                  <MenuItem value="hard">Zor</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Aksiyon Butonları (Mobilde altta, masaüstünde sol panelin altında) */}
          <Paper sx={{ p: 2, mt: 3, borderRadius: 2 }}>
            <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<SaveIcon />}
                onClick={submit}
                disabled={loading}
                sx={{ mb: 1, height: 48 }}
            >
                {loading ? "Kaydediliyor..." : "Sınavı Oluştur"}
            </Button>
          </Paper>
        </Grid>

        {/* SAĞ KOLON: DERS SEÇİMİ */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, minHeight: 500 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                    <LibraryBooksIcon />
                    <Typography variant="h6">Dersler ve Soru Dağılımı</Typography>
                </Box>
                <Chip 
                    label={`Toplam Soru: ${totalQuestions}`} 
                    color="primary" 
                    variant="outlined" 
                    icon={<NumbersIcon />}
                />
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
                {subjects.map((s) => {
                    const selected = selectedSubjects.find((x) => x.subjectId === s._id);
                    
                    return (
                        <Grid item xs={12} sm={6} key={s._id}>
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    border: '1px solid',
                                    borderColor: selected ? 'primary.main' : 'divider',
                                    borderRadius: 2,
                                    backgroundColor: selected ? 'primary.50' : 'transparent', // Seçilince hafif renk
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!selected}
                                            onChange={() => toggleSubject(s._id)}
                                        />
                                    }
                                    label={
                                        <Typography fontWeight={selected ? 'bold' : 'normal'}>
                                            {s.name}
                                        </Typography>
                                    }
                                />
                                
                                {selected && (
                                    <TextField
                                        label="Soru Sayısı"
                                        type="number"
                                        size="small"
                                        value={selected.questionCount}
                                        onChange={(e) => updateQuestionCount(s._id, Number(e.target.value))}
                                        fullWidth
                                        InputProps={{ inputProps: { min: 1 } }}
                                        autoFocus // Açılınca odaklansın
                                        sx={{ bgcolor: 'white' }}
                                    />
                                )}
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default CreateExamPage;