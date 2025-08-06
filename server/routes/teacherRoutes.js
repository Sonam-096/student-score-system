const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// Add new teacher
router.post('/', teacherController.addTeacher); //

// Remove teacher
router.delete('/:id', teacherController.removeTeacher); //

// Get all teachers (and handle search by teacher_id)
router.get('/', teacherController.getAllTeachers); //

module.exports = router;