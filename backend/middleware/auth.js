/**
 * Simple authentication middleware
 * This is a placeholder - you can integrate Firebase Admin SDK for token verification
 * or implement your own JWT-based authentication
 */

export function authMiddleware(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        // TODO: Verify Firebase ID token or JWT
        // For now, we'll extract user info from a simple token
        // In production, use Firebase Admin SDK:
        // const decodedToken = await admin.auth().verifyIdToken(token);
        // req.user = decodedToken;

        // Placeholder: Extract user from token (replace with actual verification)
        // For development, you can pass userId in the token directly
        req.user = {
            uid: token, // Temporary: use token as userId
            id: token,
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Optional middleware for Firebase Admin SDK integration
 * Uncomment and configure when ready to use Firebase Auth
 */
/*
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export async function firebaseAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    console.error('Firebase authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
*/

export default authMiddleware;
