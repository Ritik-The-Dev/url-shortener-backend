import express from "express";
import {
  getDashboardData,
  createLink,
  editLink,
  deleteLink,
  getLinks,
  getAnalytics,
} from "../controllers/controllers.js";

const router = express.Router();

router.get("/dashboard", getDashboardData);

router.post("/create-link", createLink);

router.put("/edit-link", editLink);

router.delete("/delete-link/:id", deleteLink);

router.get("/links", getLinks);

router.get("/analytics", getAnalytics);

export default router;
