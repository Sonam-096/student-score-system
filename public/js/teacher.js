// Initialize Socket.IO connection
const socket = io();

document.addEventListener('DOMContentLoaded', async () => {
    // Authentication Check 
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const userRole = sessionStorage.getItem('userRole');
    const teacherName = sessionStorage.getItem('teacherName');
    const teacherClass = sessionStorage.getItem('teacherClass');
    const teacherSection = sessionStorage.getItem('teacherSection');
    const teacherId = sessionStorage.getItem('teacherId'); // Get teacher's own ID

    if (!isAuthenticated || userRole !== 'teacher' || !teacherName || !teacherClass || !teacherSection || !teacherId) {
        // Redirect to login if not authenticated as a teacher
        window.location.href = 'index.html';
        return; // Stop execution
    }

    //  Display Teacher Info 
    document.getElementById('teacher-name-display').textContent = teacherName;
    document.getElementById('teacher-class-section-display').textContent = `You are a teacher of Class ${teacherClass} Section ${teacherSection}`;

    // Element References 
    const studentsTableBody = document.querySelector('#teacher-students-table tbody');
    const assignMarksBtn = document.getElementById('assign-marks-btn');
    const assignMarksModal = document.getElementById('assignMarksModal');
    const closeButton = document.querySelector('.modal-content .close-button'); // Only the 'X' button
    const assignMarksForm = document.getElementById('assign-marks-form');
    const modalStudentSelect = document.getElementById('modal-student-select');
    const modalStudentIdInput = document.getElementById('modal-student-id');

    // Define all exam types and subjects
    const EXAM_TYPES = ['unit1', 'unit2', 'half_yearly', 'unit3', 'unit4', 'yearly'];
    const SUBJECTS = ['math', 'science', 'hindi', 'english', 'sst', 'gk', 'drawing', 'moral_science'];

    // Dynamically get references for all mark input fields
    const markInputs = {};
    EXAM_TYPES.forEach(examType => {
        SUBJECTS.forEach(subject => {
            markInputs[`${examType}_${subject}`] = document.getElementById(`${examType}-${subject}`);
        });
    });

    let currentStudentsData = []; // To store fetched students data for modal dropdown

    // Function to fetch and display students with their marks
    async function fetchAndDisplayStudents() {
        console.log('Fetching and displaying students...');
        studentsTableBody.innerHTML = '<tr><td colspan="50" class="no-data">Loading students...</td></tr>'; // Adjust colspan

        try {
            const response = await fetch(`http://localhost:3000/api/students/byClassSection?class_id=${teacherClass}&section=${teacherSection}`);
            const students = await response.json();

            console.log('API Response for students/byClassSection:', students); // DEBUG: Log the raw response

            if (!response.ok) {
                const errorMsg = students.error || 'Failed to fetch students for your class.';
                throw new Error(errorMsg);
            }

            currentStudentsData = students; // Store for modal dropdown
            studentsTableBody.innerHTML = ''; // Clear loading message

            if (students.length === 0) {
                studentsTableBody.innerHTML = '<tr><td colspan="50" class="no-data">No students found in your class/section.</td></tr>';
                return;
            }

            // Helper to display marks or '-'
            const displayMark = (mark) => mark !== null ? mark : '-';

            // Populate table
            students.forEach(student => {
                const row = studentsTableBody.insertRow();
                row.insertCell().textContent = student.roll_no;
                row.insertCell().textContent = student.fullname;
                
                EXAM_TYPES.forEach(examType => {
                    SUBJECTS.forEach(subject => {
                        const markKey = `${examType}_${subject}`;
                        const markValue = student[markKey];
                        console.log(`Student ${student.roll_no}, Exam: ${examType}, Subject: ${subject}, Mark: ${markValue}`); // DEBUG: Log each mark being processed
                        row.insertCell().textContent = displayMark(markValue);
                    });
                });
            });

            // Populate modal student dropdown
            modalStudentSelect.innerHTML = '<option value="">Select a student</option>';
            currentStudentsData.forEach(student => {
                const option = document.createElement('option');
                option.value = student.student_id; // Use student's DB ID as value
                option.textContent = `${student.roll_no} - ${student.fullname}`;
                modalStudentSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error fetching students for teacher dashboard:', error);
            studentsTableBody.innerHTML = `<tr><td colspan="50" class="no-data">Error loading students: ${error.message}</td></tr>`;
            if (typeof showNotification === 'function') {
                showNotification('error', `Failed to load students: ${error.message}`);
            } else {
                alert(`Failed to load students: ${error.message}`);
            }
        }
    }

    // Function to open the modal
    function openModal() {
        assignMarksModal.style.display = 'flex'; // Use flex to center
        assignMarksForm.reset(); // Clear form fields
        modalStudentSelect.value = ''; // Reset dropdown selection
        modalStudentIdInput.value = ''; // Clear hidden student ID
        // Clear all mark inputs
        Object.values(markInputs).forEach(input => input.value = '');
    }

    // Function to close the modal
    function closeModal() {
        assignMarksModal.style.display = 'none';
    }

    // Event Listeners 

    // Open modal button
    assignMarksBtn.addEventListener('click', openModal);

    // Close modal button (only the 'X' button now)
    if (closeButton) { // Check if the element exists
        closeButton.addEventListener('click', closeModal);
    }

    // Close modal if clicked outside content
    window.addEventListener('click', (event) => {
        if (event.target == assignMarksModal) {
            closeModal();
        }
    });

    // Handle student selection in modal: populate marks if they exist
    modalStudentSelect.addEventListener('change', async () => {
        const studentId = modalStudentSelect.value;
        modalStudentIdInput.value = studentId; // Store student_id in hidden input

        // Clear all mark inputs
        Object.values(markInputs).forEach(input => input.value = '');

        if (studentId) {
            try {
                const response = await fetch(`http://localhost:3000/api/students/${studentId}/marks`);
                const marksData = await response.json();

                console.log('API Response for student marks (modal):', marksData); // DEBUG: Log marks for selected student

                if (response.ok) {
                    // Populate form fields with existing marks
                    for (const key in markInputs) {
                        if (marksData[key] !== null && marksData[key] !== undefined) {
                            markInputs[key].value = marksData[key];
                        } else {
                            markInputs[key].value = ''; // Clear if null/undefined
                        }
                    }
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification('info', marksData.message || 'No existing marks found for this student. Enter new marks.');
                    }
                }
            } catch (error) {
                console.error('Error fetching student marks for modal:', error);
                if (typeof showNotification === 'function') {
                    showNotification('error', `Failed to load student marks: ${error.message}`);
                }
            }
        }
    });

    // Handle marks form submission
    assignMarksForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const student_id = modalStudentIdInput.value;
        if (!student_id) {
            if (typeof showNotification === 'function') {
                showNotification('error', 'Please select a student.');
            }
            return;
        }

        const marksDataToSend = [];
        EXAM_TYPES.forEach(examType => {
            SUBJECTS.forEach(subject => {
                const inputElement = markInputs[`${examType}_${subject}`];
                if (inputElement) { // Ensure element exists
                    marksDataToSend.push({
                        exam_type: examType,
                        subject: subject,
                        marks: inputElement.value ? parseInt(inputElement.value) : null // Convert to int or null
                    });
                }
            });
        });

        console.log('Sending marks data to backend:', marksDataToSend); // DEBUG: Log data being sent

        try {
            const submitBtn = assignMarksForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const response = await fetch('http://localhost:3000/api/students/marks', {
                method: 'POST', // Use POST for upsert
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ student_id: parseInt(student_id), marksData: marksDataToSend })
            });

            const result = await response.json();

            console.log('Backend response after saving marks:', result); // DEBUG: Log backend response

            if (response.ok && result.success) {
                if (typeof showNotification === 'function') {
                    showNotification('success', 'Marks saved successfully!');
                }
                closeModal();
                fetchAndDisplayStudents(); // Refresh table to show updated marks
            } else {
                const errorMessage = result.error || 'Failed to save marks.';
                if (typeof showNotification === 'function') {
                    showNotification('error', errorMessage);
                } else {
                    alert(`Error: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Error saving marks:', error);
            if (typeof showNotification === 'function') {
                showNotification('error', `Network error or unexpected problem: ${error.message}`);
            } else {
                alert(`Network error or unexpected problem: ${error.message}`);
            }
        } finally {
            const submitBtn = assignMarksForm.querySelector('.submit-btn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Marks';
        }
    });

    //  Initial Load 
    fetchAndDisplayStudents();

    // Socket.IO Listeners for Real-time Updates 
    socket.on('marks:updated', (data) => {
        console.log('Real-time: Marks updated for student via Socket.IO:', data.student_id); // DEBUG: Socket.IO event received
        // Re-fetch and display students to update the table
        fetchAndDisplayStudents();
    });

    socket.on('student:added', (student) => {
        console.log('Real-time: New student added (teacher dashboard):', student.fullname);
        // If a new student is added to this teacher's class/section, refresh
        if (student.class_id == teacherClass && student.section == teacherSection) {
            fetchAndDisplayStudents();
        }
    });

    socket.on('student:deleted', (student) => {
        console.log('Real-time: Student deleted (teacher dashboard):', student.fullname);
        // If a student from this teacher's class/section is deleted, refresh
        if (student.class_id == teacherClass && student.section == teacherSection) {
            fetchAndDisplayStudents();
        }
    });
});
