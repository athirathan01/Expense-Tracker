require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
// Enable CORS so the React frontend can communicate with the backend
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Token cache variables to prevent spamming Zoho and hitting rate limits
let cachedToken = null;
let tokenExpiryTime = null;

// Utility function to get valid access token
async function getValidAccessToken() {
    // If we have a cached token that hasn't expired yet (with a 5-minute safety buffer), use it!
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
            
            // Set expiry time (usually 3600 seconds = 1 hour)
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

// Fetch Expense Categories from Zoho CRM
app.get('/api/expense-categories', async (req, res) => {
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

        // Return only the id and Name
        const categories = response.data.data.map(cat => ({
            id: cat.id,
            name: cat.Name
        }));

        res.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message });
    }
});

// Fetch Expenses from Zoho CRM
app.get('/api/expenses', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Push Expense to Zoho CRM
app.post('/api/expenses', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        // typeName is used for the record Name, typeId is used for the lookup field
        const { typeId, typeName, amount, date, paymentMethod, note } = req.body;

        const payload = {
            data: [
                {
                    "Name": `${typeName} - ${amount}`, // Required field, using the Name string
                    "Expense_Type": { "id": typeId }, // Lookup field expects the ID
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
        res.status(500).json({ error: error.message });
    }
});

// Update Expense in Zoho CRM
app.put('/api/expenses/:id', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Delete Expense from Zoho CRM
app.delete('/api/expenses/:id', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Fetch Income Categories from Zoho CRM
app.get('/api/income-categories', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Fetch Incomes from Zoho CRM
app.get('/api/incomes', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Push Income to Zoho CRM
app.post('/api/incomes', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        const { typeId, typeName, amount, date, receivedTo, note } = req.body;

        const payload = {
            data: [
                {
                    "Name": `${typeName} - ${amount}`, // Required field
                    "Income_Type": { "id": typeId }, // Lookup field expects the ID
                    "Amount": amount,
                    "Income_Date": date,
                    "Payment_Mode": receivedTo, // Note: your UI says 'Received To', API says 'Payment_Mode'
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
        res.status(500).json({ error: error.message });
    }
});

// Update Income in Zoho CRM
app.put('/api/incomes/:id', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

// Delete Income from Zoho CRM
app.delete('/api/incomes/:id', async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
