import jwt from "jsonwebtoken";
import User from "../modals/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user  = await User.findById(decoded.id);
        if(!user){
          res.status(404).json({ message: "Invalid token", error });
        }
        req.user = user
        next();
      } catch (error) {
        res.status(401).json({ message: "Invalid or expired token", error });
      }
    } else {
      res.status(401).json({ message: "Not Authorized" });
    }
  } catch (err) {
    res.status(401).json({ message: "Not Authorized" });
  }
};

export default authMiddleware;
