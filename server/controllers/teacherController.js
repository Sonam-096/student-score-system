
const db = require('../db/database');

exports.addTeacher = async (req, res) => {
  try {
    const { teacher_id, fullname, dob, class_assigned, section, subject } = req.body;
    
    // Log incoming data
    console.log('Received teacher data:', req.body);

    // Basic validation
    if (!teacher_id || !fullname || !dob || !class_assigned || !section || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if teacher_id already exists
    const [existing] = await db.execute(
        'SELECT * FROM teachers WHERE teacher_id = ?',
        [teacher_id]
    );

    if (existing.length > 0) {
        return res.status(409).json({
            success: false,
            error: `Teacher with ID ${teacher_id} already exists.`
        });
    }

    const [result] = await db.execute(
      'INSERT INTO teachers (teacher_id, fullname, dob, class_assigned, section, subject) VALUES (?, ?, ?, ?, ?, ?)',
      [teacher_id, fullname, dob, class_assigned, section, subject]
    );

    res.status(201).json({
      message: 'Teacher added successfully',
      teacherId: result.insertId
    });
  } catch (error) {
    console.error('Error adding teacher:', error);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    res.status(500).json({ error: 'Failed to add teacher', details: error.message });
  }
};

exports.removeTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute(
      'DELETE FROM teachers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({ message: 'Teacher removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove teacher', details: error.message });
  }
};

exports.getAllTeachers = async (req, res) => {
    try {
        // Destructure all possible filter query parameters
        const { teacher_id, fullname, class_assigned, section } = req.query; 
        
        //A base query that always evaluates to true, making it easy to append AND clauses
        let query = 'SELECT * FROM teachers WHERE 1=1'; 
        let params = [];

        // Conditions based on provided filters
        if (teacher_id) {
            query += ' AND teacher_id = ?';
            params.push(teacher_id);
        }
        if (fullname) {
            // Use LIKE for partial matching of names, with '%' wildcards
            query += ' AND fullname LIKE ?'; 
            params.push(`%${fullname}%`);
        }
        // Ensure class_assigned is treated as a number if stored as INT
        if (class_assigned) {
            query += ' AND class_assigned = ?';
            params.push(parseInt(class_assigned)); // Parse to integer
        }
        if (section) {
            query += ' AND section = ?';
            params.push(section);
        }

        console.log('Executing teacher query:', query, params); // Log the final query and parameters
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Database error in getAllTeachers:', error);
        res.status(500).json({ error: 'Failed to retrieve teachers', details: error.message });
    }
};
