import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../auth/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../modules/dashboard/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import { Navigate } from "react-router-dom";
import BulkUploadPage from "../modules/users/BulkUploadPage";
import ClassesPage from "../modules/academics/ClassesPage";
import SubjectsPage from "../modules/academics/SubjectsPage";
import TopicsPage from "../modules/academics/TopicsPage";
import TopicProgressPage from "../modules/academics/TopicProgressPage";
import CurriculumUploadPage from "../modules/academics/CurriculumUploadPage";
import TeacherAssignmentsPage from "../modules/academics/TeacherAssignmentsPage";
import TeachersPage from "../modules/teachers/TeachersPage";
import ExamsListPage from "../modules/exams/ExamsListPage";
import CreateExamPage from "../modules/exams/CreateExamPage";
import ExamResultsUploadPage from "../modules/exams/ExamResultsUploadPage";
import ExamDetailPage from "../modules/exams/ExamDetailPage";
import AdminNewsPage from "../modules/news/AdminNewsPage";
import ScheduleAdminPage from "../modules/schedule/ScheduleAdminPage";
import NotificationSettingsPage from "../modules/settings/NotificationSettingsPage"
import StudentsPage from "../modules/students/StudentsPage";
import ParentsPage from "../modules/parents/ParentsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "users/bulk-upload",
        element: <BulkUploadPage />,
      },
      {
        path: "academics/classes",
        element: <ClassesPage />,
      },
      {
        path: "academics/subjects",
        element: <SubjectsPage />,
      },
      {
        path: "academics/topics",
        element: <TopicsPage />,
      },
      {
        path: "academics/progress",
        element: <TopicProgressPage />,
      },
      {
        path: "academics/curriculum-upload",
        element: <CurriculumUploadPage />,
      },
      {
        path: "academics/assignments",
        element: <TeacherAssignmentsPage />,
      },
      {
        path: "teachers",
        element: <TeachersPage />,
      },
      {
        path: "exams",
        element: <ExamsListPage />,
      },
      {
        path: "exams/create",
        element: <CreateExamPage />,
      },
      {
      path: "exams/:examId/results",
      element: <ExamResultsUploadPage />,
      },
      {
        path: "exams/:examId",
        element: <ExamDetailPage />,
      },
      {
        path: "/admin/news" ,
        element: <AdminNewsPage />,
      },
      {
        path: "/admin/schedule",
        element: <ScheduleAdminPage />,
      },
      {
        path: "/admin/notification-settings",
        element: <NotificationSettingsPage />,
      },
      {
        path: "/admin/students",
        element: <StudentsPage />,
      },
      {
        path: "/admin/parents",
        element: <ParentsPage />,
      }
      
    ],
  },
]);
