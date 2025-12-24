import { useEffect, useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  Snackbar,
  IconButton,
} from "@mui/material";

// --- İKONLAR ---
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import TitleIcon from '@mui/icons-material/Title';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';

type News = {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
};

const AdminNewsPage = () => {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);

  // Dialog States
  const [deleteTarget, setDeleteTarget] = useState<News | null>(null);
  const [detailNews, setDetailNews] = useState<News | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get("/news");
      // Tarihe göre yeniden eskiye sıralama
      const sorted = res.data.sort((a: News, b: News) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNewsList(sorted);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCloseCreate = () => {
      setOpenCreate(false);
      setTitle("");
      setContent("");
      setImageUrl("");
      setError("");
  };

  const createNews = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Başlık ve içerik alanları zorunludur.");
      return;
    }

    try {
      await api.post("/news", {
        title,
        content,
        imageUrl: imageUrl.trim() || null,
      });

      handleCloseCreate();
      setMsg("Haber başarıyla yayınlandı.");
      setSnackOpen(true);
      fetchNews();
    } catch (err: any) {
      setError(err.response?.data?.message || "Haber eklenemedi");
    }
  };

  const deleteNews = async () => {
    if (!deleteTarget) return;

    try {
        await api.delete(`/news/${deleteTarget._id}`);
        setDeleteTarget(null);
        setMsg("Haber silindi.");
        setSnackOpen(true);
        fetchNews();
    } catch (err) {
        console.error("Silme hatası");
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 5 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Haber Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary">Kurumsal duyurular ve haberler.</Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setOpenCreate(true)}
            size="large"
            sx={{ borderRadius: 2 }}
        >
            Yeni Haber Ekle
        </Button>
      </Box>

      {/* BOŞ DURUM (EMPTY STATE) */}
      {!loading && newsList.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', borderRadius: 4, border: '1px dashed #ddd' }}>
              <ArticleIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Henüz hiç haber eklenmemiş.</Typography>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={() => setOpenCreate(true)}>İlk Haberi Ekle</Button>
          </Box>
      )}

      {/* HABER KARTLARI (GRID) */}
      <Grid container spacing={3}>
        {newsList.map((n) => (
          <Grid item xs={12} sm={6} md={4} key={n._id}>
            <Card 
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                    }
                }}
            >
              <CardMedia
                component="img"
                height="180"
                // Eğer resim yoksa veya yüklenemezse placeholder göster
                image={n.imageUrl || "https://via.placeholder.com/400x200?text=Haber"} 
                alt={n.title}
                sx={{ objectFit: 'cover' }}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Gorsel+Yok";
                }}
              />

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14 }} />
                    {new Date(n.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
                
                <Typography gutterBottom variant="h6" component="div" sx={{ lineHeight: 1.3, fontWeight: 'bold' }}>
                  {n.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 3, 
                }}>
                  {n.content}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                <Button size="small" onClick={() => setDetailNews(n)} startIcon={<ArticleIcon />}>
                    Oku
                </Button>
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(n)}>
                    <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 🟢 CREATE DIALOG (MODAL) */}
      <Dialog open={openCreate} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Haber Oluştur
            <IconButton onClick={handleCloseCreate} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
                label="Haber Başlığı"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><TitleIcon /></InputAdornment>,
                }}
            />

            <TextField
                label="Haber İçeriği"
                fullWidth
                multiline
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Haber detaylarını buraya yazınız..."
            />

            <TextField
                label="Görsel URL (https://...)"
                fullWidth
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><ImageIcon /></InputAdornment>,
                }}
                helperText="Haber kapak görseli için bir link yapıştırın."
            />

            {/* --- GÖRSEL ÖNİZLEME (DÜZELTİLDİ) --- */}
            {imageUrl && (
                <Box sx={{ mt: 1, p: 1, border: '1px dashed #ccc', borderRadius: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>Önizleme</Typography>
                    <img 
                        key={imageUrl} // ÖNEMLİ: URL değiştiğinde resmi sıfırla
                        src={imageUrl} 
                        alt="Önizleme" 
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, objectFit: 'contain' }}
                        onError={(e) => { 
                            // Resim yüklenemezse placeholder göster
                            e.currentTarget.src = "https://via.placeholder.com/400x200?text=Yuklenemedi";
                        }}
                    />
                </Box>
            )}

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit">Vazgeç</Button>
            <Button onClick={createNews} variant="contained" disableElevation>
                Yayınla
            </Button>
        </DialogActions>
      </Dialog>

      {/* 🔵 DETAIL DIALOG */}
      <Dialog 
        open={!!detailNews} 
        onClose={() => setDetailNews(null)} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{detailNews?.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {detailNews && new Date(detailNews.createdAt).toLocaleString()}
                </Typography>
            </Box>
            <IconButton onClick={() => setDetailNews(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
            {detailNews?.imageUrl && (
            <Box 
                component="img"
                src={detailNews.imageUrl}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Gorsel+Yok"; }}
                sx={{ 
                    width: "100%", 
                    maxHeight: 400, 
                    objectFit: "cover", 
                    borderRadius: 2, 
                    mb: 3,
                    boxShadow: 2 
                }}
            />
            )}
            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.8, fontSize: '1.05rem', color: '#333' }}>
                {detailNews?.content}
            </Typography>
        </DialogContent>
      </Dialog>

      {/* 🔴 DELETE DIALOG */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Haberi Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <b>"{deleteTarget?.title}"</b> başlıklı haberi silmek istediğinize emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
          <Button color="error" variant="contained" onClick={deleteNews}>
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* FEEDBACK SNACKBAR */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdminNewsPage;