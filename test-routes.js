const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://127.0.0.1:5000/api';
const TEST_USER = {
    email: 'test@example.com',
    password: 'test123'
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: '1h' });
};

// Test user authentication
const testAuth = async () => {
    try {
        // Login
        const loginRes = await axios.post(`${API_URL}/users/login`, TEST_USER);
        console.log('✅ Login successful:', loginRes.data);
        return loginRes.data.token;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return null;
    }
};

// Test game categories
const testGameCategories = async (token) => {
    try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Get all categories
        const categoriesRes = await axios.get(`${API_URL}/game-categories`, { headers });
        console.log('✅ Get categories successful:', categoriesRes.data);
        
        if (categoriesRes.data.categories.length > 0) {
            const categoryId = categoriesRes.data.categories[0].id;
            
            // Get category by ID
            const categoryRes = await axios.get(`${API_URL}/game-categories/${categoryId}`, { headers });
            console.log('✅ Get category by ID successful:', categoryRes.data);
            
            // Get games in category
            const gamesRes = await axios.get(`${API_URL}/game-categories/${categoryId}/games`, { headers });
            console.log('✅ Get category games successful:', gamesRes.data);
            
            // Get category stats
            const statsRes = await axios.get(`${API_URL}/game-categories/${categoryId}/stats`, { headers });
            console.log('✅ Get category stats successful:', statsRes.data);
        }
    } catch (error) {
        console.error('❌ Game categories test failed:', error.response?.data || error.message);
    }
};

// Test winning tickets
const testWinningTickets = async (token) => {
    try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Get winning tickets
        const ticketsRes = await axios.get(`${API_URL}/winning-tickets/my-winnings`, { headers });
        console.log('✅ Get winning tickets successful:', ticketsRes.data);
        
        // Get winning summary
        const summaryRes = await axios.get(`${API_URL}/winning-tickets/summary`, { headers });
        console.log('✅ Get winning summary successful:', summaryRes.data);
        
        if (ticketsRes.data.winningTickets.length > 0) {
            const ticketId = ticketsRes.data.winningTickets[0].id;
            
            // Get specific winning ticket
            const ticketRes = await axios.get(`${API_URL}/winning-tickets/${ticketId}`, { headers });
            console.log('✅ Get specific winning ticket successful:', ticketRes.data);
        }
    } catch (error) {
        console.error('❌ Winning tickets test failed:', error.response?.data || error.message);
    }
};

// Test transfer recipients
const testTransferRecipients = async (token) => {
    try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Get recipients
        const recipientsRes = await axios.get(`${API_URL}/transfer-recipients`, { headers });
        console.log('✅ Get recipients successful:', recipientsRes.data);
        
        // Add new recipient
        const newRecipient = {
            bank_code: '057',
            account_number: '1234567890',
            account_name: 'Test Account'
        };
        
        const addRes = await axios.post(`${API_URL}/transfer-recipients`, newRecipient, { headers });
        console.log('✅ Add recipient successful:', addRes.data);
        
        if (addRes.data.recipientId) {
            // Get specific recipient
            const recipientRes = await axios.get(`${API_URL}/transfer-recipients/${addRes.data.recipientId}`, { headers });
            console.log('✅ Get specific recipient successful:', recipientRes.data);
            
            // Delete recipient
            const deleteRes = await axios.delete(`${API_URL}/transfer-recipients/${addRes.data.recipientId}`, { headers });
            console.log('✅ Delete recipient successful:', deleteRes.data);
        }
    } catch (error) {
        console.error('❌ Transfer recipients test failed:', error.response?.data || error.message);
    }
};

// Run all tests
const runTests = async () => {
    console.log('🚀 Starting API tests...\n');
    
    // Test authentication
    const token = await testAuth();
    if (!token) {
        console.error('❌ Authentication failed. Stopping tests.');
        return;
    }
    
    console.log('\n📦 Testing Game Categories...');
    await testGameCategories(token);
    
    console.log('\n🎫 Testing Winning Tickets...');
    await testWinningTickets(token);
    
    console.log('\n💸 Testing Transfer Recipients...');
    await testTransferRecipients(token);
    
    console.log('\n✨ All tests completed!');
};

// Run the tests
runTests().catch(console.error); 