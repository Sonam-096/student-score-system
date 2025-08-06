document.addEventListener('DOMContentLoaded', function() {
  const passwordToggle = document.querySelector('.password-toggle');
  const passwordInput = document.getElementById('password');
  const loginForm = document.getElementById('login-form');

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', function() {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      this.innerHTML = isPassword ? '<i class="far fa-eye-slash"></i>' : '<i class="far fa-eye"></i>';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      const role = document.querySelector('input[name="role"]:checked')?.value;

      // Basic client-side validation
      if (!username || !password || !role) {
        if (typeof showNotification === 'function') {
          showNotification('error', 'Please enter all credentials and select a role.');
        } else {
          alert('Please enter all credentials and select a role.');
        }
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, role })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Store user session data
          sessionStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('userRole', result.user.role);

          if (result.user.role === 'admin') {
            sessionStorage.setItem('adminUser', result.user.username);
            if (typeof showNotification === 'function') {
              showNotification('success', 'Admin login successful!');
            }
            window.location.href = '/admin.html';
          } else if (result.user.role === 'teacher') {
            // Store teacher-specific data
            sessionStorage.setItem('teacherId', result.user.teacher_id);
            sessionStorage.setItem('teacherName', result.user.fullname);
            sessionStorage.setItem('teacherClass', result.user.class_assigned);
            sessionStorage.setItem('teacherSection', result.user.section);
            sessionStorage.setItem('teacherSubject', result.user.subject); // Store subject too

            if (typeof showNotification === 'function') {
              showNotification('success', `Welcome, Teacher ${result.user.fullname}!`);
            }
            window.location.href = '/teacher.html'; // Redirect to teacher dashboard
          } else if (result.user.role === 'student') {
            // Store student-specific data
            sessionStorage.setItem('studentId', result.user.student_id);
            sessionStorage.setItem('studentRollNo', result.user.roll_no);
            sessionStorage.setItem('studentName', result.user.fullname);
            sessionStorage.setItem('studentClass', result.user.class_id);
            sessionStorage.setItem('studentSection', result.user.section);
            sessionStorage.setItem('studentDob', result.user.dob);
            sessionStorage.setItem('studentFatherName', result.user.father_name);
            sessionStorage.setItem('studentMotherName', result.user.mother_name);
            sessionStorage.setItem('studentAddress', result.user.address);
            sessionStorage.setItem('studentPhone', result.user.phone);
            sessionStorage.setItem('studentEmail', result.user.email);

            if (typeof showNotification === 'function') {
              showNotification('success', `Welcome, Student ${result.user.fullname}!`);
            }
            window.location.href = '/student.html'; // Redirect to student dashboard
          }
        } else {
          // Handle login failure
          const errorMessage = result.message || 'Login failed. Please check your credentials.';
          console.error('Login failed:', errorMessage);
          if (typeof showNotification === 'function') {
            showNotification('error', errorMessage);
          } else {
            alert(`Login failed: ${errorMessage}`);
          }
        }
      } catch (error) {
        console.error('Network or unexpected login error:', error);
        if (typeof showNotification === 'function') {
          showNotification('error', 'Could not connect to server or unexpected error during login.');
        } else {
          alert('Could not connect to server or unexpected error during login.');
        }
      }
    });
  }
});

