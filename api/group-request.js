// Vercel function: POST /api/group-request (Bearer Firebase ID token) {name, email} -> organizer asks for a group (see api/_router.js)
module.exports = require("./_router.js").vercel;
