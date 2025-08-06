// Initialize Socket.IO connection
const socket = io();

document.getElementById('teacher-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;

    const formData = {
        teacher_id: form.querySelector('#teacher-id').value,
        fullname: form.querySelector('#fullname').value,
        dob: form.querySelector('#dob').value,
        class_assigned: form.querySelector('#class').value,
        section: form.querySelector('#section').value,
        subject: form.querySelector('#subject').value
    };

    console.log('Sending FormData:', formData);

    try {
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const response = await fetch('http://localhost:3000/api/teachers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            // Emit socket event for real-time update
            socket.emit('teacher:add', formData); // Emit teacher data to server

            // global showNotification
            if (typeof showNotification === 'function') {
                showNotification('success', 'Teacher added successfully!');
            } else {
                alert('Teacher added successfully!'); // Fallback
            }
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
        } else {
            console.error('Server response error:', result);
            //  global showNotification
            if (typeof showNotification === 'function') {
                showNotification('error', result.error || 'Failed to add teacher');
            } else {
                alert(`Error: ${result.error || 'Failed to add teacher'}`); // Fallback
            }
            throw new Error(result.error || 'Failed to add teacher');
        }
    } catch (error) {
        console.error('Error:', error);
        //  global showNotification
        if (typeof showNotification === 'function') {
            showNotification('error', error.message);
        } else {
            alert(`Error: ${error.message}`); // Fallback
        }
    } finally {
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Teacher';
        }
    }
});