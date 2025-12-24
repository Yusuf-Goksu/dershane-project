import { useEffect, useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

// --- İKONLAR ---
import GroupIcon from "@mui/icons-material/Group";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";

// --- BİLEŞENLER ---
import FullCalendarWidget from "./FullCalendarWidget";
import ScheduleCalendarWidget from "./ScheduleCalendarWidget";

// --- TİPLER ---
type DashboardStats = {
  totalStudents: number;
  totalParents: number;
  totalTeachers: number;
  totalExams: number;
};

// --- KPI KART BİLEŞENİ ---
const StatCard = ({ title, value, icon, color }: any) => (
  <Card sx={{ height: "100%", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography color="text.secondary" variant="subtitle2" fontWeight="bold" sx={{ textTransform: "uppercase", mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#333" }}>
            {value}
          </Typography>
        </Box>
        <Avatar variant="rounded" sx={{ bgcolor: `${color}15`, color: color, width: 64, height: 64 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const resStats = await api.get("/admin/dashboard-stats");
      setStats(resStats.data);
    } catch (err: any) {
      console.error("Dashboard veri hatası:", err);
      setError("İstatistikler alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1600, margin: "0 auto", pb: 4 }}>
      
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Yönetim Paneli</Typography>
          <Typography variant="body2" color="text.secondary">Genel bakış ve akademik takvim.</Typography>
        </Box>
        <Button 
            onClick={fetchDashboardData} 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            sx={{ borderRadius: 2 }}
        >
            Yenile
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* 1. İSTATİSTİK KARTLARI */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Toplam Öğrenci" 
            value={stats?.totalStudents || 0} 
            icon={<GroupIcon fontSize="large" />} 
            color="#1976d2" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Kayıtlı Veli" 
            value={stats?.totalParents || 0} 
            icon={<FamilyRestroomIcon fontSize="large" />} 
            color="#9c27b0" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Öğretmen Sayısı" 
            value={stats?.totalTeachers || 0} 
            icon={<SupervisorAccountIcon fontSize="large" />} 
            color="#ed6c02" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Toplam Sınav" 
            value={stats?.totalExams || 0} 
            icon={<AssignmentIcon fontSize="large" />} 
            color="#2e7d32" 
          />
        </Grid>
      </Grid>

      {/* 2. TAKVİM BİLEŞENLERİ (Alt Alta Düzen) */}
      <Grid container spacing={3}>
        
        {/* Üstte: Büyük Takvim */}
        <Grid item xs={12}>
             <FullCalendarWidget />
        </Grid>

        {/* Altta: Etkinlik Programı / Küçük Takvim */}
        {/* İsterseniz çok yayılmasın diye md={6} yapıp ortalayabilirsiniz, ama xs={12} tam genişlik yapar */}
        <Grid item xs={12}>
             <ScheduleCalendarWidget />
        </Grid>
        
      </Grid>

    </Box>
  );
};

export default DashboardPage;