import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailList = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({}); // Store drafts by email ID
  const [draftLoading, setDraftLoading] = useState(null);
  const handleFetchEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
        },
      };
      // This endpoint now triggers the summarization process
      const res = await axios.get('http://localhost:5000/api/emails', config);
      setEmails(res.data);
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'An error occurred while fetching emails.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async (emailId) => {
        setDraftLoading(emailId);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            const res = await axios.post(`http://localhost:5000/api/emails/${emailId}/draft-reply`, {}, config);
            setDrafts(prev => ({ ...prev, [emailId]: res.data.draft }));
        } catch (err) {
            setError(`Could not generate draft for email ${emailId}.`);
        } finally {
            setDraftLoading(null);
        }
    };
  
  // Optional: Fetch emails automatically on component load
  // useEffect(() => {
  //   handleFetchEmails();
  // }, []);

  return (
    <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">Inbox & Summaries</h3>
        <button
          onClick={handleFetchEmails}
          disabled={loading}
          className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Sync & Summarize Emails'}
        </button>
      </div>

      {error && (
        <div className="p-4 mt-4 text-red-800 bg-red-100 border-l-4 border-red-500 rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {emails.length > 0 ? (
          emails.map((email) => (
            <div key={email._id} className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-800 truncate">{email.from}</p>
              <p className="font-semibold text-gray-900">{email.subject}</p>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{email.snippet}</p>
              
              {/* Display the AI Summary */}
              <div className="p-3 mt-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-semibold text-yellow-800">AI Summary:</p>
                {/* Use pre-wrap to respect newlines from the AI's response */}
                <p className="mt-1 text-sm text-yellow-700 whitespace-pre-wrap">{email.summary}</p>
              </div>

              {/* --- Draft Reply Section --- */}
                        <div className="mt-4">
                            {drafts[email._id] ? (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm font-semibold text-blue-800">Suggested Reply:</p>
                                    <textarea
                                        className="w-full p-2 mt-2 text-sm text-blue-900 bg-white border border-blue-300 rounded-md"
                                        rows="5"
                                        defaultValue={drafts[email._id]}
                                    />
                                    <div className="flex space-x-2 mt-2">
                                        <button className="px-3 py-1 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Approve & Send</button>
                                        <button onClick={() => setDrafts(prev => ({ ...prev, [email._id]: null }))} className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Discard</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleGenerateReply(email._id)}
                                    disabled={draftLoading === email._id}
                                    className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {draftLoading === email._id ? 'Generating...' : 'Generate Reply'}
                                </button>
                            )}
                        </div>
            </div>
          ))
        ) : (
          !loading && <p className="text-gray-500">No emails to display. Click the button to sync and summarize.</p>
        )}
      </div>
    </div>
  );
};

export default EmailList;
