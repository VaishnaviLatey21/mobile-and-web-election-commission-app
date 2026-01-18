import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  LogOut, CheckCircle, X, Vote, AlertCircle, 
  Search, User, HelpCircle, ChevronDown, Lock, Bell, Clock 
} from "lucide-react";


const Dashboard = () => {
  const navigate = useNavigate();
  
  // STATE MANAGEMENT

  // Data States
  const [user, setUser] = useState(null); 
  const [referendums, setReferendums] = useState([]); 
  const [userVoteMap, setUserVoteMap] = useState({}); 
  const [loading, setLoading] = useState(true); 

  // UI Interaction States
  const [searchQuery, setSearchQuery] = useState(""); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [isNotifOpen, setIsNotifOpen] = useState(false); 
  const [activeModal, setActiveModal] = useState(null); 
  
  // Voting Modal States
  const [selectedReferendum, setSelectedReferendum] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Profile Management State
  const [passForm, setPassForm] = useState({ current: "", new: "", confirm: "" });

  // Initial Data Load
  useEffect(() => {
    // 1. Auth Check
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); 
      return;
    }
    
    // 2. Load cached user data for immediate UI rendering
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    // 3. Fetch fresh data from API
    fetchDashboardData();
  }, [navigate]);


  const fetchDashboardData = async () => {
    try {
      const [refRes, voteRes] = await Promise.all([
        api.get("/referendums"),
        api.get("/votes/my-history")
      ]);
      
      setReferendums(refRes.data);

      const voteMapping = {};
      voteRes.data.forEach(vote => {
        voteMapping[vote.referendumId] = vote.optionId;
      });
      setUserVoteMap(voteMapping);

      const meRes = await api.get("/auth/me");
      setUser(meRes.data); 
      localStorage.setItem("user", JSON.stringify(meRes.data)); 

    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };


  const clearNotifications = async () => {
    try {
      await api.post("/auth/clear-notifications");
      const updatedUser = { ...user, notifications: [] };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsNotifOpen(false);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  // VOTING LOGIC

  const openVoteModal = (ref) => {
    setSelectedReferendum(ref);
    setSelectedOption("");
    setVoteSuccess(false);
    setActiveModal("vote");
    
    // Analytics: Record that user viewed this ballot
    api.post(`/referendums/${ref._id}/view`).catch(err => console.log("Analytics error", err));
  };


  const handleConfirmVote = async () => {
    if (!selectedOption) return alert("Please select an option.");
    try {
      await api.post("/votes", { 
        referendumId: selectedReferendum._id, 
        optionId: selectedOption 
      });
      
      // Update local map so UI reflects vote instantly
      setUserVoteMap({ ...userVoteMap, [selectedReferendum._id]: selectedOption });
      
      // Show success animation then close
      setVoteSuccess(true);
      setTimeout(() => setActiveModal(null), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Voting failed.");
    }
  };

  // PROFILE LOGIC

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passForm.current || !passForm.new || !passForm.confirm) return alert("All fields are required.");
    if (passForm.new !== passForm.confirm) return alert("New passwords do not match.");
    
    try {
      await api.post("/auth/change-password", {
        currentPassword: passForm.current,
        newPassword: passForm.new
      });
      alert("Password changed successfully! Please login again.");
      handleLogout();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password.");
    }
  };

  // SEARCH FILTERING
  // Filters referendums by Title, ID, Status, or Option text
  const filteredReferendums = referendums.filter(ref => {
    const query = searchQuery.toLowerCase();
    const matchTitle = ref.title.toLowerCase().includes(query);
    const matchDesc = ref.description?.toLowerCase().includes(query);
    const matchId = ref._id.toLowerCase().includes(query);
    const matchStatus = ref.status.toLowerCase().includes(query);
    const matchOptions = ref.options.some(opt => opt.text.toLowerCase().includes(query));
    
    return matchTitle || matchDesc || matchId || matchStatus || matchOptions;
  });

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    // Close dropdowns when clicking outside
    <div className="min-h-screen bg-gray-50 font-sans" onClick={() => { setIsDropdownOpen(false); setIsNotifOpen(false); }}>
      
      {/* NAVBAR */}
      <nav className="bg-[#0f870d] shadow-md sticky top-0 z-20 px-4 md:px-8 py-3 flex flex-wrap justify-between items-center text-white gap-4">
        <div className="flex items-center gap-2 min-w-fit">
          <div className="bg-white/20 p-2 rounded-full"><Vote size={20} className="text-white" /></div>
          <span className="font-bold text-xl tracking-wide hidden sm:block">Voter Dashboard</span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative mx-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Title, ID, Status, Options..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3">
            
            {/* NOTIFICATION BELL */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-full hover:bg-white/10 transition relative"
                >
                    <Bell size={24} />
                    {user?.notifications?.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#0f870d]">
                            {user.notifications.length}
                        </span>
                    )}
                </button>

                {/* Notification Dropdown List */}
                {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-700">Notifications</h4>
                            {user?.notifications?.length > 0 && (
                                <button onClick={clearNotifications} className="text-xs text-blue-600 hover:underline">Dismiss All</button>
                            )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {(!user?.notifications || user.notifications.length === 0) ? (
                                <div className="p-6 text-center text-gray-400 text-sm">No new notifications</div>
                            ) : (
                                user.notifications.slice().reverse().map((notif, idx) => (
                                    <div key={idx} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition">
                                        <p className="text-sm text-gray-800">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.date).toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* USER PROFILE DROPDOWN */}
            <div className="relative min-w-fit" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-tight">{user?.fullName}</p>
                        <p className="text-xs opacity-80">SCC: {user?.scc}</p>
                    </div>
                    <User className="bg-white/20 p-1 rounded-full w-8 h-8" />
                    <ChevronDown size={16} className={`transition ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 text-gray-800 border border-gray-100 animate-fade-in z-50">
                        <button onClick={() => { setActiveModal("profile"); setIsDropdownOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"><User size={16} /> View Profile</button>
                        <button onClick={() => { setActiveModal("help"); setIsDropdownOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"><HelpCircle size={16} /> Help / Support</button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button onClick={handleLogout} className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"><LogOut size={16} /> Logout</button>
                    </div>
                )}
            </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 border-l-4 border-[#0f870d] pl-4">Available Referendums</h1>
        </div>

        {/* Empty State Check */}
        {filteredReferendums.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 text-gray-500">
            {searchQuery ? "No results found for your search." : "No active referendums found."}
          </div>
        ) : (
          /* Referendum Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReferendums.map((ref) => {
              // Voting Logic & Status Check
              const votedOptionId = userVoteMap[ref._id];
              const hasVoted = !!votedOptionId;
              const votedOptionText = hasVoted ? ref.options.find(opt => opt._id === votedOptionId)?.text : "None";
              
              const isClosed = ref.status === "Closed";
              const isOpen = ref.status === "Open";

              return (
                <div key={ref._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col h-full">
                  
                  {/* Status Badges */}
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 font-mono">ID: {ref._id.slice(-6)}</span>
                    {hasVoted ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle size={10} /> VOTED</span>
                    ) : isClosed ? (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">CLOSED</span>
                    ) : isOpen ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1"><AlertCircle size={10} /> OPEN</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full flex items-center gap-1"><Clock size={10} /> PENDING</span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug">{ref.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-3">{ref.description}</p>
                    <div className="mt-4 pt-3 border-t border-dashed border-gray-200 text-sm">
                      <span className="text-gray-500">Your Vote: </span>
                      <span className={`font-bold ${hasVoted ? 'text-[#0f870d]' : 'text-gray-400'}`}>{hasVoted ? votedOptionText : "None"}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                    <button
                      onClick={() => openVoteModal(ref)}
                      disabled={hasVoted || !isOpen} // Disable if already voted OR if voting not open
                      className={`w-full py-2.5 rounded-lg font-bold text-sm transition shadow-sm flex justify-center items-center gap-2 ${
                        hasVoted 
                          ? "bg-green-600 text-white cursor-default" 
                          : !isOpen 
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed" // Grey for Closed/Pending
                          : "bg-[#0f870d] text-white hover:bg-green-800 active:scale-95" // Active Green
                      }`}
                    >
                      {/* Dynamic Button Text */}
                      {hasVoted 
                        ? "Vote Recorded" 
                        : isClosed 
                          ? "Voting Closed" 
                          : !isOpen 
                            ? "Not Open for Voting" 
                            : "Cast Vote"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL SYSTEM */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X size={24} /></button>

            {/* 1. VOTE MODAL */}
            {activeModal === "vote" && selectedReferendum && (
              <>
                <div className="bg-[#0f870d] p-4 text-white"><h3 className="font-bold text-lg">Cast Your Vote</h3></div>
                <div className="p-6">
                  {voteSuccess ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h4>
                      <p className="text-gray-600">Your vote has been securely recorded.</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{selectedReferendum.title}</h4>
                      <div className="space-y-3 mb-6 mt-4">
                        {selectedReferendum.options.map((opt) => (
                          <label key={opt._id} className={`flex items-center p-4 rounded-xl border cursor-pointer transition ${selectedOption === opt._id ? "border-[#0f870d] bg-green-50 ring-1 ring-[#0f870d]" : "border-gray-200 hover:bg-gray-50"}`}>
                            <input type="radio" name="vote_option" value={opt._id} checked={selectedOption === opt._id} onChange={() => setSelectedOption(opt._id)} className="w-5 h-5 accent-[#0f870d]" />
                            <span className="ml-3 text-gray-700 font-medium">{opt.text}</span>
                          </label>
                        ))}
                      </div>
                      <button onClick={handleConfirmVote} disabled={!selectedOption} className="w-full py-3 bg-[#0f870d] text-white font-bold rounded-lg hover:bg-green-800 disabled:opacity-50">Confirm Vote</button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* 2. PROFILE MODAL */}
            {activeModal === "profile" && user && (
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><User className="text-[#0f870d]" /> My Profile</h3>
                <div className="space-y-3 mb-8">
                  <div className="bg-gray-50 p-3 rounded border"><span className="text-xs text-gray-500 block uppercase">Full Name</span><span className="font-semibold text-gray-800">{user.fullName}</span></div>
                  <div className="bg-gray-50 p-3 rounded border"><span className="text-xs text-gray-500 block uppercase">Email</span><span className="font-semibold text-gray-800">{user.email}</span></div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 p-3 rounded border flex-1"><span className="text-xs text-gray-500 block uppercase">SCC Code</span><span className="font-mono text-gray-800">{user.scc}</span></div>
                    <div className="bg-gray-50 p-3 rounded border flex-1"><span className="text-xs text-gray-500 block uppercase">DOB</span><span className="font-semibold text-gray-800">{new Date(user.dob).toLocaleDateString()}</span></div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Lock size={16} /> Change Password</h4>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <input type="password" placeholder="Current Password" value={passForm.current} onChange={e=>setPassForm({...passForm, current: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    <input type="password" placeholder="New Password" value={passForm.new} onChange={e=>setPassForm({...passForm, new: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    <input type="password" placeholder="Confirm New Password" value={passForm.confirm} onChange={e=>setPassForm({...passForm, confirm: e.target.value})} className="w-full p-2 border rounded text-sm" />
                    <button type="submit" className="w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm font-bold">Update Password</button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. HELP & SUPPORT MODAL */}
            {activeModal === "help" && (
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><HelpCircle className="text-[#0f870d]" /> Help & Support</h3>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 text-center">
                  <p className="text-blue-800 font-bold mb-1">Need urgent help?</p>
                  <p className="text-sm text-blue-600">Contact us directly:</p>
                  <p className="text-lg font-mono font-bold text-blue-900 mt-1">+44 1234 567 890</p>
                  <p className="text-sm text-blue-800">support@referendum.gov.sr</p>
                </div>
                
                {/* Contact Form Submission */}
                <form onSubmit={async (e) => { 
                    e.preventDefault(); 
                    const formData = {
                        name: e.target.name.value,
                        contactNumber: e.target.contact.value,
                        message: e.target.message.value
                    };
                    try {
                        await api.post("/support", formData);
                        alert("Message sent! The Election Commission has been notified.");
                        setActiveModal(null);
                    } catch(err) {
                        alert("Failed to send message.");
                    }
                }} className="space-y-4">
                  <input name="name" className="w-full p-3 border border-gray-300 rounded focus:ring-[#0f870d]" placeholder="Your Name" required />
                  <input name="contact" className="w-full p-3 border border-gray-300 rounded focus:ring-[#0f870d]" placeholder="Contact Number" required />
                  <textarea name="message" className="w-full p-3 border border-gray-300 rounded h-24 resize-none focus:ring-[#0f870d]" placeholder="How can we help?" required></textarea>
                  <button type="submit" className="w-full py-3 bg-[#0f870d] text-white font-bold rounded-lg hover:bg-green-800 shadow-md">Send Message</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;