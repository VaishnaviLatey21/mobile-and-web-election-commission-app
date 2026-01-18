import { useState, useEffect } from "react";
import api from "../services/api";
import Login from "./Login";
import Register from "./Register";
import { Activity, X, Vote, Loader } from "lucide-react"; 

const LandingPage = () => {
  const [modalType, setModalType] = useState(null); 
  const [activeReferendums, setActiveReferendums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Live Data on Mount
  useEffect(() => {
    const fetchLiveFeed = async () => {
      try {
        const res = await api.get("/referendums");
        // Filter only OPEN referendums for the public feed
        const openRefs = res.data.filter(ref => ref.status === "Open");
        setActiveReferendums(openRefs);
      } catch (err) {
        console.error("Failed to fetch live feed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveFeed();
  }, []);

  const closeModal = () => setModalType(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* HERO SECTION */}
      <div className="bg-white shadow-sm pt-16 pb-12 px-4 flex flex-col items-center justify-center text-center">
        {/* App Logo */}
        <div className="w-24 h-24 bg-[#0f870d] rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-slow">
           <Vote size={48} color="white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3 tracking-tight">
          My Shangri-La Referendum
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          Participate in the future of our valley. Your voice matters.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <button
            onClick={() => setModalType("login")}
            className="px-8 py-3 bg-[#0f870d] text-white font-bold rounded-lg shadow-md hover:bg-green-800 transition transform hover:-translate-y-1 w-full sm:w-auto"
          >
            Login
          </button>
          <button
            onClick={() => setModalType("register")}
            className="px-8 py-3 bg-white text-[#0f870d] border-2 border-[#0f870d] font-bold rounded-lg shadow-sm hover:bg-green-50 transition transform hover:-translate-y-1 w-full sm:w-auto"
          >
            Register
          </button>
        </div>
      </div>

      {/* LIVE FEED SECTION */}
      <div className="flex-1 w-full max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6 border-b pb-2 border-gray-200">
          <Activity className="text-red-500 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-700">Live Ongoing Referendums</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-10 text-gray-400">
            <Loader className="animate-spin" size={32} />
          </div>
        ) : activeReferendums.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
            No active referendums at the moment.
          </div>
        ) : (
          <div className="grid gap-4">
            {activeReferendums.map((ref) => (
              <div key={ref._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center group">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#0f870d] transition">
                    {ref.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-1">{ref.description}</p>
                </div>
                
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold whitespace-nowrap">
                    Live / Open
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <strong>Note:</strong> Detailed voting breakdown and casting votes are only available to registered citizens.
        </div>
      </div>

      {/* MODAL POPUP */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          
          <div className="relative w-full max-w-md bg-[#949393] p-8 rounded-xl shadow-2xl animate-fade-in-up">
            
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition"
            >
              <X size={24} />
            </button>

            {modalType === "login" ? (
              <Login 
                closeModal={closeModal} 
                switchToRegister={() => setModalType("register")} 
              />
            ) : (
              <Register 
                closeModal={closeModal} 
                switchToLogin={() => setModalType("login")} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;