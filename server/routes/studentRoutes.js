
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Add new student
router.post('/', studentController.addStudent);

// Remove student
router.delete('/:id', studentController.removeStudent);

// Get all students 
router.get('/', studentController.getAllStudents);

// Get student by roll_no, class_id, section (for remove-student search)
router.get('/search', studentController.getStudentByRollNoClassSection);

// Get students by class and section (for teacher dashboard)
router.get('/byClassSection', studentController.getStudentsByClassAndSection);

// Get marks for a specific student
router.get('/:studentId/marks', studentController.getStudentMarks);

// Add or Update marks for a student
router.post('/marks', studentController.upsertStudentMarks);

module.exports = router;
