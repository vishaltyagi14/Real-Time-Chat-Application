/**
 * Profile Management JavaScript
 * Handles profile modal interactions, form submission, and profile picture uploads
 */

// DOM Elements
const profileModal = document.getElementById('profileModal');
const openProfileBtn = document.getElementById('openProfileBtn');
const closeProfileBtn = document.getElementById('closeProfile');
const cancelBtn = document.querySelector('.btn-cancel');
const profileForm = document.getElementById('profileForm');
const pictureInput = document.getElementById('pictureInput');
const profilePicDisplay = document.getElementById('profilePicDisplay');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const bioInput = document.getElementById('bioInput');

// Character counter for bio
let bioCharCount = null;

/**
 * Initialize profile management
 */
function initProfile() {
    // Populate form with current user data
    if (CURRENT_USER_DATA) {
        nameInput.value = CURRENT_USER_DATA.name || '';
        emailInput.value = CURRENT_USER_DATA.email || '';
        phoneInput.value = CURRENT_USER_DATA.phone || '';
        bioInput.value = CURRENT_USER_DATA.bio || '';
        
        // Display profile picture
        updateProfilePictureDisplay();
        
        // Create character counter
        createBioCharCounter();
    }
    
    // Event listeners
    openProfileBtn.addEventListener('click', openProfileModal);
    closeProfileBtn.addEventListener('click', closeProfileModal);
    cancelBtn.addEventListener('click', closeProfileModal);
    profileModal.addEventListener('click', handleModalBackdropClick);
    profileForm.addEventListener('submit', handleProfileFormSubmit);
    pictureInput.addEventListener('change', handlePictureChange);
    bioInput.addEventListener('input', updateBioCharCount);
}

/**
 * Open profile modal
 */
function openProfileModal() {
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close profile modal
 */
function closeProfileModal() {
    profileModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

/**
 * Handle modal backdrop click (close on outside click)
 */
function handleModalBackdropClick(e) {
    if (e.target === profileModal) {
        closeProfileModal();
    }
}

/**
 * Handle profile picture file selection
 */
function handlePictureChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
        showNotification('File size must be less than 1MB', 'error');
        pictureInput.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        pictureInput.value = '';
        return;
    }
    
    // Read file and preview
    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Image = event.target.result;
        
        // Update preview
        updateProfilePicturePreview(base64Image);
        
        // Upload immediately
        uploadProfilePicture(base64Image);
    };
    reader.readAsDataURL(file);
}

/**
 * Upload profile picture to server
 */
async function uploadProfilePicture(base64Image) {
    try {
        showLoadingState(true);
        
        const response = await fetch('/updateProfilePicture', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload profile picture');
        }
        
        const data = await response.json();
        
        // Update current user data
        if (data.user) {
            CURRENT_USER_DATA.profilePicture = data.user.profilePicture;
            showNotification('Profile picture updated successfully', 'success');
            
            // Emit socket event to notify other users
            if (typeof socket !== 'undefined') {
                socket.emit('profile_picture_updated', {
                    userId: CURRENT_USER_DATA._id,
                    profilePicture: data.user.profilePicture
                });
            }
        }
        
        showLoadingState(false);
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showNotification('Failed to upload profile picture: ' + error.message, 'error');
        showLoadingState(false);
    }
}

/**
 * Update profile picture display
 */
function updateProfilePictureDisplay() {
    if (CURRENT_USER_DATA.profilePicture) {
        // Show uploaded picture
        profilePicDisplay.innerHTML = `<img src="${CURRENT_USER_DATA.profilePicture}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        // Show initials avatar
        const initials = CURRENT_USER_DATA.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        const hue = CURRENT_USER_DATA._id
            .toString()
            .split('')
            .reduce((a, b) => a + b.charCodeAt(0), 0) % 360;
        
        profilePicDisplay.style.background = `hsl(${hue}, 70%, 60%)`;
        profilePicDisplay.innerHTML = initials;
    }
}


function updateProfilePicturePreview(base64Image) {
    profilePicDisplay.innerHTML = `<img src="${base64Image}" alt="Profile Preview" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
}

function createBioCharCounter() {
    const charCountDiv = document.createElement('div');
    charCountDiv.className = 'char-count';
    charCountDiv.id = 'bioCharCount';
    charCountDiv.textContent = `${bioInput.value.length}/150`;
    bioInput.parentNode.appendChild(charCountDiv);
    bioCharCount = charCountDiv;
}

/**
 * Update bio character count display
 */
function updateBioCharCount() {
    if (bioCharCount) {
        bioCharCount.textContent = `${bioInput.value.length}/150`;
    }
}

/**
 * Handle profile form submission
 */
async function handleProfileFormSubmit(e) {
    e.preventDefault();
    
    // Validate inputs
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const bio = bioInput.value.trim();
    
    if (!name) {
        showNotification('Name is required', 'error');
        nameInput.focus();
        return;
    }
    
    if (name.length < 2 || name.length > 50) {
        showNotification('Name must be between 2 and 50 characters', 'error');
        nameInput.focus();
        return;
    }
    
    if (bio && bio.length > 150) {
        showNotification('Bio must not exceed 150 characters', 'error');
        bioInput.focus();
        return;
    }
    
    try {
        showLoadingState(true);
        
        const response = await fetch('/updateProfile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                bio: bio || "Hey there! I'm using Chat App"
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }
        
        const data = await response.json();
        
        // Update current user data
        if (data.user) {
            CURRENT_USER_DATA.name = data.user.name;
            CURRENT_USER_DATA.phone = data.user.phone;
            CURRENT_USER_DATA.bio = data.user.bio;
            
            // Update UI
            updateHeaderWithUserData();
            showNotification('Profile updated successfully!', 'success');
            
            // Close modal after success
            setTimeout(closeProfileModal, 1500);
        }
        
        showLoadingState(false);
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile: ' + error.message, 'error');
        showLoadingState(false);
    }
}

/**
 * Update header display with new user data
 */
function updateHeaderWithUserData() {
    // Update header name if a chat is not selected
    const chatUserName = document.getElementById('chatUserName');
    if (chatUserName && chatUserName.textContent === 'Select a chat') {
        // Reset to default
        chatUserName.textContent = 'Select a chat';
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.profile-notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `profile-notification ${type}`;
    notification.textContent = message;
    
    // Insert at top of modal body
    const modalBody = profileModal.querySelector('.profile-body');
    modalBody.insertBefore(notification, modalBody.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Show/hide loading state on buttons
 */
function showLoadingState(isLoading) {
    const saveBtn = document.querySelector('.btn-save');
    if (isLoading) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner" style="animation: spin 1s linear infinite;"></i> Saving...';
    } else {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

// Add spinner animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
} else {
    initProfile();
}
