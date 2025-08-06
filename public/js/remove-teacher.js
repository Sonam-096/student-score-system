
const socket = io();

// Handle form submission for search and delete
document.querySelector('.remove-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission.

    const teacherIdInput = document.getElementById('teacher-id');
    const teacherId = teacherIdInput.value.trim(); // Trim whitespace
    const searchBtn = document.querySelector('.search-btn');
    const deleteBtn = document.querySelector('.delete-btn');
    const confirmCheckbox = document.getElementById('confirm-teacher'); 
    const teacherDetailsSection = document.querySelector('.teacher-details');

    //  SEARCH LOGIC 
    // If the delete button is disabled, it implies we are in a search phase.
    // Or, if the event target is explicitly the search button.
    // Given both are type="submit", we need a way to distinguish.
    // The current setup has the entire form submit handling the search.
    // Ensure the search logic runs when the form is submitted.

    console.log('Form submitted. Initiating search for Teacher ID:', teacherId);

    if (!teacherId) {
        if (typeof showNotification === 'function') {
            showNotification('warning', 'Please enter a Teacher ID to search.');
        } else {
            alert('Please enter a Teacher ID to search.');
        }
        return; // Stop execution if no ID is provided
    }

    try {
        // Show loading state for search button
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        searchBtn.disabled = true;
        deleteBtn.disabled = true; // Disable delete button during search
        teacherDetailsSection.style.display = 'none'; // Hide previous details

        console.log(`Fetching teacher data for ID: ${teacherId}`);
        const searchResponse = await fetch(`http://localhost:3000/api/teachers?teacher_id=${teacherId}`);
        console.log('Search response status:', searchResponse.status);

        const teachers = await searchResponse.json();
        console.log('Search response data:', teachers);

        if (!searchResponse.ok || teachers.length === 0) {
            // If response is not OK or no teachers found
            const errorMessage = teachers.error || 'Teacher not found.';
            throw new Error(errorMessage); // Throw to be caught by the outer catch block
        }

        const teacher = teachers[0]; // Assuming teacher_id is unique, take the first one

        // Populate teacher details
        document.getElementById('teacher-name').textContent = teacher.fullname;
        document.getElementById('assigned-classes').textContent = `${teacher.class_assigned}-${teacher.section}`;
        document.getElementById('primary-subject').textContent = teacher.subject;
        document.getElementById('joining-date').textContent = new Date(teacher.created_at).toLocaleDateString();

        // Store the actual database ID for deletion
        document.getElementById('teacher-db-id').value = teacher.id;

        // Show details section and reset confirmation checkbox
        teacherDetailsSection.style.display = 'block';
        confirmCheckbox.checked = false; // Reset checkbox
        deleteBtn.disabled = true; // Keep disabled until checkbox is checked

        if (typeof showNotification === 'function') {
            showNotification('info', 'Teacher found. Check confirmation to delete.');
        }

    } catch (error) {
        console.error('Error during teacher search:', error);
        teacherDetailsSection.style.display = 'none';
        if (typeof showNotification === 'function') {
            showNotification('error', `Search Error: ${error.message}`);
        } else {
            alert(`Search Error: ${error.message}`);
        }
    } finally {
        // Reset search button state
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Teacher';
        searchBtn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const deleteBtn = document.querySelector('.delete-btn');
    const confirmCheckbox = document.getElementById('confirm-teacher');
    const teacherDetailsSection = document.querySelector('.teacher-details');
    const teacherDbIdInput = document.getElementById('teacher-db-id'); 

    // Initial state: delete button disabled, details hidden
    deleteBtn.disabled = true;
    teacherDetailsSection.style.display = 'none';

    // Clear hidden ID on load
    if (teacherDbIdInput) {
        teacherDbIdInput.value = '';
    } else {
        console.error("Hidden input 'teacher-db-id' not found on DOMContentLoaded.");
        let tempInput = document.createElement('input');
        tempInput.type = 'hidden';
        tempInput.id = 'teacher-db-id';
        document.querySelector('.remove-form').appendChild(tempInput);
        teacherDbIdInput = tempInput; // Update reference
    }

    // Enable/disable delete button based on checkbox
    if (confirmCheckbox) {
        confirmCheckbox.addEventListener('change', () => {
            deleteBtn.disabled = !confirmCheckbox.checked;
        });
    }

    // Add event listener for delete button (separate from form submit)
    const deleteButtonElement = document.querySelector('.delete-btn');
    if (deleteButtonElement) {
        deleteButtonElement.setAttribute('type', 'button'); // Change to type="button"
        deleteButtonElement.addEventListener('click', async () => {
            console.log('Delete button clicked.');
            const teacherDbId = document.getElementById('teacher-db-id').value;
            if (!teacherDbId) {
                if (typeof showNotification === 'function') {
                    showNotification('error', 'No teacher selected for deletion.');
                } else {
                    alert('No teacher selected for deletion.');
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

                const response = await fetch(`http://localhost:3000/api/teachers/${teacherDbId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete teacher');
                }

                const teacherName = document.getElementById('teacher-name').textContent; // Get name for notification
                socket.emit('teacher:deleted', { id: teacherDbId, fullname: teacherName }); // Emit deletion event

                if (typeof showNotification === 'function') {
                    showNotification('success', 'Teacher deleted successfully!');
                } else {
                    alert('Teacher deleted successfully!');
                }
                setTimeout(() => {
                    window.location.href = 'admin.html'; // Redirect to admin page
                }, 1500);

            } catch (error) {
                console.error('Error deleting teacher:', error);
                if (typeof showNotification === 'function') {
                    showNotification('error', `Error: ${error.message}`);
                } else {
                    alert(`Error: ${error.message}`);
                }
            } finally {
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Teacher';
                deleteBtn.disabled = true; // Keep disabled until new search/confirm
            }
        });
    }

    // Add event listener for cancel button to clear state
    const cancelBtn = document.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            teacherDetailsSection.style.display = 'none';
            confirmCheckbox.checked = false;
            deleteBtn.disabled = true;
            if (teacherDbIdInput) {
                teacherDbIdInput.value = ''; // Clear stored DB ID
            }
            teacherIdInput.value = ''; // Clear search input
        });
    }
});
