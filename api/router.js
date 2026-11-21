// Vercel function for /api/access, /api/groups, /api/group-request and /api/admin/* (rewritten here by vercel.json, see api/_router.js).
module.exports = require("./_router.js").vercel;
