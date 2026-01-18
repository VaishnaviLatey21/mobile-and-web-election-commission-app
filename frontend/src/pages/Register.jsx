import { useState } from "react";
import axios from "axios";
import { Scanner } from "@yudiel/react-qr-scanner"; 
import { VALID_SCC_CODES } from "../utils/sccCodes";
import { Camera, X, AlertTriangle } from "lucide-react";

const Register = ({ closeModal, switchToLogin }) => {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    dob: "",
    scc: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [sccError, setSccError] = useState("");
  
  // State for server-side errors (Email taken, SCC used, etc.)
  const [serverError, setServerError] = useState("");

  const isFormValid =
    form.email &&
    form.fullName &&
    form.dob &&
    form.scc &&
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear server error when user starts typing again
    if (serverError) setServerError("");

    if (name === "scc") validateSCC(value);

    if (name === "password" || name === "confirmPassword") {
      setPasswordMatch(
        name === "password"
          ? value === form.confirmPassword
          : form.password === value
      );
    }
  };

  const validateSCC = (code) => {
    if (!VALID_SCC_CODES.includes(code)) {
      setSccError("Invalid Citizen Code (SCC). Code not found in records.");
      return false;
    }
    setSccError("");
    return true;
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedCode = detectedCodes[0].rawValue;
      setForm((prev) => ({ ...prev, scc: scannedCode }));
      
      const isValid = validateSCC(scannedCode);
      if (isValid) setShowScanner(false); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(""); 

    if (!passwordMatch) {
      setServerError("Passwords do not match!");
      return;
    }
    if (!validateSCC(form.scc)) {
      setServerError("Please enter a valid Citizen Code.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      alert("Registration successful! Please login.");
      switchToLogin();
    } catch (err) {
      console.error("Full registration error:", err);
      // Capture the specific error message from the backend
      const msg = err.response?.data?.message || "Registration failed";
      setServerError(msg);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <h2 className="text-center mb-5 text-2xl font-bold text-gray-800">
        Voter Registration
      </h2>

      {/* SERVER ERROR MESSAGE */}
      {serverError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-black rounded-lg border-2 border-[#0f870d] overflow-hidden p-1 shadow-2xl">
            <button 
              type="button"
              onClick={() => setShowScanner(false)}
              className="absolute top-2 right-2 z-10 bg-gray-800/80 text-white p-2 rounded-full hover:bg-red-600 transition"
            >
              <X size={24} />
            </button>

            <div className="w-full h-80 bg-black flex items-center justify-center overflow-hidden">
               <Scanner 
                  onScan={handleScan}
                  onError={(error) => console.log(error)}
                  components={{ audio: false, torch: true }}
                  styles={{ container: { width: "100%", height: "100%" } }}
               />
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-semibold bg-black/50 py-2 pointer-events-none">
              Point camera at Citizen Code QR
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowScanner(false)}
            className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {/* REGISTRATION FORM */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2.5 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#0f870d] bg-white text-black"
        />
        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full p-2.5 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#0f870d] bg-white text-black"
        />
        <input
          name="dob"
          type="date"
          value={form.dob}
          onChange={handleChange}
          className="w-full p-2.5 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#0f870d] bg-white text-black"
        />
        
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <input
              name="scc"
              placeholder="Citizen Code (SCC)"
              value={form.scc}
              onChange={handleChange}
              className={`w-full p-2.5 rounded border text-sm focus:outline-none bg-white text-black ${
                sccError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 focus:border-[#0f870d]"
              }`}
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="px-4 py-2.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
          >
            <Camera size={18} />
            <span className="text-sm font-semibold hover:underline">Scan QR</span>
          </button>
        </div>
        {/* Local Validation Error */}
        {sccError && <p className="text-red-700 text-xs font-semibold -mt-2">{sccError}</p>}

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2.5 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#0f870d] bg-white text-black"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full p-2.5 rounded border border-gray-300 text-sm focus:outline-none focus:border-[#0f870d] bg-white text-black"
        />

        {!passwordMatch && (
          <p className="text-red-700 text-xs font-bold text-center">
            Passwords do not match
          </p>
        )}

        <button
          type="submit"
          // Disable only if local form logic is invalid
          disabled={!isFormValid || !!sccError}
          className={`w-full p-2.5 text-white rounded font-bold transition shadow-md ${
            isFormValid && !sccError
              ? "bg-[#0f870d] hover:bg-green-800 cursor-pointer hover:underline"
              : "bg-[#a5d6a7] cursor-not-allowed"
          }`}
        >
          Register
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-800">
        Already registered?{" "}
        <button
          onClick={switchToLogin}
          className="text-[#0f870d] font-bold bg-white px-2 py-0.5 rounded hover:bg-gray-100 ml-1 transition hover:underline"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;