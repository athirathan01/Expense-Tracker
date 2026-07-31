try {
  require('dotenv').config();
} catch (e) {
  // Environment variables are provided by Catalyst in production
}
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Explicit CORS Headers Middleware for Catalyst Advanced I/O
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.text({ type: '*/*' }));

// Universal body parser middleware for JSON or string payload
app.use((req, res, next) => {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) {}
    }
    next();
});

// Token cache variables to prevent spamming Zoho and hitting rate limits
let cachedToken = null;
let tokenExpiryTime = null;

// Utility function to get valid access token
async function getValidAccessToken() {
    if (cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 300000) {
        console.log("Using cached Zoho access token");
        return cachedToken;
    }

    const accountsUrl = "https://accounts.zoho.in";
    const url = `${accountsUrl}/oauth/v2/token`;
    
    const params = new URLSearchParams();
    params.append('refresh_token', process.env.REFRESH_TOKEN);
    params.append('client_id', process.env.CLIENT_ID);
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');

    try {
        const response = await axios.post(url, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data.access_token) {
            console.log("Token successfully refreshed!");
            cachedToken = response.data.access_token;
            
            const expiresIn = response.data.expires_in || 3600;
            tokenExpiryTime = Date.now() + (expiresIn * 1000);
            
            return cachedToken;
        } else {
            throw new Error("Could not refresh token: " + JSON.stringify(response.data));
        }
    } catch (error) {
        console.error("Error fetching access token:", error.response ? error.response.data : error.message);
        throw error;
    }
}

// Express Router
const router = express.Router();

// Options preflight fallback
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.sendStatus(200);
});

// Fetch Expense Categories from Zoho CRM
router.get('/expense-categories', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const response = await axios.get(`${process.env.API_DOMAIN}/crm/v3/Expense_Categories?fields=Name`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });
        
        if (!response.data || !response.data.data) {
            console.error("Zoho API response missing data:", response.data);
            return res.json({ success: true, data: [] });
        }

        const categories = response.data.data.map(cat => ({
            id: cat.id,
            name: cat.Name
        }));

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Fetch Expenses from Zoho CRM
router.get('/expenses', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const response = await axios.get(`${process.env.API_DOMAIN}/crm/v3/Expenses?fields=Name,Expense_Type,Amount,Expense_Date,Payment_Method,Note`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        if (!response.data || !response.data.data) {
            return res.json({ success: true, data: [] });
        }

        res.json({ success: true, data: response.data.data });
    } catch (error) {
        console.error("Error fetching expenses:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Push Expense to Zoho CRM
router.post('/expenses', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const { typeId, typeName, amount, date, paymentMethod, note } = req.body;

        const payload = {
            data: [
                {
                    "Name": `${typeName} - ${amount}`,
                    "Expense_Type": { "id": typeId },
                    "Amount": amount,
                    "Expense_Date": date,
                    "Payment_Method": paymentMethod,
                    "Note": note
                }
            ]
        };

        const response = await axios.post(`${process.env.API_DOMAIN}/crm/v3/Expenses`, payload, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error creating expense:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Update Expense in Zoho CRM
router.put('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = await getValidAccessToken();
        const { typeId, typeName, amount, date, paymentMethod, note } = req.body;

        const payload = {
            data: [
                {
                    "Name": `${typeName} - ${amount}`,
                    "Expense_Type": { "id": typeId },
                    "Amount": amount,
                    "Expense_Date": date,
                    "Payment_Method": paymentMethod,
                    "Note": note
                }
            ]
        };

        const response = await axios.put(`${process.env.API_DOMAIN}/crm/v3/Expenses/${id}`, payload, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error updating expense:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Delete Expense from Zoho CRM
router.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = await getValidAccessToken();

        const response = await axios.delete(`${process.env.API_DOMAIN}/crm/v3/Expenses/${id}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error deleting expense:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Fetch Income Categories from Zoho CRM
router.get('/income-categories', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const response = await axios.get(`${process.env.API_DOMAIN}/crm/v3/Income_Categories?fields=Name`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        if (!response.data || !response.data.data) {
            return res.json({ success: true, data: [] });
        }

        const categories = response.data.data.map(cat => ({
            id: cat.id,
            name: cat.Name
        }));

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching income categories:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Fetch Incomes from Zoho CRM
router.get('/incomes', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const response = await axios.get(`${process.env.API_DOMAIN}/crm/v3/Income?fields=Name,Income_Type,Amount,Income_Date,Payment_Mode,Note`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        if (!response.data || !response.data.data) {
            return res.json({ success: true, data: [] });
        }

        res.json({ success: true, data: response.data.data });
    } catch (error) {
        console.error("Error fetching incomes:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Push Income to Zoho CRM
router.post('/incomes', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const { typeId, typeName, amount, date, receivedTo, note } = req.body;

        const payload = {
            data: [
                {
                    "Name": `${typeName} - ${amount}`,
                    "Income_Type": { "id": typeId },
                    "Amount": amount,
                    "Income_Date": date,
                    "Payment_Mode": receivedTo,
                    "Note": note
                }
            ]
        };

        const response = await axios.post(`${process.env.API_DOMAIN}/crm/v3/Income`, payload, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error creating income:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Update Income in Zoho CRM
router.put('/incomes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = await getValidAccessToken();
        const { typeId, typeName, amount, date, receivedTo, note } = req.body;

        const payload = {
            data: [
                {
                    "Name": `${typeName} - ${amount}`,
                    "Income_Type": { "id": typeId },
                    "Amount": amount,
                    "Income_Date": date,
                    "Payment_Mode": receivedTo,
                    "Note": note
                }
            ]
        };

        const response = await axios.put(`${process.env.API_DOMAIN}/crm/v3/Income/${id}`, payload, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error updating income:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Delete Income from Zoho CRM
router.delete('/incomes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = await getValidAccessToken();

        const response = await axios.delete(`${process.env.API_DOMAIN}/crm/v3/Income/${id}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error deleting income:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? JSON.stringify(error.response.data) : error.message });
    }
});

// Fetch Current User from Zoho CRM
// Proxy endpoint to stream user profile photo directly from Zoho CRM
router.get('/user-photo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = await getValidAccessToken();
        const response = await axios.get(`${process.env.API_DOMAIN}/crm/v3/users/${id}/photo`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            },
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'] || 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(response.data));
    } catch (error) {
        console.error("Could not fetch user photo from Zoho CRM photo endpoint:", error.message);
        res.status(404).send('Photo not found');
    }
});

// Fetch Current User from Zoho CRM
router.get('/current-user', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        let owner = null;
        let crmPhotoUrl = null;

        try {
            const expResponse = await axios.get(`${process.env.API_DOMAIN}/crm/v3/Expenses?fields=Owner&per_page=1`, {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`
                }
            });
            if (expResponse.data && expResponse.data.data && expResponse.data.data.length > 0) {
                owner = expResponse.data.data[0].Owner;
            }
        } catch (e) {
            console.log("Could not fetch owner from Expenses:", e.message);
        }

        if (!owner) {
            try {
                const incResponse = await axios.get(`${process.env.API_DOMAIN}/crm/v3/Income?fields=Owner&per_page=1`, {
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${token}`
                    }
                });
                if (incResponse.data && incResponse.data.data && incResponse.data.data.length > 0) {
                    owner = incResponse.data.data[0].Owner;
                }
            } catch (e) {
                console.log("Could not fetch owner from Income:", e.message);
            }
        }

        if (owner && owner.id) {
            try {
                const userRes = await axios.get(`${process.env.API_DOMAIN}/crm/v3/users/${owner.id}`, {
                    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
                });
                if (userRes.data && userRes.data.users && userRes.data.users.length > 0) {
                    const u = userRes.data.users[0];
                    if (u.image_link) crmPhotoUrl = u.image_link;
                    if (u.full_name) owner.name = u.full_name;
                    if (u.email) owner.email = u.email;
                }
            } catch (e) {
                console.log("Could not fetch full user details from /crm/v3/users:", e.message);
            }
        }

        if (!owner) {
            return res.json({
                success: true,
                data: {
                    id: 'default',
                    fullName: 'Ajay Kumar',
                    email: 'ajay@company.com',
                    initials: 'AK',
                    avatarUrl: 'https://ui-avatars.com/api/?name=Ajay+Kumar&background=6366f1&color=fff&bold=true'
                }
            });
        }

        const fullName = owner.name || 'Unknown User';
        const initials = fullName
            ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : '??';

        // Direct photo proxy endpoint URL for Zoho CRM User Photo
        const photoProxyUrl = crmPhotoUrl || `/api/user-photo/${owner.id}`;
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=ffffff&bold=true`;

        res.json({
            success: true,
            data: {
                id: owner.id,
                fullName: fullName,
                email: owner.email || '',
                initials: initials,
                avatarUrl: photoProxyUrl,
                fallbackAvatar: fallbackAvatar
            }
        });
    } catch (error) {
        console.error("Error fetching current user:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health Check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ExpenseTrackerFunction', time: new Date().toISOString() });
});

// Mount router under /api, catalyst server paths, and root
app.use('/api', router);
app.use('/server/ExpenseTrackerFunction/api', router);
app.use('/server/expensetrackerfunction/api', router);
app.use('/', router);

// Start server when executed directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}

// Export Express app for Zoho Catalyst Advanced I/O Function execution
module.exports = app;
