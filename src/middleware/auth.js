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

export function requireRole(...roles) {
  return (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
      return res.redirect("/auth/login.html?reason=Judges+only");
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, email, displayName }
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden: judge access only" });
      }
      next();
    } catch (err) {
      return res.redirect("/auth/login.html?reason=Session+expired");
    }
  };
}

export function attachUserIfPresent(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, displayName? }
  } catch (_) {
    // ignore invalid/expired token on read routes
  }
  next();
}