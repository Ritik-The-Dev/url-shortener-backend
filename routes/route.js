import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  Login,
  Register,
  getUserData,
  updateUser,
  getDashboardData,
  createLink,
  editLink,
  deleteLink,
  getLinks,
  getAnalytics,
  deleteUser,
} from "../controllers/controllers.js";

const router = express.Router();

router.post("/login", Login);

router.post("/register", Register);

router.get("/user", authMiddleware, getUserData);

router.get("/dashboard", authMiddleware, getDashboardData);

router.post("/create-link", authMiddleware, createLink);

router.put("/edit-link", authMiddleware, editLink);

router.delete("/delete-link/:id", authMiddleware, deleteLink);

router.get("/links", authMiddleware, getLinks);

router.get("/analytics", authMiddleware, getAnalytics);

router.delete("/delete-user", authMiddleware, deleteUser);

router.put("/updateUser", authMiddleware, updateUser);

export default router;
