if (typeof document !== 'undefined') { const addBtn = document.querySelector(".addNew")
     const allUsers = document.querySelector('.allUsers') 
    disp = false; addBtn.addEventListener("click", () => { allUsers.classList.toggle("show"); 

    });
}

const input = document.getElementById("message");
const sendBtn = document.getElementById("msg");
const friend= document.querySelector(".friend-card") 
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
        // Load last message for this friend card (only once)
        if (!card.dataset.messagesLoaded) {
            loadLastMessageForFriend(card);
            card.dataset.messagesLoaded = "true";
        }
    });
    
    // Attach delete friend button listeners
    document.querySelectorAll(".delete-friend-btn").forEach(btn => {
        btn.removeEventListener("click", handleDeleteFriend);
        btn.addEventListener("click", handleDeleteFriend);
    });
}

async function loadLastMessageForFriend(cardElement) {
    try {
        const friendId = cardElement.dataset.id;
        if (!friendId) return;
        
        const res = await fetch(`/messages/${CURRENT_USER}/${friendId}`);
        if (!res.ok) return;
        
        const messages = await res.json();
        if (messages.length === 0) return;
        
        // Get the last message
        const lastMsg = messages[messages.length - 1];
        
        const otherUser = lastMsg.sender === CURRENT_USER ? lastMsg.receiver : lastMsg.sender;
        const secretKey = "secure_" + [CURRENT_USER, otherUser].sort().join("_") + "_v1@2026";
        
        try {
            const bytes = CryptoJS.AES.decrypt(lastMsg.text, secretKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            
            if (decrypted && decrypted.trim().length > 0) {
                updateFriendLastMessage(friendId, decrypted);
            }
        } catch (err) {
            // Silently fail if decryption fails
        }
    } catch (err) {
        // Silently fail if fetching messages fails
    }
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

        let lastDecryptedMsg = "";

        messages.forEach(msg => {

    const otherUser =
        msg.sender === CURRENT_USER ? msg.receiver : msg.sender;

    const secretKey =
        "secure_" + [CURRENT_USER, otherUser].sort().join("_") + "_v1@2026";

    let finalMsg;

    try {
        const bytes = CryptoJS.AES.decrypt(msg.text, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        // ✅ only accept decrypted if valid
        if (decrypted && decrypted.trim().length > 0) {
            finalMsg = decrypted;
        } else {
            finalMsg = "[Unable to decrypt]";
        }
    } catch (err) {
        finalMsg = "[Error decrypting]";
    }

    const type = msg.sender === CURRENT_USER ? "sent" : "received";

    addMessage(finalMsg, type);
    lastDecryptedMsg = finalMsg;
});  
        // Update friend card with last decrypted message
        if (lastDecryptedMsg) {
            updateFriendLastMessage(receiverId, lastDecryptedMsg);
        }
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
    e.stopPropagation(); 
    
    const btn = e.currentTarget;
    const friendId = btn.dataset.friendId;  // Changed from dataset.id to dataset.friendId
    
    if (!friendId) {
        console.error("Friend ID not found on button");
        return;
    }
    
    const friendCard = document.querySelector(`.friend-card[data-id="${friendId}"]`);
    const friendName = friendCard?.querySelector(".dBname h4")?.textContent || "Friend";
    
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/removeFriend/${friendId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('Failed to remove friend');
        }
        
        // Remove friend card from friends list
        friendCard?.remove();
        
        // Also remove from all users list
        const allUsersCard = document.querySelector(`.allUsers .friend-card[data-id="${friendId}"]`);
        allUsersCard?.remove();
        
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

// Handle remove friend from header
function handleRemoveFriend() {
    if (!receiverId) {
        alert("No friend selected");
        return;
    }
    
    const deleteBtn = document.querySelector(`.delete-friend-btn[data-friend-id="${receiverId}"]`);  // Changed to data-friend-id
    if (deleteBtn) {
        deleteBtn.click();
    }
}

// Handle delete chat button click
async function handleDeleteChat(e) {
    const card= e.currentTarget;
    receiverId = friend.dataset.id;
    // console.log(receiverId)
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
    const secretKey = "secure_" + [CURRENT_USER, receiverId].sort().join("_") + "_v1@2026";
    const encrypted = CryptoJS.AES.encrypt(message,secretKey).toString()
    socket.emit("send-message", {
        message: encrypted,
        to: receiverId,
        from: CURRENT_USER
    });

    addMessage(message, "sent");
    updateFriendLastMessage(receiverId, message);
    input.value = "";
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
});

socket.on("receive-msg", (data) => {
    const secretKey = "secure_" + [CURRENT_USER, data.from].sort().join("_") + "_v1@2026";

    const bytes =CryptoJS.AES.decrypt(data.message,secretKey)
    const decrypted= bytes.toString(CryptoJS.enc.Utf8)
    const finalMsg = decrypted || data.message;
    updateFriendLastMessage(data.from, finalMsg);

    if (receiverId && data.from === receiverId) {
        addMessage(finalMsg, "received");

        setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
    }
});

let timeout;
const inputUsername = document.querySelector('#searchUser');
const resultsDiv = document.querySelector(".results");
const closeAllSearchBtn = document.querySelector('#closeAllSearch');

// Clear search results and close button
if (closeAllSearchBtn) {
    closeAllSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        inputUsername.value = '';
        resultsDiv.innerHTML = '';
        closeAllSearchBtn.style.display = 'none';
        inputUsername.focus();
    });
}

// Search functionality with improved logic
inputUsername.addEventListener("input", () => {
    clearTimeout(timeout);
    
    const query = inputUsername.value.trim();
    
    if (!query) {
        resultsDiv.innerHTML = '';
        closeAllSearchBtn.style.display = 'none';
        return;
    }
    
    // Show close button when there's text
    // closeAllSearchBtn.style.display = 'block';
    
    // Show loading state
    resultsDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #999; font-size: 14px;"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
    
    timeout = setTimeout(async () => {
        try {
            // Get current user and added user IDs from the page if available
            const currentUser = typeof CURRENT_USER !== 'undefined' ? CURRENT_USER : 'unknown';
            const addedUserIds = Array.from(document.querySelectorAll('.friend-card[data-id]'))
                .map(el => el.getAttribute('data-id'))
                .filter(Boolean);
            
            const queryParams = new URLSearchParams({
                q: query,
                currentUser: currentUser,
                addedUserIds: JSON.stringify(addedUserIds)
            });
            
            const res = await fetch(`/search-users?${queryParams}`);
            
            if (!res.ok) {
                throw new Error('Search failed');
            }
            
            const users = await res.json();
            resultsDiv.innerHTML = '';
            
            if (users.length === 0) {
                resultsDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #999; font-size: 14px;">No users found matching "' + query + '"</div>';
                return;
            }
            
            // Display search results
            users.forEach(user => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('search-result-item');
                
                const displayName = user.name || user.username;
                const displayUsername = user.username;
                
                resultItem.innerHTML = `
                    <div class="search-result-info">
                        <span class="search-result-name">${displayName}</span>
                        <span class="search-result-username">@${displayUsername}</span>
                    </div>
                    <form action="/adduser/${user._id}" method="post" style="margin: 0;" class="search-add-form">
                        <button type="submit" class="add-user-btn" title="Add user">
                            <i class="fa-solid fa-user-plus"></i>
                        </button>
                    </form>
                `;
                
                resultsDiv.appendChild(resultItem);
            });
        } catch (err) {
            console.error('Search error:', err);
            resultsDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #d32f2f; font-size: 14px;">Error searching users</div>';
        }
    }, 300);
});

const emojiBtn = document.querySelector(".emojiBtn");
if (emojiBtn) {
    const picker = new EmojiButton();
    const input = document.querySelector("#message"); 
    
    emojiBtn.addEventListener('click', ()=>{
        picker.togglePicker(emojiBtn);
    });
    
    picker.on('emoji', (emoji)=>{
        input.value += emoji;
        input.focus();
    });
} else {
    console.warn('Emoji button not found in DOM');
}