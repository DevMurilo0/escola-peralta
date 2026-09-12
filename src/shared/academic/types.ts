export type Student = {
  id: string;
  full_name: string;
  birth_date: string;
  active: boolean;
};

export type Enrollment = {
  id: string;
  student_id: string;
  status: string;
  students: Student;
};
export type Grade = {
  term: number;
  student_id: string;
  activity_score: number | null;
  exam_score: number | null;
  average: number | null;
};
export type AttendanceRecord = {
  student_id: string;
  status: "present" | "absent" | "justified";
};
export type AttendanceSession = {
  id: string;
  date: string;
  term: number;
  updated_at: string;
  attendance_records: AttendanceRecord[];
};
export type SchoolClass = {
  id: string;
  name: string;
  grade_level: string;
  shift: string;
  school_year: number;
  active: boolean;
};

export type CurriculumRecord = {
  id: string;
  class_id: string;
  term: number;
  date: string;
  subject: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};
