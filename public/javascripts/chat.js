if (typeof document !== 'undefined') { const addBtn = document.querySelector(".addNew")
     const allUsers = document.querySelector('.allUsers') 
    disp = false; addBtn.addEventListener("click", () => { allUsers.classList.toggle("show"); 

    });
}

const input = document.getElementById("message");
const sendBtn = document.getElementById("msg");
const chatBox = document.querySelector(".chat");
const chatUserName = document.getElementById("chatUserName");
const onlineStatus = document.getElementById("onlineStatus");
const chatAvatar = document.getElementById("chatAvatar");
const deleteChatBtn = document.getElementById("deleteChatBtn");
const removeFriendBtn = document.getElementById("removeFriendBtn");

let receiverId = null;

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Get avatar color from user ID
function getAvatarColor(id) {
    const hue = id.toString().split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 360;
    return `hsl(${hue}, 70%, 60%)`;
}

// Update chat header with friend info
function updateChatHeader(friendName, friendId) {
    if (chatUserName) chatUserName.textContent = friendName;
    if (onlineStatus) onlineStatus.textContent = "Online";
    
    if (chatAvatar) {
        // Fetch friend's profile picture
        const friendCard = document.querySelector(`.friend-card[data-id="${friendId}"]`);
        const friendImg = friendCard?.querySelector('img.friend-avatar');
        
        if (friendImg && friendImg.src) {
            // Friend has profile picture
            updateChatAvatarWithPicture(friendImg.src);
        } else {
            // Use avatar with initials
            const color = getAvatarColor(friendId);
            chatAvatar.style.background = color;
            chatAvatar.innerHTML = `<span>${getInitials(friendName)}</span>`;
        }
    }
}

// Mark friend as active
function markFriendActive(cardElement) {
    document.querySelectorAll('.friend-card').forEach(card => {
        card.classList.remove('active');
    });
    if (cardElement) cardElement.classList.add('active');
}

// when friend clicked (only attach once)
function attachFriendCardListeners() {
    document.querySelectorAll(".friend-card").forEach(card => {
        card.removeEventListener("click", handleFriendCardClick);
        card.addEventListener("click", handleFriendCardClick);
    });
    
    // Attach delete friend button listeners
    document.querySelectorAll(".delete-friend-btn").forEach(btn => {
        btn.removeEventListener("click", handleDeleteFriend);
        btn.addEventListener("click", handleDeleteFriend);
    });
}

async function handleFriendCardClick(e) {
    const card = e.currentTarget;
    receiverId = card.dataset.id;
    const friendName = card.querySelector(".dBname h4")?.textContent || "User";
    
    markFriendActive(card);
    updateChatHeader(friendName, receiverId);
    updateHeaderButtonsVisibility();
    
    chatBox.innerHTML = "";

    try {
        const res = await fetch(`/messages/${CURRENT_USER}/${receiverId}`);
        if (!res.ok) throw new Error("Failed to load messages");
        
        const messages = await res.json();

        messages.forEach(msg => {
            if (msg.sender.toString() === CURRENT_USER) {
                addMessage(msg.text, "sent");
            } else {
                addMessage(msg.text, "received");
            }
        });
        
        // Scroll to bottom
        setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 100);
    } catch (err) {
        console.error("Error loading messages:", err);
        addMessage("Failed to load messages", "error");
    }
}

// Handle delete friend button click
async function handleDeleteFriend(e) {
    e.stopPropagation(); // Prevent triggering friend card click
    
    const friendId = e.currentTarget.dataset.friendId;
    const friendCard = document.querySelector(`.friend-card[data-id="${friendId}"]`);
    const friendName = friendCard?.querySelector(".dBname h4")?.textContent || "Friend";
    
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/removeFriend/${friendId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove friend');
        }
        
        // Remove friend card from UI
        friendCard?.remove();
        
        // If this friend was selected, clear the chat
        if (receiverId === friendId) {
            receiverId = null;
            chatBox.innerHTML = "";
            chatUserName.textContent = "Select a chat";
            deleteChatBtn.style.display = "none";
            removeFriendBtn.style.display = "none";
        }
        
        alert(`${friendName} has been removed from your friends`);
    } catch (error) {
        console.error('Error removing friend:', error);
        alert('Failed to remove friend. Please try again.');
    }
}

// Handle delete chat button click
async function handleDeleteChat() {
    if (!receiverId) {
        alert("No chat selected");
        return;
    }
    
    if (!confirm("Are you sure you want to delete this chat? This will remove all messages.")) {
        return;
    }
    
    try {
        const response = await fetch(`/deleteMessages/${receiverId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete chat');
        }
        
        // Clear chat box
        chatBox.innerHTML = "";
        alert("Chat deleted successfully");
    } catch (error) {
        console.error('Error deleting chat:', error);
        alert('Failed to delete chat. Please try again.');
    }
}

// Handle remove friend from header
function handleRemoveFriend() {
    if (!receiverId) {
        alert("No friend selected");
        return;
    }
    
    const deleteBtn = document.querySelector(`.delete-friend-btn[data-friend-id="${receiverId}"]`);
    if (deleteBtn) {
        deleteBtn.click();
    }
}

// Update header buttons visibility
function updateHeaderButtonsVisibility() {
    if (receiverId) {
        deleteChatBtn.style.display = "inline-block";
        removeFriendBtn.style.display = "inline-block";
    } else {
        deleteChatBtn.style.display = "none";
        removeFriendBtn.style.display = "none";
    }
}

attachFriendCardListeners();

// Event listeners for delete buttons
deleteChatBtn.addEventListener("click", handleDeleteChat);
removeFriendBtn.addEventListener("click", handleRemoveFriend);

// Allow Enter key to send message
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});


// Update friend card with last message
function updateFriendLastMessage(friendId, message) {
    const friendCard = document.querySelector(`.friend-card[data-id="${friendId}"]`);
    if (!friendCard) return;
    
    let lastMessageDiv = friendCard.querySelector('.last-message');
    if (!lastMessageDiv) {
        lastMessageDiv = document.createElement('div');
        lastMessageDiv.className = 'last-message';
        friendCard.querySelector('.Container').appendChild(lastMessageDiv);
    }
    
    const truncatedMsg = message.length > 30 ? message.substring(0, 30) + '...' : message;
    lastMessageDiv.innerHTML = `<p>${truncatedMsg}</p>`;
}

// Update friend card profile picture
function updateFriendProfilePicture(friendId, profilePicture) {
    const friendCard = document.querySelector(`.friend-card[data-id="${friendId}"]`);
    if (!friendCard) return;
    
    const profileDiv = friendCard.querySelector('.profile');
    if (!profileDiv) return;
    
    // Remove old avatar/image
    profileDiv.innerHTML = '';
    
    if (profilePicture) {
        // Add profile picture
        const img = document.createElement('img');
        img.className = 'friend-avatar';
        img.src = profilePicture;
        img.alt = 'Profile';
        img.style.cssText = 'width: 56px; height: 56px; border-radius: 50%; object-fit: cover;';
        profileDiv.appendChild(img);
    } else {
        // Show avatar with initials
        const friendName = friendCard.querySelector('.dBname h4')?.textContent || 'User';
        const hue = friendId.toString().split('').reduce((a,b)=>a+b.charCodeAt(0),0) % 360;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.style.background = `hsl(${hue}, 70%, 60%)`;
        avatarDiv.innerHTML = friendName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        profileDiv.appendChild(avatarDiv);
    }
}

// Update chat header avatar with profile picture
function updateChatAvatarWithPicture(profilePicture) {
    if (!chatAvatar) return;
    
    // Clear existing content
    const existingImg = chatAvatar.querySelector('img');
    const existingSpan = chatAvatar.querySelector('span');
    
    if (profilePicture) {
        // Remove existing elements
        if (existingImg) existingImg.remove();
        if (existingSpan) existingSpan.remove();
        
        // Add profile picture
        const img = document.createElement('img');
        img.src = profilePicture;
        img.alt = 'Profile';
        img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
        chatAvatar.appendChild(img);
    }
}


function addMessage(text, type) {
    if (!chatBox) return;
    
    const div = document.createElement("div");
    div.classList.add("message", type);
    div.innerText = text;
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

const observer = new MutationObserver(() => {
    attachFriendCardListeners();
});

observer.observe(document.body, { childList: true, subtree: true });

const socket = io();

socket.emit("register", CURRENT_USER);

sendBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (!receiverId) {
        alert("Select a chat first");
        return;
    }

    const message = input.value.trim();
    if (!message) return;

    socket.emit("send-message", {
        message,
        to: receiverId,
        from: CURRENT_USER
    });

    addMessage(message, "sent");
    input.value = "";
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
});

socket.on("receive-msg", (data) => {
    updateFriendLastMessage(data.from, data.message);

    if (data.from === receiverId) {
        addMessage(data.message, "received");

        setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
    }
});
