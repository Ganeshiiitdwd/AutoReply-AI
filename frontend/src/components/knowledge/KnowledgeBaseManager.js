import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KnowledgeBaseManager = () => {
    const [items, setItems] = useState([]);
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/knowledge', config);
                setItems(res.data);
            } catch (err) {
                setError('Could not fetch knowledge base.');
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/knowledge', { topic, content }, config);
            setItems([res.data, ...items]);
            setTopic('');
            setContent('');
        } catch (err) {
            setError('Failed to add item.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/knowledge/${id}`, config);
            setItems(items.filter(item => item._id !== id));
        } catch (err) {
            setError('Failed to delete item.');
        }
    };

    return (
        <div className="max-w-4xl p-8 mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Knowledge Base</h2>
            
            <div className="p-6 bg-white rounded-lg shadow-md mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Information</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Topic / Question</label>
                        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., My standard meeting availability" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Content / Answer</label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g., I am generally available for meetings on Tuesdays and Thursdays from 2 PM to 5 PM." className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" rows="3" required></textarea>
                    </div>
                    <button type="submit" className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save to Knowledge Base</button>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Your Saved Information</h3>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {items.map(item => (
                    <div key={item._id} className="p-4 bg-white rounded-lg shadow-md flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-gray-800">{item.topic}</p>
                            <p className="text-gray-600 mt-1">{item.content}</p>
                        </div>
                        <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 font-semibold">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KnowledgeBaseManager;
