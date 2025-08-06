// Initialize Socket.IO connection
const socket = io();

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Handle form submission
document.getElementById('student-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;

    const formData = {
        roll_no: form.querySelector('#rollno').value,
        fullname: form.querySelector('#fullname').value,
        father_name: form.querySelector('#father').value,
        mother_name: form.querySelector('#mother').value,
        dob: form.querySelector('#dob').value,
        class_id: form.querySelector('#class').value,
        section: form.querySelector('#section').value,
        address: form.querySelector('#address').value,
        phone: form.querySelector('#phone').value,
        email: form.querySelector('#email').value || null
    };

    console.log('Sending FormData:', formData);

    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const response = await fetch('http://localhost:3000/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        // Log response status and body for debugging
        console.log('Server Response Status:', response.status);
        let result = {};
        try {
            result = await response.json(); // Attempt to parse JSON response
            console.log('Server Response Body (parsed JSON):', result);
        } catch (jsonError) {
            console.warn('Could not parse JSON response (might be empty or malformed):', jsonError);
            const textResponse = await response.text();
            console.warn('Server Response Body (raw text):', textResponse);
        }

        if (response.ok) {
            // SUCCESS PATH 
            console.log('--- Executing SUCCESS PATH in add-student.js ---'); // Unique log for confirmation

            // Emit socket event for real-time update (event name matches server's emit)
            socket.emit('student:added', formData);

            if (typeof showNotification === 'function') {
                showNotification('success', 'Student added successfully!');
            } else {
                alert('Student added successfully!');
            }

            // Redirect after a short delay to allow notification to be seen
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);

        } else {
            // ERROR PATH (Server returned a non-2xx status code) 
            console.error('--- Executing ERROR PATH in add-student.js ---'); // Unique log for confirmation
            const errorMsg = result.error || result.message || `Server returned status ${response.status} - Unknown error`;
            console.error('Server response indicates error:', errorMsg, result);

            if (typeof showNotification === 'function') {
                showNotification('error', errorMsg);
            } else {
                alert(`Error: ${errorMsg}`);
            }
        }
    } catch (networkOrUnhandledError) {
        // This catch block handles network errors (e.g., server unreachable, CORS issues before response)
        // or unexpected client-side JavaScript errors that occur within the try block.
        console.error('Network or unhandled client-side error:', networkOrUnhandledError);

        if (typeof showNotification === 'function') {
            showNotification('error', `Network error or unexpected problem: ${networkOrUnhandledError.message}`);
        } else {
            alert(`Network error or unexpected problem: ${networkOrUnhandledError.message}`);
        }
    } finally {
        // Always re-enable the submit button regardless of success or failure
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Student';
    }
});

// Reset handler to clear UI state (e.g., remove notifications)
document.getElementById('student-form').addEventListener('reset', () => {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
});
