require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 

const app = express();
const server = http.createServer(app); // Create HTTP server with Express
const io = new Server(server); // Initialize Socket.IO with the HTTP server

// Make io accessible to Express app and its routes/controllers
app.set('io', io);

// Import routes
const studentRoutes = require('./server/routes/studentRoutes');
const teacherRoutes = require('./server/routes/teacherRoutes');
const db = require('./server/db/database'); // Import database connection for counts

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/html', express.static(path.join(__dirname, 'public/html')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Base route for login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// HTML route handlers
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/admin.html'), (err) => {
    if (err) {
      console.error('Failed to load admin.html:', err);
      res.status(404).send('Admin page not found');
    }
  });
});

app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});

// Handle all other HTML files dynamically
app.get('/:page.html', (req, res) => {
  res.sendFile(path.join(__dirname, `public/html/${req.params.page}.html`), (err) => {
    if (err) {
      console.error(`Failed to load ${req.params.page}.html:`, err);
      res.status(404).send('Page not found');
    }
  });
});

// Use API routes
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);

// Authentication Endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'Please enter all credentials and select a role.' });
    }

    try {
        if (role === 'admin') {
            // Hardcoded admin credentials (for development only)
            const adminCredentials = {
                'yash05': 'yash9761',
                'sonam09': 'sonam9749',
                'admin' : 'admin123'
            };

            if (adminCredentials[username] === password) {
                return res.json({ success: true, message: 'Admin login successful', user: { username, role: 'admin' } });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
            }
        } else if (role === 'teacher') {
            const [teachers] = await db.execute('SELECT * FROM teachers WHERE teacher_id = ?', [username]);

            if (teachers.length === 0) {
                return res.status(401).json({ success: false, message: 'Teacher ID not found.' });
            }

            const teacher = teachers[0];
            // Construct the expected password: fullname (no spaces) + class_assigned + section
            // Example: "JohnDoe" + "10" + "A" = "JohnDoe10A"
            const expectedPassword = `${teacher.fullname.replace(/\s/g, '')}${teacher.class_assigned}${teacher.section}`;
            
            if (password === expectedPassword) {
                return res.json({
                    success: true,
                    message: 'Teacher login successful',
                    user: {
                        teacher_id: teacher.teacher_id,
                        fullname: teacher.fullname,
                        class_assigned: teacher.class_assigned,
                        section: teacher.section,
                        subject: teacher.subject, 
                        role: 'teacher'
                    }
                });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid password for teacher.' });
            }
        } else if (role === 'student') {
            // Fetch student based on provided username (which is the constructed login ID)
            const [students] = await db.execute('SELECT * FROM students'); // Fetch all students to match by constructed username

            let foundStudent = null;
            for (const student of students) {
                const dobYear = new Date(student.dob).getFullYear(); // Extract year from DOB
                const expectedUsername = `${student.fullname.replace(/\s/g, '')}${dobYear}${student.class_id}${student.section}`;
                const expectedPassword = String(student.roll_no); // Roll number as password

                if (username === expectedUsername && password === expectedPassword) {
                    foundStudent = student;
                    break;
                }
            }

            if (foundStudent) {
                return res.json({
                    success: true,
                    message: 'Student login successful',
                    user: {
                        student_id: foundStudent.id, // Use database primary ID
                        roll_no: foundStudent.roll_no,
                        fullname: foundStudent.fullname,
                        class_id: foundStudent.class_id,
                        section: foundStudent.section,
                        dob: foundStudent.dob,
                        father_name: foundStudent.father_name,
                        mother_name: foundStudent.mother_name,
                        address: foundStudent.address,
                        phone: foundStudent.phone,
                        email: foundStudent.email,
                        role: 'student'
                    }
                });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid student credentials.' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role selected.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
});

// API endpoint to get student count
app.get('/api/students/count', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM students');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error fetching student count:', error);
    res.status(500).json({ error: 'Failed to fetch student count' });
  }
});

// API endpoint to get teacher count
app.get('/api/teachers/count', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM teachers');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error fetching teacher count:', error);
    res.status(500).json({ error: 'Failed to fetch teacher count' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected via WebSocket');

  // Listen for 'student:add' event from client
  socket.on('student:add', (studentData) => {
    // This event is just for notification purposes. The actual DB add happens via REST API.
    console.log('Received student:add event for:', studentData.fullname);
    // You can emit a notification to all connected clients (e.g., admin dashboard)
    io.emit('student:added', studentData); // Notify all clients about new student
    io.emit('notification', { type: 'info', message: `New student added: ${studentData.fullname}` });
  });

  // Listen for 'teacher:add' event from client
  socket.on('teacher:add', (teacherData) => {
    console.log('Received teacher:add event for:', teacherData.fullname);
    io.emit('teacher:added', teacherData); // Notify all clients about new teacher
    io.emit('notification', { type: 'info', message: `New teacher added: ${teacherData.fullname}` });
  });

  // Listen for student deletion events
  socket.on('student:deleted', (studentDetails) => {
    io.emit('notification', { type: 'info', message: `Student deleted: ${studentDetails.fullname}` });
  });

  // Listen for teacher deletion events
  socket.on('teacher:deleted', (teacherDetails) => {
    io.emit('notification', { type: 'info', message: `Teacher deleted: ${teacherDetails.fullname}` });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from WebSocket');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { 
  console.log(`Server running on port http://localhost:${PORT}`);
});
