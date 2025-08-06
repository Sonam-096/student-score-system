-- These queries should be run on MYSql
CREATE DATABASE IF NOT EXISTS student_management;

USE student_management;

-- Teachers table
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id VARCHAR(10) UNIQUE NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  class_assigned INT NOT NULL,
  section VARCHAR(1) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roll_no VARCHAR(10) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  father_name VARCHAR(100) NOT NULL,
  mother_name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  class_id INT NOT NULL,
  section VARCHAR(1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_roll (class_id, section, roll_no)
);

ALTER TABLE students
ADD COLUMN address VARCHAR(255),
ADD COLUMN phone VARCHAR(20),
ADD COLUMN email VARCHAR(255);

--table with subject specific marks per exam type
CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- e.g., 'unit1', 'unit2', 'half_yearly', 'yearly'
    subject VARCHAR(50) NOT NULL,   -- e.g., 'math', 'science', 'hindi'
    marks INT DEFAULT NULL,         -- Marks obtained in that subject for that exam
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_exam_subject (student_id, exam_type, subject)
);
