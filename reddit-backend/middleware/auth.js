import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided" });
  }

  // Support 'Bearer <token>' or just '<token>'
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7, authHeader.length).trim()
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // we will use req.user.id in posts
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
}

