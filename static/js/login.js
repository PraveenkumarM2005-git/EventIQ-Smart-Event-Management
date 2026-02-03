// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const roleBtns = document.querySelectorAll('.role-btn');
    const roleInput = document.getElementById('role');
    const emailInput = document.getElementById('email');

    // Role Toggle
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            roleInput.value = this.dataset.role;
            
            // Update placeholder based on role
            if (this.dataset.role === 'admin') {
                emailInput.placeholder = 'Enter your admin ID or email';
            } else {
                emailInput.placeholder = 'Enter your student ID or email';
            }
        });
    });

    // Form Submit
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const role = roleInput.value;

        if (!email) {
            showToast('Please enter your ID or Email', 'error');
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, role })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 500);
            } else {
                showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
            console.error('Login error:', error);
        }
    });
});

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
