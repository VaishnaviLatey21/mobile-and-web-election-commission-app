import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";

const Login = ({ closeModal, switchToRegister }) => {
  const navigate = useNavigate();
  
  // View State: 'login' or 'forgot'
  const [view, setView] = useState("login"); 

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Forgot Password State
  const [resetForm, setResetForm] = useState({
    email: "", scc: "", dob: "", newPassword: ""
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // REMEMBER ME FEATURE
    useEffect(() => {
      const savedEmail = localStorage.getItem("lastUsedEmail");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }, []);

  // LOGIN LOGIC
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });

      // Store the valid email in localStorage for next time
      localStorage.setItem("lastUsedEmail", email);
      
      // Store auth data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      if (closeModal) closeModal(); 

      // Redirect based on Role
      if (res.data.user.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      // This will capture "Invalid username" or "Invalid password" from backend
      setError(err.response?.data?.message || "Login failed");
    }
  };

  // FORGOT PASSWORD LOGIC
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.post("/auth/forgot-password", resetForm);
      setSuccessMsg(res.data.message);
      
      // Clear form after success
      setTimeout(() => {
        setView("login");
        setSuccessMsg("");
        setResetForm({ email: "", scc: "", dob: "", newPassword: "" });
      }, 3000);

    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed";
      
      // SPECIAL HANDLING FOR ADMIN WARNING
      if (err.response?.status === 403) {
        alert(" SECURITY WARNING \n\n" + msg);
      }
      
      setError(msg);
    }
  };

  // RENDER LOGIN VIEW 
  if (view === "login") {
    return (
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Login</h2>
        
        {/* Error Message Display Area */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f870d] text-gray-900 bg-white"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f870d] text-gray-900 bg-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0f870d] text-white font-bold rounded-md hover:bg-green-800 transition duration-200 shadow-md"
          >
            LOGIN
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={() => { setError(""); setView("forgot"); }}
            className="text-gray-200 hover:text-white text-sm hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <p className="text-center mt-4 text-white text-sm">
          Don't have an account?{" "}
          <button 
            onClick={switchToRegister} 
            className="text-[#0f870d] font-bold bg-white px-2 py-0.5 rounded hover:bg-gray-100 hover:underline ml-1 transition"
          >
            Register
          </button>
        </p>
      </div>
    );
  }

  // RENDER FORGOT PASSWORD VIEW
  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4">
        <button onClick={() => setView("login")} className="text-white hover:text-gray-200 mr-2">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
      </div>

      <p className="text-gray-200 text-sm mb-4">
        Verify your identity to reset your password.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-3 py-2 rounded mb-4 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded mb-4 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{successMsg} Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleForgotSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Registered Email"
          value={resetForm.email}
          onChange={(e) => setResetForm({...resetForm, email: e.target.value})}
          className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f870d] text-gray-900 bg-white"
          required
        />
        <input
          type="text"
          placeholder="SCC Code (Identity Check)"
          value={resetForm.scc}
          onChange={(e) => setResetForm({...resetForm, scc: e.target.value})}
          className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f870d] text-gray-900 bg-white"
          required
        />
        <div className="relative">
             <span className="text-xs text-gray-300 absolute -top-5 left-1">Date of Birth</span>
            <input
            type="date"
            placeholder="Date of Birth"
            value={resetForm.dob}
            onChange={(e) => setResetForm({...resetForm, dob: e.target.value})}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f870d] text-gray-900 bg-white"
            required
            />
        </div>
       
        <input
          type="password"
          placeholder="Enter New Password"
          value={resetForm.newPassword}
          onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})}
          className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f870d] text-gray-900 bg-white"
          required
        />

        <button
          type="submit"
          className="w-full py-3 bg-green-700 text-white font-bold rounded-md hover:bg-green-800 transition duration-200 shadow-md mt-2"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default Login;