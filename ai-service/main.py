from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from statistics import mean
import unicodedata

app = FastAPI()

# ---------- MODELLER ----------

class SubjectInput(BaseModel):
    subjectName: str
    correct: int
    wrong: int
    blank: int

class ExamInput(BaseModel):
    date: str
    difficulty: str  # easy | medium | hard
    subjects: List[SubjectInput]
    totalNet: float

class ClassStat(BaseModel):
    subjectName: str
    classNormalizedScore: float

class AnalyzeRequest(BaseModel):
    studentId: str
    examId: str
    currentExam: ExamInput
    previousExams: List[ExamInput] = []
    classStats: Optional[List[ClassStat]] = None


class SubjectStatOut(BaseModel):
    subjectName: str
    normalizedScore: float
    trend: str
    classPosition: str
    comment: str

class AnalysisOut(BaseModel):
    overallTrend: str
    difficultyAdjustedScore: float
    subjectStats: List[SubjectStatOut]
    aiComments: List[str]

class AnalyzeResponse(BaseModel):
    studentId: str
    examId: str
    analysis: AnalysisOut
    
# Türkçe karakterleri ve unicode farklarını normalize eder
def normalize_subject(text: str) -> str:         
    return unicodedata.normalize("NFKD", text).casefold().strip()

# ---------- YARDIMCI FONKSİYONLAR ----------

DIFFICULTY_COEFF = {
    "easy": 1.0,
    "medium": 1.15,
    "hard": 1.3
}

def calc_normalized(correct: int, wrong: int, blank: int) -> float:
    total = correct + wrong + blank
    if total == 0:
        return 0.0
    return correct / total

def calc_difficulty_adjusted_score(exam: ExamInput) -> float:
    coeff = DIFFICULTY_COEFF.get(exam.difficulty, 1.0)
    # totalNet zaten var, direkt çarpıp makul aralığa çekiyoruz
    raw = exam.totalNet * coeff
    # 0–100 aralığına sıkıştır (istersen değiştirebilirsin)
    return max(0.0, min(100.0, raw))

def determine_trend(current_value: float, previous_values: List[float]) -> str:
    if not previous_values:
        return "stable"

    prev_avg = mean(previous_values)
    diff = current_value - prev_avg

    # normalized score range: 0–1
    if diff > 0.05:
        return "rising"
    elif diff < -0.05:
        return "falling"
    else:
        return "stable"


def determine_class_position(student_score: float, class_score: Optional[float]) -> str:
    if class_score is None:
        return "unknown"
    diff = student_score - class_score
    if diff >= 0.10:
        return "above"
    elif diff <= -0.10:
        return "below"
    else:
        return "average"
    
def generate_general_comment(overall_trend, subject_stats, diff_score):
    rising_count = len([s for s in subject_stats if s.trend == "rising"])
    falling_count = len([s for s in subject_stats if s.trend == "falling"])
    stable_count = len([s for s in subject_stats if s.trend == "stable"])

    comments = []

    # 1) Overall trend yorumu
    if overall_trend == "rising":
        comments.append("Genel performansında belirgin bir yükseliş trendi görülüyor.")
    elif overall_trend == "falling":
        comments.append("Son dönemde performansında bir miktar düşüş gözlemleniyor.")
    else:
        comments.append("Performansın genel olarak stabil bir şekilde ilerliyor.")

    # 2) Ders bazlı özet
    if rising_count >= 3:
        comments.append(f"{rising_count} derste kayda değer bir ilerleme göstermişsin. Bu oldukça olumlu bir gelişme.")
    elif rising_count == 1 or rising_count == 2:
        comments.append(f"Bazı derslerde yükseliş mevcut ({rising_count} ders).")
    
    if falling_count >= 2:
        comments.append(f"{falling_count} derste düşüş eğilimi gözlemleniyor. Bu derslere biraz daha odaklanman faydalı olabilir.")
    elif falling_count == 1:
        comments.append("Bir derste düşüş görülüyor, bu alanda biraz ek çalışma yapabilirsin.")

    if stable_count >= 3 and rising_count == 0:
        comments.append("Çoğu dersin stabil seyrediyor. Daha yüksek seviyeye çıkmak için küçük ek çalışmalar etkili olabilir.")

    # 3) Zorluk etkisi
    if diff_score >= 80:
        comments.append("Zorlu sınavlarda bile performansını koruman güçlü bir başarı göstergesi.")
    elif diff_score <= 40:
        comments.append("Zorlayıcı sınavlarda netlerinde düşüş gözleniyor. Konu tekrarları yardımcı olabilir.")

    return comments


# ---------- ENDPOINT ----------

@app.post("/analyze-exam", response_model=AnalyzeResponse)
def analyze_exam(payload: AnalyzeRequest):
    cur = payload.currentExam
    prev = payload.previousExams
    class_stats = {c.subjectName: c.classNormalizedScore for c in (payload.classStats or [])}

    print("PREV EXAMS:", payload.previousExams)

    # 1) overall difficulty-adjusted score
    current_adjusted = calc_difficulty_adjusted_score(cur)
    previous_adjusteds = [calc_difficulty_adjusted_score(e) for e in prev]
    overall_trend = determine_trend(current_adjusted, previous_adjusteds)

    # 2) subject bazlı analiz
    subject_stats_out: List[SubjectStatOut] = []
    subject_comments: List[str] = []

    for subj in cur.subjects:
        name = subj.subjectName
        norm = calc_normalized(subj.correct, subj.wrong, subj.blank)

        # önceki sınavlarda aynı dersi bul
        prev_norms = []
        for e in prev:
            for s in e.subjects:
                if normalize_subject(s.subjectName) == normalize_subject(name):
                    prev_norms.append(calc_normalized(s.correct, s.wrong, s.blank))

        subj_trend = determine_trend(norm, prev_norms)
        class_norm = class_stats.get(name)
        class_pos = determine_class_position(norm, class_norm)

        # Subject bazlı yorumlar
        if subj_trend == "rising":
            subject_comments.append(f"{name} dersinde performansın yükseliş gösteriyor.")
        elif subj_trend == "falling":
            subject_comments.append(f"{name} dersinde son sınavlara göre düşüş mevcut.")
        else:
            subject_comments.append(f"{name} dersinde performansın stabil ilerliyor.")

        if class_pos == "above":
            subject_comments.append(f"{name} dersinde sınıf ortalamasının üzerindesin.")
        elif class_pos == "below":
            subject_comments.append(f"{name} dersinde sınıf ortalamasının gerisindesin.")

        subject_stats_out.append(
            SubjectStatOut(
                subjectName=name,
                normalizedScore=round(norm, 3),
                trend=subj_trend,
                classPosition=class_pos,
                comment=f"{name}: trend={subj_trend}, classPos={class_pos}"
            )
        )

    # 3) Genel yorum motoru
    general_comments = generate_general_comment(
        overall_trend,
        subject_stats_out,
        current_adjusted
    )

    # Birleştirilmiş yorumlar
    ai_comments = subject_comments + general_comments

    analysis = AnalysisOut(
        overallTrend=overall_trend,
        difficultyAdjustedScore=round(current_adjusted, 1),
        subjectStats=subject_stats_out,
        aiComments=ai_comments
    )

    return AnalyzeResponse(
        studentId=payload.studentId,
        examId=payload.examId,
        analysis=analysis
    )
