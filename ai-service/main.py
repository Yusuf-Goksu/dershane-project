from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from statistics import mean
from datetime import datetime

app = FastAPI(title="Dershane AI Analytics Service", version="2.0")


# -----------------------------
# Pydantic Models (Input)
# -----------------------------

Difficulty = Literal["easy", "medium", "hard"]


class CurrentSubjectIn(BaseModel):
    subject: str
    net: float


class CurrentExamIn(BaseModel):
    date: Optional[str] = None
    difficulty: Difficulty
    totalNet: float
    subjects: List[CurrentSubjectIn]


class PreviousExamIn(BaseModel):
    date: Optional[str] = None
    difficulty: Difficulty
    totalNet: float


class DifficultyConfigIn(BaseModel):
    easy: float = 0.9
    medium: float = 1.0
    hard: float = 1.1


class ClassSubjectCtxIn(BaseModel):
    subject: str
    studentNet: float
    classAvgNet: float
    delta: float


class ClassContextIn(BaseModel):
    classAvgTotalNet: float
    studentRank: int
    studentCount: int
    percentile: float
    subjects: List[ClassSubjectCtxIn]


class AnalyzeRequest(BaseModel):
    studentId: str
    examId: str

    currentExam: CurrentExamIn
    previousExams: List[PreviousExamIn] = Field(default_factory=list)

    difficultyConfig: DifficultyConfigIn = DifficultyConfigIn()
    classContext: ClassContextIn


# -----------------------------
# Pydantic Models (Output)
# -----------------------------

class SubjectMetricOut(BaseModel):
    subject: str
    studentNet: float
    classAvgNet: float
    delta: float
    position: Literal["above", "below", "average"]


class MetricsOut(BaseModel):
    trend: Literal["rising", "falling", "stable", "no_history"]
    difficultyAdjustedNet: float
    previousAvgDifficultyAdjustedNet: Optional[float] = None

    studentTotalNet: float
    classAvgTotalNet: float
    deltaTotalNet: float

    studentRank: int
    studentCount: int
    percentile: float

    subjectComparisons: List[SubjectMetricOut]


class AnalyzeResponse(BaseModel):
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    metrics: MetricsOut


# -----------------------------
# Helpers
# -----------------------------

def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    # esnek parse: "2025-12-17" gibi
    try:
        return datetime.fromisoformat(date_str)
    except Exception:
        return None


def coeff_for(difficulty: Difficulty, cfg: DifficultyConfigIn) -> float:
    return {"easy": cfg.easy, "medium": cfg.medium, "hard": cfg.hard}.get(difficulty, 1.0)


def classify_position(delta: float, threshold: float = 1.0) -> str:
    """
    threshold: net farkı kaç olunca anlamlı sayacağız?
    (TYT/AYT netlerde 1.0 genelde anlamlı bir eşik)
    """
    if delta >= threshold:
        return "above"
    if delta <= -threshold:
        return "below"
    return "average"


def compute_trend(current_adj: float, prev_adj_list: List[float], rel_threshold: float = 0.05) -> str:
    """
    rel_threshold: yüzde fark eşiği (%5 gibi)
    """
    if not prev_adj_list:
        return "no_history"

    prev_avg = mean(prev_adj_list)
    if prev_avg == 0:
        return "stable"

    ratio = (current_adj - prev_avg) / abs(prev_avg)
    if ratio > rel_threshold:
        return "rising"
    if ratio < -rel_threshold:
        return "falling"
    return "stable"


def build_summary(trend: str, delta_total: float, percentile: float) -> str:
    # kısa, Flutter’da rahat okunur
    perf_part = "sınıf ortalamasına yakın bir performans" if abs(delta_total) < 2 else (
        "sınıf ortalamasının üzerinde bir performans" if delta_total > 0 else "sınıf ortalamasının altında bir performans"
    )

    trend_part = {
        "rising": "Genel eğilim yükselişte.",
        "falling": "Genel eğilim düşüşte.",
        "stable": "Genel eğilim stabil.",
        "no_history": "Geçmiş deneme verisi az olduğu için trend sınırlı değerlendirildi."
    }[trend]

    return f"Bu denemede {perf_part} sergiledin. {trend_part} Yüzdelik dilimin yaklaşık %{round(percentile)}."


def build_recommendations(trend: str, weak_subjects: List[str]) -> List[str]:
    recs: List[str] = []

    if trend == "falling":
        recs.append("Son denemelere göre düşüş var: soru çözüm rutinini ve deneme stratejini gözden geçir.")
    elif trend == "rising":
        recs.append("Yükseliş eğilimini korumak için deneme analizini düzenli yap ve yanlışlara yönelik tekrar planı oluştur.")
    elif trend == "stable":
        recs.append("Performans stabil: artış için hedef derslere odaklı ek çalışma planı oluştur.")

    if weak_subjects:
        recs.append(f"Öncelikli geliştirme alanları: {', '.join(weak_subjects)}. Bu derslerde konu + soru dengesi kur.")
        recs.append("Yanlış çıkan sorular için: konu özeti → 20-30 soru → mini tekrar döngüsü uygula.")

    # genel öneri
    recs.append("Deneme sonrası: yanlış/boş soruları mutlaka sınıflandır (konu, dikkat, hız, bilgi) ve haftalık takip et.")
    return recs


# -----------------------------
# Endpoint
# -----------------------------

@app.post("/analyze-exam", response_model=AnalyzeResponse)
def analyze_exam(req: AnalyzeRequest):
    cfg = req.difficultyConfig

    # 1) Difficulty-adjusted nets
    current_coeff = coeff_for(req.currentExam.difficulty, cfg)
    current_adj = req.currentExam.totalNet * current_coeff

    prev_adj_list: List[float] = []
    for p in req.previousExams[:5]:
        prev_adj_list.append(p.totalNet * coeff_for(p.difficulty, cfg))

    prev_avg_adj = mean(prev_adj_list) if prev_adj_list else None
    trend = compute_trend(current_adj, prev_adj_list, rel_threshold=0.05)

    # 2) Class comparisons (total)
    student_total = req.currentExam.totalNet
    class_avg_total = req.classContext.classAvgTotalNet
    delta_total = student_total - class_avg_total

    # 3) Subject comparisons
    subject_metrics: List[SubjectMetricOut] = []
    strengths: List[str] = []
    weaknesses: List[str] = []

    # threshold for "above/below" in net
    SUBJECT_DELTA_THRESHOLD = 1.0

    # sort by delta magnitude for nicer reporting
    sorted_subjects = sorted(req.classContext.subjects, key=lambda s: s.delta)

    for s in sorted_subjects:
        pos = classify_position(s.delta, threshold=SUBJECT_DELTA_THRESHOLD)
        subject_metrics.append(SubjectMetricOut(
            subject=s.subject,
            studentNet=s.studentNet,
            classAvgNet=s.classAvgNet,
            delta=s.delta,
            position=pos
        ))

    # pick top strengths/weaknesses (up to 3 each)
    above = [m for m in subject_metrics if m.position == "above"]
    below = [m for m in subject_metrics if m.position == "below"]

    # strongest first: highest delta
    above_sorted = sorted(above, key=lambda m: m.delta, reverse=True)[:3]
    below_sorted = sorted(below, key=lambda m: m.delta)[:3]  # most negative first

    for m in above_sorted:
        strengths.append(f"{m.subject} dersinde sınıf ortalamasının {round(m.delta, 2)} net üzerindesin.")

    for m in below_sorted:
        weaknesses.append(f"{m.subject} dersinde sınıf ortalamasının {round(abs(m.delta), 2)} net altındasın.")

    # 4) Summary + recommendations
    summary = build_summary(trend, delta_total, req.classContext.percentile)

    weak_subject_names = [m.subject for m in below_sorted]
    recommendations = build_recommendations(trend, weak_subject_names)

    metrics = MetricsOut(
        trend=trend,
        difficultyAdjustedNet=round(current_adj, 2),
        previousAvgDifficultyAdjustedNet=round(prev_avg_adj, 2) if prev_avg_adj is not None else None,

        studentTotalNet=round(student_total, 2),
        classAvgTotalNet=round(class_avg_total, 2),
        deltaTotalNet=round(delta_total, 2),

        studentRank=req.classContext.studentRank,
        studentCount=req.classContext.studentCount,
        percentile=req.classContext.percentile,

        subjectComparisons=subject_metrics
    )

    return AnalyzeResponse(
        summary=summary,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        metrics=metrics
    )
