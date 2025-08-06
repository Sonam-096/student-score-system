
const socket = io();

document.querySelector('.remove-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission. Logic is handled by search/delete buttons.
});

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.querySelector('.search-btn');
    const deleteBtn = document.querySelector('.delete-btn');
    const confirmCheckbox = document.getElementById('confirm');
    const studentIdInput = document.getElementById('student-id'); // Hidden input to store actual DB ID
    const studentDetailsSection = document.querySelector('.student-details');

    // Initially hide the student details section
    studentDetailsSection.style.display = 'none';

    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const studentClass = document.getElementById('class').value;
            const rollNo = document.getElementById('rollno').value;
            const section = document.getElementById('section').value;

            if (!studentClass || !rollNo || !section) {
                if (typeof showNotification === 'function') {
                    showNotification('warning', 'Please select Class, Section and enter Roll Number to search.');
                } else {
                    alert('Please select Class, Section and enter Roll Number to search.');
                }
                return;
            }

            try {
                searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
                searchBtn.disabled = true;
                deleteBtn.disabled = true; // Disable delete button during search
                studentDetailsSection.style.display = 'none'; // Hide previous results

                const response = await fetch(`http://localhost:3000/api/students/search?class_id=${studentClass}&roll_no=${rollNo}&section=${section}`);
                const student = await response.json();

                if (!response.ok || !student || student.success === false) {
                    throw new Error(student.error || 'Student not found.');
                }

                // Populate student details
                document.getElementById('student-name').textContent = student.fullname;
                document.getElementById('father-name').textContent = student.father_name;
                document.getElementById('class-section').textContent = `${student.class_id}-${student.section}`;

                // Store the actual database ID for deletion
                studentIdInput.value = student.id;

                // Show details section and enable delete button after confirmation
                studentDetailsSection.style.display = 'block';
                confirmCheckbox.checked = false; // Reset checkbox
                deleteBtn.disabled = true; // Still disabled until checkbox is checked

                if (typeof showNotification === 'function') {
                    showNotification('info', 'Student found. Check confirmation to delete.');
                }

            } catch (error) {
                console.error('Error searching for student:', error);
                studentDetailsSection.style.display = 'none';
                if (typeof showNotification === 'function') {
                    showNotification('error', `Search Error: ${error.message}`);
                } else {
                    alert(`Search Error: ${error.message}`);
                }
            } finally {
                searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Student';
                searchBtn.disabled = false;
            }
        });
    }

    // Enable/disable delete button based on checkbox
    if (confirmCheckbox) {
        confirmCheckbox.addEventListener('change', () => {
            deleteBtn.disabled = !confirmCheckbox.checked;
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const studentId = studentIdInput.value;
            if (!studentId) {
                if (typeof showNotification === 'function') {
                    showNotification('error', 'No student selected for deletion.');
                } else {
                    alert('No student selected for deletion.');
                }
                return;
            }

            if (!confirmCheckbox.checked) {
                if (typeof showNotification === 'function') {
                    showNotification('warning', 'Please confirm deletion by checking the box.');
                } else {
                    alert('Please confirm deletion by checking the box.');
                }
                return;
            }

            try {
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                deleteBtn.disabled = true;

                const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete student');
                }

                const studentName = document.getElementById('student-name').textContent; // Get name for notification
                socket.emit('student:deleted', { id: studentId, fullname: studentName }); // Emit deletion event

                if (typeof showNotification === 'function') {
                    showNotification('success', 'Student deleted successfully!');
                } else {
                    alert('Student deleted successfully!');
                }
                setTimeout(() => {
                    window.location.href = 'admin.html'; // Redirect to admin page
                }, 1500);

            } catch (error) {
                console.error('Error deleting student:', error);
                if (typeof showNotification === 'function') {
                    showNotification('error', `Error: ${error.message}`);
                } else {
                    alert(`Error: ${error.message}`);
                }
            } finally {
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Student';
                deleteBtn.disabled = true; // Keep disabled until new search/confirm
            }
        });
    }

    // Handle form reset
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            studentDetailsSection.style.display = 'none';
            confirmCheckbox.checked = false;
            deleteBtn.disabled = true;
            studentIdInput.value = ''; // Clear stored ID on cancel
            // Clear search fields
            document.getElementById('class').value = '';
            document.getElementById('rollno').value = '';
            document.getElementById('section').value = '';
        });
    }
});