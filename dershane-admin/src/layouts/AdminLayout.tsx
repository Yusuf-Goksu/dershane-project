import React from 'react';
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Button,
  ListSubheader
} from "@mui/material";

// --- İKONLARIN IMPORT EDİLMESİ ---
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings'; 
import PeopleIcon from '@mui/icons-material/People'; // Öğretmenler
import SchoolIcon from '@mui/icons-material/School'; // Öğrenciler (YENİ)
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'; // Veliler (YENİ)
import UploadFileIcon from '@mui/icons-material/UploadFile'; 
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; 
import ClassIcon from '@mui/icons-material/Class'; 
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import CategoryIcon from '@mui/icons-material/Category'; 
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; 
import PostAddIcon from '@mui/icons-material/PostAdd'; 
import QuizIcon from '@mui/icons-material/Quiz'; 
import CampaignIcon from '@mui/icons-material/Campaign'; 
import EventIcon from '@mui/icons-material/Event'; 
import LogoutIcon from '@mui/icons-material/Logout'; 

const DRAWER_WIDTH = 280;

// Menü konfigürasyonu
const menuItems = [
  {
    category: "Genel",
    items: [
      { text: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
      { text: "Bildirim Ayarları", path: "/admin/notification-settings", icon: <SettingsIcon /> },
    ]
  },
  {
    category: "Kullanıcı & Kayıt",
    items: [
      { text: "Öğretmenler", path: "/admin/teachers", icon: <PeopleIcon /> },
      { text: "Veliler", path: "/admin/parents", icon: <FamilyRestroomIcon /> }, // ✅ EKLENDİ
      { text: "Öğrenciler", path: "/admin/students", icon: <SchoolIcon /> }, // ✅ EKLENDİ
      { text: "Toplu Kayıt", path: "/admin/users/bulk-upload", icon: <UploadFileIcon /> },
      { text: "Öğretmen Atama", path: "/admin/academics/assignments", icon: <AssignmentIndIcon /> },
    ]
  },
  {
    category: "Akademik Yönetim",
    items: [
      { text: "Sınıflar", path: "/admin/academics/classes", icon: <ClassIcon /> },
      { text: "Dersler", path: "/admin/academics/subjects", icon: <MenuBookIcon /> },
      { text: "Konular", path: "/admin/academics/topics", icon: <CategoryIcon /> },
      { text: "Konu İlerleyişi", path: "/admin/academics/progress", icon: <TrendingUpIcon /> },
      { text: "Müfredat Yükle", path: "/admin/academics/curriculum-upload", icon: <PostAddIcon /> },
    ]
  },
  {
    category: "Sınav & İçerik",
    items: [
      { text: "Denemeler", path: "/admin/exams", icon: <QuizIcon /> },
      { text: "Haberler", path: "/admin/news", icon: <CampaignIcon /> },
      { text: "Etkinlikler", path: "/admin/schedule", icon: <EventIcon /> },
    ]
  }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); 

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* --- ÜST HEADER --- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#1976d2', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" noWrap component="div" fontWeight="bold">
              Dershane Admin Panel
            </Typography>
          </Box>
          
          <Button 
            color="inherit" 
            onClick={logout} 
            startIcon={<LogoutIcon />}
            sx={{ textTransform: 'none', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
          >
            Çıkış
          </Button>
        </Toolbar>
      </AppBar>

      {/* --- SOL MENÜ (SIDEBAR) --- */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: DRAWER_WIDTH, 
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            borderRight: '1px solid #e0e0e0'
          },
        }}
      >
        <Toolbar />
        
        <Box sx={{ overflow: 'auto', py: 2 }}>
          <List>
            {menuItems.map((group, index) => (
              <React.Fragment key={index}>
                <ListSubheader sx={{ 
                    fontWeight: 'bold', 
                    lineHeight: '32px', 
                    color: '#1976d2', 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    mt: index > 0 ? 2 : 0
                  }}>
                  {group.category}
                </ListSubheader>
                
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <ListItem key={item.path} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                      <ListItemButton 
                        onClick={() => navigate(item.path)}
                        selected={isActive}
                        sx={{
                          minHeight: 48,
                          justifyContent: 'initial',
                          px: 2.5,
                          mx: 1,
                          borderRadius: '0 24px 24px 0',
                          borderLeft: isActive ? '4px solid #1976d2' : '4px solid transparent',
                          transition: 'all 0.2s',
                          '&.Mui-selected': {
                            backgroundColor: '#e3f2fd',
                            color: '#1565c0',
                            '&:hover': { backgroundColor: '#bbdefb' },
                            '& .MuiListItemIcon-root': { color: '#1565c0' }
                          },
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: 'center', color: '#757575' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }} 
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
                {index < menuItems.length - 1 && <Divider sx={{ my: 1, mx: 2, opacity: 0.6 }} />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* --- ANA İÇERİK (FIX) --- */}
      <Box 
        component="main" 
        sx={{ 
            flexGrow: 1, 
            p: 3, 
            backgroundColor: '#f8f9fa', 
            minHeight: '100vh',
            // 🔥 TAŞMA SORUNUNU ÇÖZEN KISIM 🔥
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, 
            overflowX: 'hidden' // Yatay kaydırma çubuğunu gizle
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;