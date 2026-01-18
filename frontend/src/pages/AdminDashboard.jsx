import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
    LogOut, PlusCircle, Edit, BarChart as BarChartIcon,
    X, PieChart as PieChartIcon, TrendingUp, Users, Eye, BellRing,
    MessageSquare, CheckCircle, Bell
} from "lucide-react";

// Import Recharts for Data Visualization
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';


const AdminDashboard = () => {
    const navigate = useNavigate();
    
    // STATE MANAGEMENT
    
    // User & Data States
    const [user, setUser] = useState(null); 
    const [referendums, setReferendums] = useState([]); 
    const [supportQueries, setSupportQueries] = useState([]); 

    // Modal Visibility States
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false); 
    const [supportModalOpen, setSupportModalOpen] = useState(false); 
    const [isNotifOpen, setIsNotifOpen] = useState(false); 

    // Form & Editing States
    const [editingId, setEditingId] = useState(null); 
    const [form, setForm] = useState({ title: "", description: "", options: "" });
    
    // Analytics Data States
    const [selectedRefForAnalytics, setSelectedRefForAnalytics] = useState(null); 
    const [analyticsData, setAnalyticsData] = useState(null); 

    // Chart Colors Configuration
    const COLORS = ['#0f870d', '#0088FE', '#FFBB28', '#FF8042', '#8884d8'];

    // Initial Data Fetch on Component Mount
    useEffect(() => {
        fetchData();
    }, []);

 
    const fetchData = async () => {
        try {
            const [refRes, supportRes, meRes] = await Promise.all([
                api.get("/referendums"),
                api.get("/support"),
                api.get("/auth/me")
            ]);
            
            setReferendums(refRes.data);
            setSupportQueries(supportRes.data);
            setUser(meRes.data); 
        } catch (err) {
            console.error("Error fetching data", err);
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
            setUser({ ...user, notifications: [] });
            setIsNotifOpen(false);
        } catch (err) { console.error(err); }
    };


    const resolveQuery = async (id) => {
        try {
            await api.patch(`/support/${id}/resolve`);
            setSupportQueries(prev => prev.map(q => q._id === id ? { ...q, status: "Resolved" } : q));
        } catch (err) { alert("Failed to update status"); }
    };

    // REFERENDUM CRUD HANDLERS

    // Open Modal for Creating New Referendum
    const openCreateModal = () => {
        setEditingId(null);
        setForm({ title: "", description: "", options: "" });
        setIsModalOpen(true);
    };

    // Open Modal for Editing Existing Referendum
    const openEditModal = (ref) => {
        setEditingId(ref._id);
        // Convert options array back to comma-separated string for editing
        const optionsString = ref.options.map(opt => opt.text).join(", ");
        setForm({ title: ref.title, description: ref.description, options: optionsString });
        setIsModalOpen(true);
    };

    // Submit Create/Update Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Process options string into array, trimming whitespace
            const optionsArray = form.options.split(",").map(o => o.trim()).filter(o => o);
            
            if (editingId) {
                // Update Existing
                await api.put(`/referendums/${editingId}`, { ...form, options: optionsArray });
                alert("Referendum Updated");
            } else {
                // Create New
                await api.post("/referendums", { ...form, options: optionsArray });
                alert("Referendum Created");
            }
            setIsModalOpen(false);
            fetchData(); 
        } catch (err) {
            alert(err.response?.data?.message || "Error saving");
        }
    };


    const toggleStatus = async (id, currentStatus) => {
        if (currentStatus === "Closed") {
            alert("This referendum is permanently closed.");
            return;
        }
        const newStatus = currentStatus === "Open" ? "Closed" : "Open";
        
        if (!window.confirm(`Change status to ${newStatus}?`)) return;
        
        try {
            await api.patch(`/referendums/${id}/status`, { status: newStatus });
            fetchData();
        } catch (err) { 
            alert(err.response?.data?.message || "Error updating status"); 
        }
    };

    // Analytics Handlers


    const openAnalytics = async (ref) => {
        if (ref.status === "Created") {
            alert("Analytics available after voting opens.");
            return;
        }
        setSelectedRefForAnalytics(ref);
        setAnalyticsModalOpen(true);
        setAnalyticsData(null); 
        
        try {
            const res = await api.get(`/referendums/${ref._id}/analytics`);
            setAnalyticsData(res.data);
        } catch (err) { alert("Failed to load analytics"); }
    };


    const handleNotify = async () => {
        if (!selectedRefForAnalytics || selectedRefForAnalytics.status !== "Open") {
             alert("Can only notify for Open referendums");
             return;
        }
        if (!window.confirm("Send reminder to pending voters?")) return;
        
        try {
            const res = await api.post(`/referendums/${selectedRefForAnalytics._id}/notify`);
            alert(res.data.message);
        } catch (err) { alert("Failed to send"); }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans" onClick={() => setIsNotifOpen(false)}>
            
            <nav className="bg-[#0f870d] text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold">Election Commission Dashboard</h1>
                
                <div className="flex items-center gap-4">
                    
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 rounded-full hover:bg-white/10 relative">
                            <Bell size={24} />
                            {user?.notifications?.length > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#0f870d]">
                                    {user.notifications.length}
                                </span>
                            )}
                        </button>
                        
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
                                <div className="p-3 bg-gray-50 border-b flex justify-between items-center text-gray-800">
                                    <span className="font-bold text-sm">Notifications</span>
                                    {user?.notifications?.length > 0 && <button onClick={clearNotifications} className="text-xs text-blue-600">Dismiss All</button>}
                                </div>
                                <div className="max-h-64 overflow-y-auto text-gray-800">
                                    {(!user?.notifications || user.notifications.length === 0) ? <div className="p-4 text-center text-sm text-gray-400">No new notifications</div> : 
                                        user.notifications.slice().reverse().map((n, i) => (
                                            <div key={i} className="p-3 border-b hover:bg-gray-50 text-sm">
                                                <p>{n.message}</p>
                                                <span className="text-xs text-gray-400">{new Date(n.date).toLocaleString()}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleLogout} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded hover:bg-white/30 transition">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6">
                
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-[#0f870d] pl-3">Manage Referendums</h2>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setSupportModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded shadow hover:bg-blue-700 transition"
                        >
                            <MessageSquare size={20} /> Support Requests
                            {supportQueries.filter(q => q.status === "Pending").length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {supportQueries.filter(q => q.status === "Pending").length}
                                </span>
                            )}
                        </button>
                        
                        <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#0f870d] text-white px-5 py-2.5 rounded shadow hover:bg-green-800 transition">
                            <PlusCircle size={20} /> Create New
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {referendums.map((ref) => (
                        <div key={ref._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full hover:shadow-md transition">
                            
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-gray-800 leading-tight">{ref.title}</h3>
                                <div className={`ml-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                    ref.status === "Open" ? "bg-green-100 text-green-800" : 
                                    ref.status === "Closed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                                }`}>{ref.status.toUpperCase()}</div>
                            </div>
                            <p className="text-gray-500 mb-6 text-sm flex-grow">{ref.description}</p>
                            
                            <div className="bg-gray-50 p-4 rounded mb-6 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3"><BarChartIcon size={14}/> Live Results</h4>
                                <div className="space-y-3">
                                    {ref.options.slice(0, 2).map((opt) => {
                                        const total = ref.options.reduce((a,b)=>a+b.votes,0) || 1;
                                        const pct = Math.round((opt.votes/total)*100);
                                        return (
                                            <div key={opt._id}>
                                                <div className="flex justify-between text-xs mb-1 font-medium text-gray-700"><span>{opt.text}</span><span>{pct}%</span></div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-[#0f870d] h-1.5 rounded-full" style={{width: `${pct}%`}}></div></div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button disabled={ref.status === "Created"} onClick={() => openAnalytics(ref)} className={`w-full py-2 mt-4 font-bold rounded-md flex justify-center gap-2 text-sm shadow-sm transition ${ref.status === "Created" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"}`}>
                                    <PieChartIcon size={16} /> View Analytics
                                </button>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                                <button onClick={() => toggleStatus(ref._id, ref.status)} disabled={ref.status === "Closed"} className={`flex-1 py-2 rounded-md font-bold text-sm text-white transition shadow-sm ${ref.status === "Open" ? "bg-red-500 hover:bg-red-600" : ref.status === "Closed" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>{ref.status === "Open" ? "Close Voting" : ref.status === "Closed" ? "Permanently Closed" : "Open Voting"}</button>
                                <button disabled={ref.hasBeenOpened} onClick={() => openEditModal(ref)} className={`px-3 py-2 border rounded-md flex items-center justify-center gap-2 text-sm font-semibold transition ${ref.hasBeenOpened ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-gray-700 hover:bg-gray-50"}`} title={ref.hasBeenOpened ? "Locked" : "Edit"}><Edit size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {supportModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><MessageSquare /> Voter Support Queries</h3>
                            <button onClick={() => setSupportModalOpen(false)}><X className="text-gray-500 hover:text-red-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
                            {supportQueries.length === 0 ? <p className="text-center text-gray-500">No support queries found.</p> : 
                                <div className="space-y-4">
                                    {supportQueries.map((q) => (
                                        <div key={q._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-gray-800">{q.name} <span className="text-xs font-normal text-gray-500">({q.contactNumber})</span></p>
                                                    <p className="text-sm text-gray-600 mt-1">{q.message}</p>
                                                    <p className="text-xs text-gray-400 mt-2">{new Date(q.createdAt).toLocaleString()}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {q.status === "Pending" ? (
                                                        <button onClick={() => resolveQuery(q._id)} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold hover:bg-green-200 flex items-center gap-1">
                                                            Mark Resolved
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle size={12}/> Resolved</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )}

            {analyticsModalOpen && selectedRefForAnalytics && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b flex justify-between items-start bg-white sticky top-0 z-10">
                            <div><h3 className="text-2xl font-bold text-gray-800">{selectedRefForAnalytics.title}</h3></div>
                            <button onClick={() => setAnalyticsModalOpen(false)}><X className="text-gray-400 hover:text-red-500" size={28} /></button>
                        </div>
                        
                        <div className="p-8 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><BarChartIcon size={20} className="text-blue-500"/> Vote Distribution</h4>
                                <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={selectedRefForAnalytics.options}><XAxis dataKey="text" tick={{fontSize:12}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="votes" fill="#0f870d" barSize={50} /></BarChart></ResponsiveContainer></div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><PieChartIcon size={20} className="text-purple-500"/> Breakdown</h4>
                                <div className="h-64 flex justify-center">{selectedRefForAnalytics.options.reduce((a,b)=>a+b.votes,0)===0 ? <span className="text-gray-400">No votes</span> : <ResponsiveContainer><PieChart><Pie data={selectedRefForAnalytics.options} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="votes" label>{selectedRefForAnalytics.options.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>}</div>
                            </div>
                            
                            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-bold text-gray-700 flex items-center gap-2"><Users size={20} className="text-indigo-500"/> Voter Engagement</h4>
                                    <button onClick={handleNotify} disabled={selectedRefForAnalytics.status!=="Open"} className={`px-4 py-2 rounded flex items-center gap-2 font-bold text-white shadow ${selectedRefForAnalytics.status==="Open"?"bg-indigo-600 hover:bg-indigo-700":"bg-gray-400 cursor-not-allowed"}`}><BellRing size={16}/> Notify Pending</button>
                                </div>
                                {analyticsData ? (
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-red-50 p-4 rounded border-red-100"><p className="text-red-500 font-bold text-xs uppercase">Not Voted</p><p className="text-2xl font-extrabold text-red-700">{analyticsData.notVotedCount}</p></div>
                                        <div className="bg-orange-50 p-4 rounded border-orange-100"><p className="text-orange-500 font-bold text-xs uppercase">Viewed/Skipped</p><p className="text-2xl font-extrabold text-orange-700">{analyticsData.viewedButNotVotedCount}</p></div>
                                        <div className="bg-green-50 p-4 rounded border-green-100"><p className="text-green-600 font-bold text-xs uppercase">Turnout</p><p className="text-2xl font-extrabold text-green-700">{((analyticsData.totalVotesCast/(analyticsData.totalVoters||1))*100).toFixed(1)}%</p></div>
                                    </div>
                                ) : <div className="text-center py-4 text-gray-400">Loading...</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">{editingId ? "Edit" : "Create"} Referendum</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input className="w-full p-3 border rounded" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
                            <textarea className="w-full p-3 border rounded h-24" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} required />
                            <input className="w-full p-3 border rounded" placeholder="Options (comma separated)" value={form.options} onChange={e=>setForm({...form, options:e.target.value})} required />
                            <div className="flex justify-end gap-3 mt-8"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-5 py-2 text-gray-600">Cancel</button><button type="submit" className="px-6 py-2 bg-[#0f870d] text-white font-bold rounded shadow">{editingId?"Update":"Create"}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;