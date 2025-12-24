import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  List,
  Chip,
  Alert,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel
} from "@mui/material";

// --- Tarih & Yerelleştirme ---
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/tr"; // Dayjs Türkçe paketi
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import type { PickersDayProps } from "@mui/x-date-pickers/PickersDay";

// --- İkonlar ---
import CircleIcon from '@mui/icons-material/Circle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Türkçe ayarı
dayjs.locale("tr");

type ClassItem = { _id: string; name: string };

type ScheduleItem = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  type: "lesson" | "exam" | "meeting";
  classId?: { _id: string; name: string } | null;
};

// Renk ve İkon Haritası
const typeConfig: Record<
  ScheduleItem["type"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  lesson: { label: "Ders", color: "#1976d2", icon: <SchoolIcon fontSize="small" /> },
  exam: { label: "Sınav", color: "#d32f2f", icon: <AssignmentIcon fontSize="small" /> },
  meeting: { label: "Toplantı", color: "#9c27b0", icon: <GroupsIcon fontSize="small" /> },
};

function startOfMonthISO(d: Dayjs) {
  return d.startOf("month").startOf("day").toDate().toISOString();
}
function endOfMonthISO(d: Dayjs) {
  return d.endOf("month").endOf("day").toDate().toISOString();
}

const ScheduleCalendarWidget = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [monthAnchor, setMonthAnchor] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState("");

  // --- Veri İşleme ---
  const itemsByDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const key = dayjs(it.date).format("YYYY-MM-DD");
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    }
    // Saate göre sırala
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => +new Date(a.date) - +new Date(b.date));
      map.set(k, arr);
    }
    return map;
  }, [items]);

  const selectedKey = selectedDate.format("YYYY-MM-DD");
  const selectedItems = itemsByDay.get(selectedKey) || [];

  const fetchClasses = async () => {
    try {
        const res = await api.get("/classes");
        setClasses(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchScheduleForMonth = async (anchor: Dayjs, clsId: string) => {
    setError("");
    try {
      const params: any = {
        from: startOfMonthISO(anchor),
        to: endOfMonthISO(anchor),
      };
      if (clsId) params.classId = clsId;

      const res = await api.get("/schedule", { params });
      setItems(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Etkinlikler alınamadı");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchScheduleForMonth(monthAnchor, classId);
  }, [monthAnchor, classId]);

  // --- Takvim Günü İşaretleme Mantığı ---
  const dayMeta = useMemo(() => {
    const meta = new Map<string, { hasExam: boolean; hasMeeting: boolean; hasLesson: boolean }>();
    for (const [k, arr] of itemsByDay.entries()) {
      meta.set(k, {
        hasExam: arr.some((x) => x.type === "exam"),
        hasMeeting: arr.some((x) => x.type === "meeting"),
        hasLesson: arr.some((x) => x.type === "lesson"),
      });
    }
    return meta;
  }, [itemsByDay]);

  // DÜZELTME BURADA YAPILDI: PickersDayProps<Dayjs> yerine sadece PickersDayProps
  const renderDay = (props: PickersDayProps) => {
    // props.day'in Dayjs olduğunu garanti etmek için cast edebiliriz veya .format zaten varsa çalışır.
    // Güvenlik için (props.day as Dayjs) diyebilirsin ama MUI genelde doğru infer eder.
    const key = (props.day as Dayjs).format("YYYY-MM-DD");
    const m = dayMeta.get(key);
    const isSelected = (props.day as Dayjs).isSame(selectedDate, 'day');

    return (
      <Box sx={{ position: "relative" }}>
        <PickersDay 
            {...props} 
            sx={{
                fontWeight: isSelected ? 'bold' : 'normal',
                // Bugünün rengini özelleştir
                '&.MuiPickersDay-today': {
                    border: '1px solid #1976d2',
                    backgroundColor: 'transparent',
                    color: '#1976d2'
                },
                // Seçili gün rengi
                '&.Mui-selected': {
                    backgroundColor: '#1976d2 !important',
                    color: '#fff'
                }
            }}
        />
        {/* Alt Noktalar (Dots) */}
        {m && (
          <Box
            sx={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "3px",
            }}
          >
            {m.hasExam && <CircleIcon sx={{ fontSize: 6, color: typeConfig.exam.color }} />}
            {m.hasMeeting && <CircleIcon sx={{ fontSize: 6, color: typeConfig.meeting.color }} />}
            {m.hasLesson && !m.hasExam && !m.hasMeeting && <CircleIcon sx={{ fontSize: 6, color: typeConfig.lesson.color }} />}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, minHeight: 500 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
            Etkinlik Programı
            </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sınıf</InputLabel>
            <Select
            value={classId}
            label="Sınıf"
            onChange={(e) => setClassId(e.target.value)}
            >
            <MenuItem value="">Tümü</MenuItem>
            {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
            </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 4 }}>
        
        {/* SOL: TAKVİM */}
        <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
            <DateCalendar
                value={selectedDate}
                onChange={(v) => v && setSelectedDate(v)}
                onMonthChange={setMonthAnchor}
                slots={{ day: renderDay }}
                sx={{
                    width: '100%',
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    bgcolor: '#fafafa'
                }}
            />
            </LocalizationProvider>
            
            {/* Legend (Açıklama) */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                {Object.entries(typeConfig).map(([key, conf]) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CircleIcon sx={{ fontSize: 10, color: conf.color }} />
                        <Typography variant="caption" color="text.secondary">{conf.label}</Typography>
                    </Box>
                ))}
            </Stack>
        </Box>

        {/* SAĞ: GÜNLÜK LİSTE */}
        <Box sx={{ bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="h6" sx={{ color: '#333' }}>
                {selectedDate.format("DD MMMM YYYY")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {selectedDate.format("dddd")}
            </Typography>
          </Box>

          {!selectedItems.length ? (
            <Box sx={{ textAlign: 'center', py: 5, opacity: 0.6 }}>
                <Box sx={{ fontSize: 48, mb: 1 }}>📭</Box>
                <Typography>Bu tarihte planlanmış etkinlik yok.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {selectedItems.map((it) => {
                  const conf = typeConfig[it.type];
                  return (
                    <Card 
                        key={it._id} 
                        elevation={0}
                        sx={{ 
                            mb: 2, 
                            border: '1px solid #eee',
                            borderLeft: `5px solid ${conf.color}`, // Sol renk vurgusu
                            borderRadius: 2,
                            transition: '0.2s',
                            '&:hover': { boxShadow: 2, transform: 'translateY(-2px)' }
                        }}
                    >
                        <CardContent sx={{ pb: '16px !important', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            {/* İkon Kutusu */}
                            <Box sx={{ 
                                bgcolor: `${conf.color}15`, // %15 opaklık
                                color: conf.color,
                                p: 1, 
                                borderRadius: 2,
                                display: 'flex' 
                            }}>
                                {conf.icon}
                            </Box>
                            
                            {/* İçerik */}
                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {it.title}
                                    </Typography>
                                    <Chip 
                                        label={dayjs(it.date).format("HH:mm")} 
                                        size="small" 
                                        icon={<AccessTimeIcon />}
                                        variant="outlined"
                                        sx={{ border: 'none', bgcolor: '#f5f5f5' }}
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {it.description || "Açıklama yok."}
                                </Typography>
                                
                                {it.classId && (
                                    <Chip 
                                        label={it.classId.name} 
                                        size="small" 
                                        sx={{ 
                                            height: 20, 
                                            fontSize: '0.7rem', 
                                            bgcolor: '#e3f2fd', 
                                            color: '#1565c0' 
                                        }} 
                                    />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                  );
              })}
            </List>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ScheduleCalendarWidget;