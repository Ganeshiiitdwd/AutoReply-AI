import React from 'react';

const ConnectGmail = () => {
  const handleConnect = () => {
    // Get the JWT token from local storage
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect the user to the backend OAuth route
      // The backend will handle the redirect to Google's consent screen
      window.location.href = `http://localhost:5000/api/auth/google?token=${token}`;
    } else {
      console.error('Authentication token not found.');
      // Handle case where user is not logged in
    }
  };

  return (
    <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700">Connect Your Email</h3>
      <p className="mt-2 text-gray-600">
        Integrate your Gmail account to enable AI-powered summarization and automated replies.
      </p>
      <div className="mt-4">
        <button
          onClick={handleConnect}
          className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {/* You can add a Google icon here */}
          <span className="ml-2">Connect Gmail Account</span>
        </button>
      </div>
    </div>
  );
};

export default ConnectGmail;