import { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import trLocale from '@fullcalendar/core/locales/tr'; // Türkçe dil desteği

import {
  Paper,
  Typography,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  Button,
  FormControl,
  InputLabel,
  Stack,
  IconButton
} from "@mui/material";

// İkonlar
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ClassIcon from '@mui/icons-material/Class';

type ClassItem = { _id: string; name: string };

type ScheduleItem = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  type: "lesson" | "exam" | "meeting";
  classId?: { _id: string; name: string } | null;
};

const typeColor: Record<string, string> = {
  exam: "#d32f2f",     // Kırmızı
  lesson: "#1976d2",   // Mavi
  meeting: "#9c27b0",  // Mor
};

const typeLabel: Record<string, string> = {
  exam: "Sınav",
  lesson: "Ders",
  meeting: "Toplantı",
};

const FullCalendarWidget = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  
  // Takvim API'sine erişmek için ref (Filtre değişince takvimi yenilemek için)
  const calendarRef = useRef<FullCalendar>(null);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data);
    } catch (error) {
      console.error("Sınıflar yüklenemedi", error);
    }
  };

  const fetchEvents = async (start: string, end: string) => {
    try {
      const res = await api.get("/schedule", {
        params: {
          from: start,
          to: end,
          classId: classId || undefined,
        },
      });

      setEvents(
        res.data.map((e: ScheduleItem) => ({
          id: e._id,
          title: e.title,
          start: e.date,
          // FullCalendar event objesi
          backgroundColor: typeColor[e.type] + '20', // %20 opaklık (Arka plan soft olsun)
          borderColor: typeColor[e.type],
          textColor: typeColor[e.type], // Yazı rengi koyu olsun
          extendedProps: e,
          classNames: ['custom-calendar-event'] // CSS özelleştirmesi için class
        }))
      );
    } catch (error) {
      console.error("Etkinlikler yüklenemedi", error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Sınıf seçimi değişince takvimi yenile (Mevcut görünümü tekrar çekmesini tetikler)
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // Mevcut tarih aralığı için fetchEvents'i tetikler
      calendarApi.refetchEvents();
    }
  }, [classId]);

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
      
      {/* --- HEADER: Başlık ve Filtre --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
            <Typography variant="h6" fontWeight="bold">
            Akademik Takvim
            </Typography>
            {/* Legend (Renk Açıklamaları) */}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {Object.keys(typeLabel).map((key) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: typeColor[key] }} />
                        <Typography variant="caption" color="text.secondary">{typeLabel[key]}</Typography>
                    </Box>
                ))}
            </Stack>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sınıf Filtrele</InputLabel>
          <Select
            value={classId}
            label="Sınıf Filtrele"
            onChange={(e) => setClassId(e.target.value)}
          >
            <MenuItem value=""><em>Tüm Sınıflar</em></MenuItem>
            {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* --- TAKVİM BİLEŞENİ --- */}
      {/* FullCalendar Style Override */}
      <Box sx={{
        '& .fc-button-primary': {
            backgroundColor: '#1976d2',
            borderColor: '#1976d2',
            textTransform: 'capitalize',
            '&:hover': { backgroundColor: '#1565c0' }
        },
        '& .fc-event': {
            cursor: 'pointer',
            borderRadius: '4px',
            borderLeftWidth: '4px', // Sol kenarı kalın yap
            padding: '2px 4px',
            fontSize: '0.85rem',
            fontWeight: 500
        },
        '& .fc-toolbar-title': {
            fontSize: '1.2rem',
            fontWeight: 'bold'
        },
        '& .fc-day-today': {
            backgroundColor: 'rgba(25, 118, 210, 0.04) !important'
        }
      }}>
        <FullCalendar
            ref={calendarRef}
            locale={trLocale} // TÜRKÇE DİL DESTEĞİ
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="auto"
            headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
                today: 'Bugün',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün'
            }}
            events={events}
            datesSet={(arg) => {
                fetchEvents(arg.startStr, arg.endStr);
            }}
            eventClick={(info) => {
                setSelected(info.event.extendedProps as ScheduleItem);
            }}
            eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            }}
        />
      </Box>

      {/* --- DETAY MODAL (POPUP) --- */}
      <Dialog 
        open={!!selected} 
        onClose={() => setSelected(null)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selected && (
            <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                        width: 8, height: 32, 
                        bgcolor: typeColor[selected.type], 
                        borderRadius: 1 
                    }} />
                    <Typography variant="h6">{typeLabel[selected.type]}</Typography>
                </Box>
                <IconButton onClick={() => setSelected(null)} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                 <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {selected.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {selected.description || "Açıklama girilmemiş."}
                    </Typography>
                 </Box>

                 <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <EventIcon color="action" />
                        <Typography variant="body1">
                             {new Date(selected.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <AccessTimeIcon color="action" />
                        <Typography variant="body1">
                            {new Date(selected.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Box>
                    {selected.classId && (
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <ClassIcon color="action" />
                            <Chip 
                                label={selected.classId.name} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                            />
                        </Box>
                    )}
                 </Stack>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={() => setSelected(null)}>Kapat</Button>
                {/* İstersen buraya 'Düzenle' butonu da ekleyebilirsin */}
            </DialogActions>
            </>
        )}
      </Dialog>
    </Paper>
  );
};

export default FullCalendarWidget;