import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userName = user?.name || user?.email || 'Profile';

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="w-full bg-green-600 text-white flex justify-between items-center px-8 py-3 shadow-lg">
      
      {/* Left - Logo */}
      <div
        className="text-2xl font-extrabold cursor-pointer tracking-tight"
        onClick={() => navigate('/')}
      >
        MSLR
      </div>

      {/* Right - User Info */}
      {user ? (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white text-green-600 rounded-full flex items-center justify-center font-bold shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline font-medium text-sm">
              {userName}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-md"
          >
            Logout
          </button>
        </div>
      ) : (
        <button 
          onClick={() => navigate('/login')}
          className="bg-white text-green-600 px-4 py-2 rounded-lg font-bold"
        >
          Login
        </button>
      )}
    </nav>
  );
};

export default Navbar;