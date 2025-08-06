
const db = require('../db/database');

exports.addStudent = async (req, res) => {
    try {
        const { roll_no, fullname, father_name, mother_name, dob, class_id, section, address, phone, email } = req.body;

        // Input validation
        if (!roll_no || !fullname || !class_id || !section || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: Roll Number, Student Name, Class, Section, Phone Number'
            });
        }

        // Check if student already exists
        const [existing] = await db.execute(
            'SELECT * FROM students WHERE roll_no = ? AND class_id = ? AND section = ?',
            [roll_no, class_id, section]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Student with this roll number already exists in the same class and section'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO students
            (roll_no, fullname, father_name, mother_name, dob, class_id, section, address, phone, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [roll_no, fullname, father_name, mother_name, dob, class_id, section, address, phone, email]
        );

        // Emit real-time event (safe check)
        const io = req.app.get('io');
        if (io) {
            io.emit('student:added', {
                id: result.insertId,
                roll_no,
                fullname,
                class_id,
                section
            });
        }

        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            studentId: result.insertId
        });
    } catch (error) {
        console.error('Database error in addStudent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add student',
            details: error.message
        });
    }
};

exports.removeStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM students WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Student removed successfully'
        });
    } catch (error) {
        console.error('Database error in removeStudent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove student',
            details: error.message
        });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const { roll_no, fullname, class_id, section } = req.query;

        let query = 'SELECT * FROM students WHERE 1=1';
        let params = [];

        if (roll_no) {
            query += ' AND roll_no = ?';
            params.push(roll_no);
        }
        if (fullname) {
            query += ' AND fullname LIKE ?';
            params.push(`%${fullname}%`);
        }
        if (class_id) {
            query += ' AND class_id = ?';
            params.push(parseInt(class_id));
        }
        if (section) {
            query += ' AND section = ?';
            params.push(section);
        }

        console.log('Executing student query:', query, params);
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Database error in getAllStudents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve students',
            details: error.message
        });
    }
};

exports.getStudentByRollNoClassSection = async (req, res) => {
    try {
        const { roll_no, class_id, section } = req.query;

        if (!roll_no || !class_id || !section) {
            return res.status(400).json({ error: 'Missing required query parameters: roll_no, class_id, section' });
        }

        const [rows] = await db.execute(
            'SELECT * FROM students WHERE roll_no = ? AND class_id = ? AND section = ?',
            [roll_no, class_id, section]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        res.json(rows[0]); // Return the first matching student
    } catch (error) {
        console.error('Database error in getStudentByRollNoClassSection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve student details',
            details: error.message
        });
    }
};

//  Get students by class and section for teacher's view with all marks
exports.getStudentsByClassAndSection = async (req, res) => {
    try {
        const { class_id, section } = req.query;

        if (!class_id || !section) {
            return res.status(400).json({ success: false, error: 'Class ID and Section are required.' });
        }

        // Fetch students
        const [students] = await db.execute(
            `SELECT id AS student_id, roll_no, fullname, class_id, section
            FROM students
            WHERE class_id = ? AND section = ?
            ORDER BY roll_no ASC`,
            [class_id, section]
        );

        // Fetch all marks for these students in one go
        const studentIds = students.map(s => s.student_id);
        console.log('Backend Debug: Student IDs being queried for marks:', studentIds);
        let marks = [];
        if (studentIds.length > 0) {
            const placeholders = studentIds.map(() => '?').join(',');
            const [allMarks] = await db.execute(
                `SELECT student_id, exam_type, subject, marks FROM marks WHERE student_id IN (${placeholders})`,
                studentIds
            );

            marks = allMarks;
            console.log('Backend Debug: All marks fetched from DB:', marks);
        } else {
            console.log('Backend Debug: No student IDs to query for marks.');
        }

        // Map marks back to students for easier frontend consumption
        const studentsWithMarks = students.map(student => {
            const studentMarkData = { ...student };

            // Initialize all expected mark fields to null
            const examTypes = ['unit1', 'unit2', 'half_yearly', 'unit3', 'unit4', 'yearly'];
            const subjects = ['math', 'science', 'hindi', 'english', 'sst', 'gk', 'drawing', 'moral_science'];

            examTypes.forEach(examType => {
                subjects.forEach(subject => {
                    studentMarkData[`${examType}_${subject}`] = null; // e.g., unit1_math
                });
            });

            // Populate with actual marks
            marks.filter(mark => mark.student_id === student.student_id)
                .forEach(mark => {
                    const examType = mark.exam_type.toLowerCase();
                    const subject = mark.subject.toLowerCase();
                    studentMarkData[`${examType}_${subject}`] = mark.marks;
                });

            return studentMarkData;
        });
        console.log('Backend Debug: Students data sent to frontend:', studentsWithMarks);
        res.json(studentsWithMarks);
    } catch (error) {
        console.error('Database error in getStudentsByClassAndSection:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve students for class and section.', details: error.message });
    }
};




// Get marks for a specific student (now fetches all subject marks for all exam types)
exports.getStudentMarks = async (req, res) => {
    try {
        const { studentId } = req.params;
        const [rows] = await db.execute('SELECT exam_type, subject, marks FROM marks WHERE student_id = ?', [studentId]);

        // Transform the rows into a single object for easier frontend consumption
        const studentMarks = { student_id: parseInt(studentId) };
        rows.forEach(row => {
            studentMarks[`${row.exam_type}_${row.subject}`] = row.marks;
        });
        console.log('Backend Debug: Marks for single student (modal):', studentMarks);
        res.json(studentMarks);
    } catch (error) {
        console.error('Database error in getStudentMarks:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve student marks.', details: error.message });
    }
};

//  Add or Update marks for a student (UPSERT for subject-specific marks per exam)
exports.upsertStudentMarks = async (req, res) => {
    let connection; // Declare connection variable outside try block
    try {
        const { student_id, marksData } = req.body; // marksData will be an array of { exam_type, subject, marks }

        if (!student_id || !Array.isArray(marksData)) {
            return res.status(400).json({ success: false, error: 'Student ID and marks data array are required.' });
        }

        connection = await db.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction on this connection

        for (const markEntry of marksData) {
            const { exam_type, subject, marks } = markEntry;

            // Check if marks already exist for this student, exam_type, and subject
            const [existing] = await connection.execute( // Use connection.execute
                'SELECT id FROM marks WHERE student_id = ? AND exam_type = ? AND subject = ?',
                [student_id, exam_type, subject]
            );

            let query;
            let params;

            if (existing.length > 0) {
                // Update existing marks
                query = `
                    UPDATE marks SET marks = ?
                    WHERE student_id = ? AND exam_type = ? AND subject = ?
                `;
                params = [marks, student_id, exam_type, subject];
            } else {
                // Insert new marks
                query = `
                    INSERT INTO marks (student_id, exam_type, subject, marks)
                    VALUES (?, ?, ?, ?)
                `;
                params = [student_id, exam_type, subject, marks];
            }
            await connection.execute(query, params); // Use connection.execute
        }

        await connection.commit(); // Commit the transaction
        connection.release(); // Release the connection back to the pool

        // Emit real-time update that marks have been updated
        const io = req.app.get('io');
        if (io) {
            io.emit('marks:updated', { student_id: student_id }); // Just send student_id, frontend will re-fetch
        }

        res.status(200).json({ success: true, message: 'Student marks saved successfully.' });

    } catch (error) {
        if (connection) { // Only rollback if a connection was successfully obtained
            await connection.rollback(); // Rollback on error
            connection.release(); // Release the connection even on error
        }
        console.error('Database error in upsertStudentMarks:', error);
        res.status(500).json({ success: false, error: 'Failed to save student marks.', details: error.message });
    }
};
