import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/connectDb.js";
import router from "./routes/route.js";
import { redirectUrl } from "./controllers/controllers.js";
import cookieParser from "cookie-parser";
import useragent from 'express-useragent';
import requestIp from 'request-ip';

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(useragent.express());
app.use(requestIp.mw());
app.use(cookieParser());

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/api/v1", router);
app.get("/:hash", redirectUrl);

const port = process.env.PORT || 998;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
