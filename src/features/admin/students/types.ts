import type { Student } from "@/shared/academic/types";

export type AdminEnrollment = {
  id: string;
  student_id: string;
  class_id: string;
  school_year: number;
  status: "active" | "inactive";
  enrolled_at: string;
  classes: {
    id: string;
    name: string;
    school_year: number;
    active: boolean;
  } | null;
};

export type AdminStudent = Student & { enrollments: AdminEnrollment[] };

export type StudentGrade = {
  class_id: string;
  term: number;
  activity_score: number | null;
  exam_score: number | null;
  average: number | null;
};

export type StudentAttendance = {
  status: "present" | "absent" | "justified";
  attendance_sessions: {
    id: string;
    class_id: string;
    date: string;
    term: number;
  };
};

export type StudentDetailsData = {
  enrollments: AdminEnrollment[];
  grades: StudentGrade[];
  attendance: StudentAttendance[];
};

export function currentEnrollment(student: AdminStudent, schoolYear: number) {
  const active = student.enrollments.filter(
    (enrollment) =>
      enrollment.status === "active" && enrollment.school_year === schoolYear,
  );
  return {
    enrollment: active.length === 1 ? active[0] : null,
    inconsistent: active.length > 1,
  };
}
