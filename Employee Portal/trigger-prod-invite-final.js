const crypto = require('crypto');

const API_KEY = "AIzaSyDnEkv4FziCDgrJdnI-eYjEsnYw1RpQ9Nk";
const PROJECT_ID = "qualium-ai";
const BACKEND_URL = "https://emp-portal-rho.vercel.app";

async function run() {
    try {
        console.log("1. Authenticating as admin...");
        // Authenticate using known admin credentials
        const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@qualiumai.in',
                password: 'Admin@2026',
                returnSecureToken: true
            })
        });
        const authData = await authRes.json();

        if (!authData.idToken) {
            console.error("Auth failed:", authData);
            return;
        }
        const idToken = authData.idToken;
        const uid = authData.localId;
        console.log("Authenticated as:", uid);

        // 2. Create Invitation in Firestore
        console.log("2. Creating invitation document in Firestore...");
        const inviteId = 'invite_prod_' + Date.now();
        const token = crypto.randomBytes(16).toString('hex');
        
        const inviteDoc = {
            fields: {
                firstName: { stringValue: 'Abhinav' },
                lastName: { stringValue: 'Sai' },
                email: { stringValue: 'mndabhinavsai@gmail.com' },
                role: { stringValue: 'admin' },
                department: { stringValue: 'Management' },
                phone: { stringValue: '' },
                token: { stringValue: token },
                status: { stringValue: 'pending' },
                invitedBy: { stringValue: uid },
                invitedByName: { stringValue: 'System Administrator' }
            }
        };

        const fsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/invitations?documentId=${inviteId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(inviteDoc)
        });
        const fsData = await fsRes.json();
        
        if (fsData.error) {
            console.error("Firestore error:", fsData.error);
            return;
        }
        console.log("Invitation saved successfully.");

        // 3. Trigger Production Vercel Email API
        console.log("3. Triggering production Vercel invite API...");
        const apiRes = await fetch(`${BACKEND_URL}/api/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inviteId,
                token,
                email: 'mndabhinavsai@gmail.com',
                firstName: 'Abhinav',
                lastName: 'Sai',
                role: 'admin',
                department: 'Management'
            })
        });

        const apiData = await apiRes.json();
        if (apiData.success) {
            console.log("--------------------------------------------------");
            console.log("SUCCESS! Admin Invitation Sent.");
            console.log("Recipient: mndabhinavsai@gmail.com");
            console.log("URL:", apiData.onboardingUrl);
            console.log("--------------------------------------------------");
        } else {
            console.error("API failed:", apiData);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
