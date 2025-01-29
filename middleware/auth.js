import jwt from "jsonwebtoken";
import User from "../modals/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if(!user){
          return res.status(401).json({message: "Invalid token, please login again."})
        }
        req.user = user;
        next();
      } catch (error) {
        res.status(401).json({ msg: "Invalid or expired token", error });
      }
    }
    if (!token) {
      res.status(401).json({ msg: "Not Authorized" });
    }
  } catch (err) {
    res.status(401).json({ msg: "Not Authorized" });
  }
};

export default authMiddleware;