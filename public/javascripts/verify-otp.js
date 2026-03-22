
if (typeof document !== 'undefined') {
    const otpFields = document.querySelectorAll('.num');
    const verifyBtn = document.querySelector('#submit');

    otpFields.forEach((field, index) => {
        field.addEventListener('input', () => {
            field.value = field.value.replace(/[^0-9]/g, '');
            if (field.value.length === 1 && index < otpFields.length - 1) {
                otpFields[index + 1].focus();
            }
        });

        field.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && field.value === '' && index > 0) {
                otpFields[index - 1].focus();
            }
        });
    });

    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const otp = Array.from(otpFields).map((input) => input.value).join('');

            if (otp.length !== 6) {
                alert('Please enter all 6 digits.');
                return;
            }

            try {
                const response = await fetch('/verifyOtp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ otp })
                });

                const data = await response.json();
                if (data.success) {
                    window.location.href = '/chat';
                } else {
                    alert(data.message || 'Wrong OTP');
                }
            } catch (error) {
                alert('Unable to verify OTP right now. Please try again.');
            }
        });
    }
}