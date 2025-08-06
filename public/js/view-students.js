// Initialize Socket.IO connection 
const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const studentsTableBody = document.querySelector('#students-table tbody');
    const searchRollnoInput = document.getElementById('search-rollno');
    const searchNameInput = document.getElementById('search-name');
    const searchClassSelect = document.getElementById('search-class');
    const searchSectionSelect = document.getElementById('search-section');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Function to fetch and display students
    async function fetchAndDisplayStudents(filters = {}) {
        studentsTableBody.innerHTML = '<tr><td colspan="11" class="no-data">Loading students...</td></tr>'; // Show loading message

        try {
            // Build query parameters based on filters
            const queryParams = new URLSearchParams();
            if (filters.roll_no) {
                queryParams.append('roll_no', filters.roll_no);
            }
            if (filters.fullname) {
                queryParams.append('fullname', filters.fullname);
            }
            if (filters.class_id) {
                queryParams.append('class_id', filters.class_id);
            }
            if (filters.section) {
                queryParams.append('section', filters.section);
            }

            const queryString = queryParams.toString();
            const url = `http://localhost:3000/api/students${queryString ? `?${queryString}` : ''}`;

            // Debug logs for client-side
            console.log('Client-side: Filters object being sent:', filters);
            console.log('Client-side: Constructed API URL:', url);

            const response = await fetch(url);
            const students = await response.json();
            console.log('Client-side: Students data received:', students);

            if (!response.ok) {
                const errorMsg = students.error || 'Failed to fetch students.';
                throw new Error(errorMsg);
            }

            studentsTableBody.innerHTML = ''; // Clear loading message or previous data

            if (students.length === 0) {
                studentsTableBody.innerHTML = '<tr><td colspan="11" class="no-data">No students found.</td></tr>';
                return;
            }

            // Populate table with student data
            students.forEach(student => {
                const row = studentsTableBody.insertRow();
                row.insertCell().textContent = student.roll_no;
                row.insertCell().textContent = student.fullname;
                row.insertCell().textContent = student.father_name;
                row.insertCell().textContent = student.mother_name;
                row.insertCell().textContent = new Date(student.dob).toLocaleDateString(); // Format DOB
                row.insertCell().textContent = student.class_id;
                row.insertCell().textContent = student.section;
                row.insertCell().textContent = student.address;
                row.insertCell().textContent = student.phone;
                row.insertCell().textContent = student.email || '-'; // Display '-' if email is null
                row.insertCell().textContent = new Date(student.created_at).toLocaleDateString(); // Admission Date
            });

        } catch (error) {
            console.error('Client-side: Error fetching or displaying students:', error);
            studentsTableBody.innerHTML = `<tr><td colspan="11" class="no-data">Error loading students: ${error.message}</td></tr>`;
            if (typeof showNotification === 'function') {
                showNotification('error', `Failed to load students: ${error.message}`);
            } else {
                alert(`Failed to load students: ${error.message}`);
            }
        }
    }

    // Event listener for Apply Filters button
    applyFiltersBtn.addEventListener('click', () => {
        const filters = {
            roll_no: searchRollnoInput.value.trim(),
            fullname: searchNameInput.value.trim(),
            class_id: searchClassSelect.value,
            section: searchSectionSelect.value
        };
        fetchAndDisplayStudents(filters);
    });

    // Event listener for Clear Filters button
    clearFiltersBtn.addEventListener('click', () => {
        searchRollnoInput.value = '';
        searchNameInput.value = '';
        searchClassSelect.value = '';
        searchSectionSelect.value = '';
        fetchAndDisplayStudents({}); // Fetch all students without filters
    });

    // Initial load of students when the page loads
    fetchAndDisplayStudents({});

    // Socket.IO listeners for real-time updates
    socket.on('student:added', (student) => {
        console.log('Real-time: New student added:', student.fullname);
        // Re-fetch and display all students to update the list
        fetchAndDisplayStudents({
            roll_no: searchRollnoInput.value.trim(),
            fullname: searchNameInput.value.trim(),
            class_id: searchClassSelect.value,
            section: searchSectionSelect.value
        });
    });

    socket.on('student:deleted', (student) => {
        console.log('Real-time: Student deleted:', student.fullname);
        fetchAndDisplayStudents({
            roll_no: searchRollnoInput.value.trim(),
            fullname: searchNameInput.value.trim(),
            class_id: searchClassSelect.value,
            section: searchSectionSelect.value
        });
    });
});
