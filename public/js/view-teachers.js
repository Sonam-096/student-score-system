// Initialize Socket.IO connection 
const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const teachersTableBody = document.querySelector('#teachers-table tbody');
    const searchTeacherIdInput = document.getElementById('search-teacher-id');
    const searchNameInput = document.getElementById('search-name');
    const searchClassSelect = document.getElementById('search-class');
    const searchSectionSelect = document.getElementById('search-section');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Function to fetch and display teachers
    async function fetchAndDisplayTeachers(filters = {}) {
        teachersTableBody.innerHTML = '<tr><td colspan="6" class="no-data">Loading teachers...</td></tr>'; // Show loading message

        try {
            // Build query parameters based on filters
            const queryParams = new URLSearchParams();
            if (filters.teacher_id) {
                queryParams.append('teacher_id', filters.teacher_id);
            }
            if (filters.fullname) {
                queryParams.append('fullname', filters.fullname);
            }
            if (filters.class_assigned) {
                queryParams.append('class_assigned', filters.class_assigned);
            }
            if (filters.section) {
                queryParams.append('section', filters.section);
            }

            const queryString = queryParams.toString();
            const url = `http://localhost:3000/api/teachers${queryString ? `?${queryString}` : ''}`;

            // --- DEBUG LOGS START ---
            console.log('Client-side: Filters object being sent:', filters);
            console.log('Client-side: Constructed API URL:', url);
            // --- DEBUG LOGS END ---

            const response = await fetch(url);
            const teachers = await response.json();
            console.log('Client-side: Teachers data received:', teachers);

            if (!response.ok) {
                const errorMsg = teachers.error || 'Failed to fetch teachers.';
                throw new Error(errorMsg);
            }

            teachersTableBody.innerHTML = ''; // Clear loading message or previous data

            if (teachers.length === 0) {
                teachersTableBody.innerHTML = '<tr><td colspan="6" class="no-data">No teachers found.</td></tr>';
                return;
            }

            // Populate table with teacher data
            teachers.forEach(teacher => {
                const row = teachersTableBody.insertRow();
                row.insertCell().textContent = teacher.teacher_id;
                row.insertCell().textContent = teacher.fullname;
                row.insertCell().textContent = teacher.class_assigned;
                row.insertCell().textContent = teacher.section;
                row.insertCell().textContent = teacher.subject;
                row.insertCell().textContent = new Date(teacher.created_at).toLocaleDateString(); // Format date
            });

        } catch (error) {
            console.error('Client-side: Error fetching or displaying teachers:', error);
            teachersTableBody.innerHTML = `<tr><td colspan="6" class="no-data">Error loading teachers: ${error.message}</td></tr>`;
            if (typeof showNotification === 'function') {
                showNotification('error', `Failed to load teachers: ${error.message}`);
            } else {
                alert(`Failed to load teachers: ${error.message}`);
            }
        }
    }

    // Event listener for Apply Filters button
    applyFiltersBtn.addEventListener('click', () => {
        const filters = {
            teacher_id: searchTeacherIdInput.value.trim(),
            fullname: searchNameInput.value.trim(),
            class_assigned: searchClassSelect.value,
            section: searchSectionSelect.value
        };
        fetchAndDisplayTeachers(filters);
    });

    // Event listener for Clear Filters button
    clearFiltersBtn.addEventListener('click', () => {
        searchTeacherIdInput.value = '';
        searchNameInput.value = '';
        searchClassSelect.value = '';
        searchSectionSelect.value = '';
        fetchAndDisplayTeachers({}); // Fetch all teachers without filters
    });

    // Initial load of teachers when the page loads
    fetchAndDisplayTeachers({});

    // Socket.IO listeners for real-time updates 
    socket.on('teacher:added', (teacher) => {
        console.log('Real-time: New teacher added:', teacher.fullname);
        // Re-fetch and display all teachers to update the list
        fetchAndDisplayTeachers({
            teacher_id: searchTeacherIdInput.value.trim(),
            fullname: searchNameInput.value.trim(),
            class_assigned: searchClassSelect.value,
            section: searchSectionSelect.value
        });
    });

    socket.on('teacher:deleted', (teacher) => {
        console.log('Real-time: Teacher deleted:', teacher.fullname);
        fetchAndDisplayTeachers({
            teacher_id: searchTeacherIdInput.value.trim(),
            fullname: searchNameInput.value.trim(),
            class_assigned: searchClassSelect.value,
            section: searchSectionSelect.value
        });
    });
});
