const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[Auth] SUPABASE_URL or SUPABASE_KEY missing. Authentication might fail.");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

/**
 * Express middleware to verify Supabase JWT token from Authorization header.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("[Auth] Token verification failed:", error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user payload to request for downstream usage
    req.user = data.user;
    next();
  } catch (err) {
    console.error("[Auth] Internal server error during auth:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  requireAuth,
  supabase
};
