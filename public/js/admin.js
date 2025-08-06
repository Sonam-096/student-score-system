// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const adminUser = sessionStorage.getItem('adminUser');

    if (!isAuthenticated || !adminUser) {
        window.location.href = 'index.html';
    } else {
        document.getElementById('admin-name').textContent = adminUser;
        // Update counts when admin dashboard loads
        updateDashboardCounts();
    }

    // Initialize Socket.IO
    initializeSocketIO();
});

// Logout function
function logout() {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

// Socket.IO initialization and event handlers
function initializeSocketIO() {
    const socket = io();

    // Listen for general notifications
    socket.on('notification', (data) => {
        // global showNotification from utils.js
        if (typeof showNotification === 'function') {
            showNotification(data.type, data.message);
        }
        // Update counts on any relevant notification
        updateDashboardCounts();
    });

    // Listen for real-time updates for students
    socket.on('student:added', (student) => {
        console.log('New student added (real-time):', student);
        updateDashboardCounts(); // Update counts
    });

    socket.on('teacher:added', (teacher) => {
        console.log('New teacher added (real-time):', teacher);
        updateDashboardCounts(); // Update counts
    });

    socket.on('student:deleted', (student) => {
        console.log('Student deleted (real-time):', student);
        updateDashboardCounts(); // Update counts
    });

    socket.on('teacher:deleted', (teacher) => {
        console.log('Teacher deleted (real-time):', teacher);
        updateDashboardCounts(); // Update counts
    });
}


// Event listener for logout button
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// Real-time dashboard updates 
function updateDashboardCounts() {
    fetch('http://localhost:3000/api/students/count')
        .then(response => response.json())
        .then(data => {
            const studentCountElement = document.getElementById('student-count');
            if (studentCountElement) {
                studentCountElement.textContent = data.count || 0;
            }
        })
        .catch(error => console.error('Error fetching student count:', error));

    fetch('http://localhost:3000/api/teachers/count')
        .then(response => response.json())
        .then(data => {
            const teacherCountElement = document.getElementById('teacher-count');
            if (teacherCountElement) {
                teacherCountElement.textContent = data.count || 0;
            }
        })
        .catch(error => console.error('Error fetching teacher count:', error));
}

