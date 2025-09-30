import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    // Redirect if not authenticated
    return res.redirect(
      "/auth/login.html?reason=Please+log+in+to+submit+your+work"
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    return next();
  } catch (err) {
    // Token invalid → force login
    return res.redirect(
      "/auth/login.html?reason=Your+session+expired,+please+log+in+again"
    );
  }
}
