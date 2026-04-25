import { useState, useEffect, useRef } from "react";

function App() {
  const [page, setPage] = useState("login");
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  // AUTH
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // PROFILE STATE
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState(null);

  // MEMORY STATE
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [group, setGroup] = useState("");
  const [memories, setMemories] = useState([]);

  // GROUPS STATE
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState([]);
  const [groups, setGroups] = useState([]);

  // FRIENDS & USERS STATE
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); // for tagging
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef();

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) setImage(e.dataTransfer.files[0]);
  };

  // PRE-FILL PROFILE WHEN USERS CHANGE
  useEffect(() => {
    const me = users.find(u => u._id === userId);
    if (me && !profileName) {
      setProfileName(me.name);
    }
  }, [users, userId, profileName]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch("https://gk-memory-backend.onrender.com/api/auth/users");
    const data = await res.json();
    setUsers(data || []);
  };

  const fetchMemories = async (id) => {
    const res = await fetch(`https://gk-memory-backend.onrender.com/api/memory/${id}`);
    const data = await res.json();
    setMemories(data || []);
  };

  const fetchGroups = async (id) => {
    const res = await fetch(`https://gk-memory-backend.onrender.com/api/groups/${id}`);
    const data = await res.json();
    setGroups(data || []);
  };

  const fetchFriends = async (id) => {
    try {
      const res = await fetch(`https://gk-memory-backend.onrender.com/api/friends/${id}`);
      const data = await res.json();
      
      const processedFriends = (data.friends || []).map(f => 
        (f.requester && f.requester._id === id) ? f.recipient : f.requester
      ).filter(Boolean);
      setFriends(processedFriends);

      const sentIds = (data.sentRequests || []).map(req => req.recipient && req.recipient._id).filter(Boolean);
      setSentRequests(sentIds);

      const incomingUsers = (data.incomingRequests || []).map(req => req.requester).filter(Boolean);
      setIncomingRequests(incomingUsers);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  // ================= AUTH =================
  const handleRegister = async () => {
    if (!email.endsWith("@gmail.com")) {
      return alert("Email must end with @gmail.com");
    }
    const res = await fetch("https://gk-memory-backend.onrender.com/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    alert(data.message);
    if (!data.error) setPage("login");
  };

  const handleLogin = async () => {
    const res = await fetch("https://gk-memory-backend.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.user) {
      setUserId(data.user._id);
      fetchMemories(data.user._id);
      fetchFriends(data.user._id);
      fetchGroups(data.user._id);
      setActiveTab("home");
      setPage("app");
    } else {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setUserId("");
    setPage("login");
  };

  // ================= PROFILE UPDATE =================
  const handleProfileUpdate = async () => {
    const formData = new FormData();
    formData.append("userId", userId);
    if (profileName) formData.append("name", profileName);
    if (profileAvatar) formData.append("avatar", profileAvatar);

    try {
      const res = await fetch("https://gk-memory-backend.onrender.com/api/auth/updateProfile", { method: "POST", body: formData });
      const data = await res.json();
      alert(data.message || "Profile updated!");
      fetchUsers(); // Refresh the overarching users context
    } catch (err) {
      console.error(err);
      alert("Failed to update profile. Did you restart the server?");
    }
  };

  // ================= GROUP =================
  const handleCreateGroupAction = async () => {
    if (!newGroupName.trim()) return alert("Group name is required");
    try {
      const res = await fetch("https://gk-memory-backend.onrender.com/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: newGroupName,
          createdBy: userId,
          members: newGroupMembers
        })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         return alert("Backend route not found! Please restart your Node server (Ctrl+C then node server.js).");
      }
      
      const data = await res.json();
      alert(data.message || "Group created");
      setNewGroupName("");
      setNewGroupMembers([]);
      fetchGroups(userId);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to backend group route. Did you restart the server?");
    }
  };

  // ================= FRIEND (tag & request) =================
  const handleSelectUser = (id) => {
    if (id && !selectedUsers.includes(id)) {
      setSelectedUsers(prev => [...prev, id]);
    }
  };

  const removeUser = (id) => {
    setSelectedUsers(prev => prev.filter(u => u !== id));
  };

  const sendFriendRequest = async (toId) => {
    try {
      const res = await fetch("https://gk-memory-backend.onrender.com/api/friends/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: userId, toId: toId })
      });
      const data = await res.json();
      alert(data.message);
      fetchFriends(userId);
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  const handleAcceptRequest = async (fromId) => {
    await fetch("https://gk-memory-backend.onrender.com/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, fromId })
    });
    fetchFriends(userId);
  };

  const handleRejectRequest = async (fromId) => {
    await fetch("https://gk-memory-backend.onrender.com/api/friends/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, fromId })
    });
    fetchFriends(userId);
  };

  // ================= MEMORY UPLOAD & CONTROL =================
  const handleUpload = async () => {
    if (!image) return alert("Select image");
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("caption", caption);
    formData.append("group", group);
    formData.append("image", image);
    formData.append("taggedUsers", JSON.stringify(selectedUsers));
    await fetch("https://gk-memory-backend.onrender.com/api/memory/add", {
      method: "POST",
      body: formData
    });
    fetchMemories(userId);
    setCaption("");
    setGroup("");
    setSelectedUsers([]);
    setImage(null);
    alert("Memory Posted! 🎉");
  };

  const handleDelete = async (id) => {
    await fetch(`https://gk-memory-backend.onrender.com/api/memory/${id}`, { method: "DELETE" });
    fetchMemories(userId);
  };

  const handleDownload = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName || 'download.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download image");
    }
  };

  // ----- RENDER HELPERS -----
  const renderAvatar = (userObj) => {
    if (!userObj) return null;
    if (userObj.avatar) {
      return <img src={`https://gk-memory-backend.onrender.com/uploads/${userObj.avatar}`} alt="Avatar" style={{width: 36, height: 36, borderRadius: "50%", objectFit: "cover"}} />;
    }
    return (
      <div style={{width: 36, height: 36, borderRadius: "50%", background: "#7DA78C", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px"}}>
        {userObj.name ? userObj.name[0].toUpperCase() : "?"}
      </div>
    );
  };

  // ================= VIEW: PROFILE =================
  const renderProfile = () => {
    const me = users.find(u => u._id === userId);
    return (
      <div className="card">
        <h3>👤 Edit Profile</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px'}}>
           {renderAvatar(me)}
           <span style={{fontSize: "18px", fontWeight: "bold", color: "#2b453a"}}>{me?.name}</span>
        </div>
        <p style={{fontWeight: "600", marginBottom: "8px"}}>Display Name</p>
        <input 
          placeholder="Your Name" 
          value={profileName} 
          onChange={e => setProfileName(e.target.value)} 
          className="input-field" 
        />
        <p style={{fontWeight: "600", marginBottom: "8px"}}>Profile Picture</p>
        <input 
          type="file" 
          onChange={e => setProfileAvatar(e.target.files[0])} 
          className="input-field"
          style={{padding: "10px", background: "white"}}
        />
        <button className="btn-main" onClick={handleProfileUpdate}>💾 Save Profile</button>
      </div>
    );
  };

  // ================= VIEW: FRIENDS =================
  const renderFriendsTab = () => {
    const friendIds = friends.map(f => f._id);
    const incomingIds = incomingRequests.map(u => u._id);
    const nonFriendUsers = users.filter(u => 
      u._id !== userId && 
      !friendIds.includes(u._id) && 
      !sentRequests.includes(u._id) &&
      !incomingIds.includes(u._id)
    );

    return (
      <div className="card">
        <h3>👥 Network & Friends</h3>

        {incomingRequests.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontWeight: "700", marginBottom: "8px", color: "#35858E" }}>Pending Requests</p>
            {incomingRequests.map(u => (
              <div key={u._id} className="friend-row" style={{alignItems: "center"}}>
                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                  {renderAvatar(u)}
                  <span className="friend-name">{u.name}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-accept" onClick={() => handleAcceptRequest(u._id)}>✓ Accept</button>
                  <button className="btn-reject" onClick={() => handleRejectRequest(u._id)}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {nonFriendUsers.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontWeight: "700", marginBottom: "8px", color: "#35858E", borderTop: incomingRequests.length > 0 ? "1px solid #eee" : "none", paddingTop: incomingRequests.length > 0 ? "16px" : "0" }}>Discover & Add Friends</p>
            {nonFriendUsers.map(u => (
                <div key={u._id} className="friend-row" style={{alignItems: "center"}}>
                  <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    {renderAvatar(u)}
                    <span className="friend-name">{u.name}</span>
                  </div>
                  <button className="btn-mini" onClick={() => sendFriendRequest(u._id)}>+ Add</button>
                </div>
            ))}
          </div>
        )}

        {sentRequests.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontWeight: "700", marginBottom: "8px", color: "#888" }}>Sent Requests</p>
            {users.filter(u => sentRequests.includes(u._id)).map(u => (
              <div key={u._id} className="friend-row" style={{alignItems: "center"}}>
                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                   {renderAvatar(u)}
                   <span className="friend-name">{u.name}</span>
                </div>
                <span style={{ color: "#aaa", fontSize: "14px", fontWeight: "600", padding: "6px 12px", background: "#f0f0f0", borderRadius: "20px" }}>Pending...</span>
              </div>
            ))}
          </div>
        )}

        {friends.length > 0 && (
          <div>
            <p style={{ fontWeight: "700", marginBottom: "8px", color: "#7DA78C" }}>My Friends</p>
            {friends.map(f => (
              <div key={f._id} className="friend-row" style={{alignItems: "center"}}>
                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    {renderAvatar(f)}
                    <span className="friend-name">{f.name}</span>
                </div>
                <span style={{ color: "#7DA78C", fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Friend
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ================= VIEW: GROUPS =================
  const renderGroupsTab = () => (
    <div className="card">
      <h3>👥 Build a New Group</h3>
      <input 
        placeholder="Super cool group name..." 
        value={newGroupName} 
        onChange={(e) => setNewGroupName(e.target.value)} 
        className="input-field" 
      />
      <select 
        onChange={(e) => {
          const val = e.target.value;
          if (val && !newGroupMembers.includes(val)) {
            setNewGroupMembers([...newGroupMembers, val]);
          }
        }} 
        className="input-field"
      >
        <option value="">Add friends to group...</option>
        {friends.map(f => (
          <option key={f._id} value={f._id}>{f.name}</option>
        ))}
      </select>

      <div className="chips-container">
        {newGroupMembers.map(id => {
          const u = friends.find(u => u._id === id);
          return (
            <div key={id} className="chip">
              {renderAvatar(u)}
              {u?.name}
              <div onClick={() => setNewGroupMembers(prev => prev.filter(m => m !== id))} className="chip-remove">✕</div>
            </div>
          );
        })}
      </div>

      <button className="btn-main" style={{background: "#7DA78C"}} onClick={handleCreateGroupAction}>Create Group 🌟</button>
      
      {groups.length > 0 && (
        <div style={{ marginTop: "30px", borderTop: "2px solid #f0f4f0", paddingTop: "20px" }}>
          <h4>Your Groups</h4>
          {groups.map(g => (
            <div key={g._id} style={{background: "#f4f7f4", padding: "16px", borderRadius: "12px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
               <span style={{fontWeight: "bold", color: "#2b453a", display: "flex", alignItems: "center", gap: "8px"}}>📦 {g.groupName}</span>
               <span style={{fontSize: "13px", color: "#666"}}>{g.members?.length || 0} Members</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ================= VIEW: ABOUT =================
  const renderAbout = () => (
    <div className="card shadow-md">
      <h3>ℹ️ About This App</h3>
      <p style={{fontSize: "16px", color: "#555"}}>Welcome to GK Memory! Here's how to navigate and use the platform:</p>
      <ul style={{ lineHeight: "2", color: "#2b453a", fontWeight: "500", marginTop: "16px", paddingLeft: "20px" }}>
        <li><strong>🏠 Home:</strong> Create new memories, upload photos, and view your personal timeline. You can also view any memories you've been tagged in!</li>
        <li><strong>👥 Friends:</strong> Discover new friends, send and manage requests. Build your social circle here.</li>
        <li><strong>📦 Groups:</strong> Build custom groups with your friends so you can share private memories only accessible to that group.</li>
        <li><strong>👤 Profile:</strong> Set your display name and upload a profile picture so your friends can easily recognize you.</li>
      </ul>
      <div style={{ marginTop: "36px", padding: "20px", background: "#f4f7f4", borderRadius: "16px", border: "1px solid #e2e8e4" }}>
        <p style={{ margin: "0 0 12px", fontWeight: "bold", color: "#35858E", fontSize: "15px", textTransform: "uppercase", letterSpacing: "1px" }}>DEVELOPER CREDITS</p>
        <p style={{ margin: "4px 0", fontSize: "16px", fontWeight: "600", color: "#1a2421" }}>P. GANESH KUMAR</p>
        <p style={{ margin: 0, color: "#666" }}>✉️ gk044996@gmail.com</p>
      </div>
    </div>
  );

  // ================= VIEW: HOME (Feed & Upload) =================
  const renderHome = () => (
    <>
      <div className="card">
        <h3>➕ Create Memory</h3>

        <div
          className={`drop-box ${dragActive ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />
          <svg style={{margin: "0 auto 12px", display: "block"}} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7DA78C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          <p style={{margin:0}}>{image ? image.name : "Drag & Drop or Click to Upload Image"}</p>
        </div>

        <textarea
          placeholder="Write a beautiful caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="input-field"
          style={{ marginTop: "16px", minHeight: "80px", resize: "vertical" }}
        />

        <div className="flex-row">
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="input-field" style={{marginBottom: 0}}>
            <option value="">Select a Group (Optional)...</option>
            {groups.map((g) => <option key={g._id} value={g._id}>{g.groupName}</option>)}
          </select>
        </div>

        <select value="" onChange={(e) => handleSelectUser(e.target.value)} className="input-field">
          <option value="">Tag a Friend...</option>
          {friends.map(u => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>

        <div className="chips-container">
          {selectedUsers.map(id => {
            const user = users.find(u => u._id === id);
            return (
              <div key={id} className="chip">
                {renderAvatar(user)}
                {user?.name}
                <div onClick={() => removeUser(id)} className="chip-remove">✕</div>
              </div>
            );
          })}
        </div>

        <button className="btn-main" onClick={handleUpload}>Post Memory 🚀</button>
      </div>

      <div className="memory-feed">
        {memories.map(mem => (
          <div key={mem._id} className="memory-card">
            <div style={{ position: "relative" }}>
              <img
                src={`https://gk-memory-backend.onrender.com/uploads/${mem.image}`}
                alt="memory"
                className="memory-img"
              />
              <button 
                onClick={() => handleDownload(`https://gk-memory-backend.onrender.com/uploads/${mem.image}`, mem.image)}
                className="btn-download"
                title="Download Image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </button>
            </div>
            <div className="memory-footer" style={{flexDirection: "column", alignItems: "flex-start", gap: "12px"}}>
              <div style={{display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start"}}>
                <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
                  {renderAvatar(mem.userId)}
                  <div>
                    <span className="memory-caption">{mem.caption || "No caption"}</span>
                    <p style={{fontSize: "12px", color: "#888", marginTop: "4px", marginBottom: 0}}>
                      Posted by <span style={{fontWeight: "600", color: "#35858E"}}>{mem.userId?.name || "Unknown"}</span>
                    </p>
                  </div>
                </div>
                {mem.userId?._id === userId && (
                  <button className="btn-logout" style={{padding: "6px 10px", borderRadius: "6px"}} onClick={() => handleDelete(mem._id)}>🗑️</button>
                )}
              </div>
              
              {/* Meta details */}
              <div style={{fontSize: "13px", color: "#666", display: "flex", flexWrap: "wrap", gap: "8px", marginLeft: "48px"}}>
                 {mem.group && (
                   <span style={{background: "#e8f0eb", padding: "4px 8px", borderRadius: "12px", color: "#2b453a", fontWeight: "600"}}>
                     📦 {groups.find(g => g._id === mem.group)?.groupName || "Group Memory"}
                   </span>
                 )}
                 {mem.taggedUsers && mem.taggedUsers.length > 0 && (
                   <span style={{background: "#f0f0f0", padding: "4px 8px", borderRadius: "12px"}}>
                     👥 with {mem.taggedUsers.map(t => t.name).join(", ")}
                   </span>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ================= RENDER DRIVERS =================

  if (page !== "app") {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <h2>{page === "login" ? "Welcome Back" : "Create Account"}</h2>
          {page === "register" && (
            <input placeholder="Full Name" onChange={e => setName(e.target.value)} className="input-field" />
          )}
          <input placeholder="Email (@gmail.com)" onChange={e => setEmail(e.target.value)} className="input-field" />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="input-field" />
          <button className="btn-main" onClick={page === "login" ? handleLogin : handleRegister}>
            {page === "login" ? "Login" : "Register"}
          </button>
          <p className="link-text" onClick={() => setPage(page === "login" ? "register" : "login")}>
            {page === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  const navigate = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div className="app-header" style={{position: "relative"}}>
          <h2>📸 GK Memory</h2>
          <button className="btn-menu" onClick={() => setMenuOpen(!menuOpen)}>
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2b453a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          {menuOpen && (
            <div className="menu-dropdown">
               <div className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => navigate("home")}>🏠 Home</div>
               <div className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigate("profile")}>👤 Profile</div>
               <div className={`menu-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => navigate("friends")}>👥 Friends</div>
               <div className={`menu-item ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => navigate("groups")}>📦 Groups</div>
               <div className={`menu-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => navigate("about")}>ℹ️ About</div>
               <div className="menu-item logout" onClick={() => { handleLogout(); setMenuOpen(false); }}>🚪 Logout</div>
            </div>
          )}
        </div>

        {activeTab === "home" && renderHome()}
        {activeTab === "profile" && renderProfile()}
        {activeTab === "friends" && renderFriendsTab()}
        {activeTab === "groups" && renderGroupsTab()}
        {activeTab === "about" && renderAbout()}

      </div>
    </div>
  );
}

export default App;