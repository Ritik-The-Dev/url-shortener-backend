  import bcrypt from "bcryptjs";
  import shortid from "shortid";
  import jwt from "jsonwebtoken";
  import User from "../modals/User.js";
  import UserLinks from "../modals/Links.js";
  import useragent from "express-useragent";
  import requestIp from "request-ip";

  const GetLink = async (query, skip, limit) => {
    const allLinks = await UserLinks.find(query).skip(skip).limit(limit);

    const count = await UserLinks.find(query).countDocuments();

    const linksData = allLinks.map((link) => {
      const dateKey = new Date(link.createdAt);

      const formattedDate = dateKey.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const status = link.expirationEnabled
        ? link.expirationDate > new Date()
          ? "Active"
          : "Inactive"
        : "Active";

      return {
        _id: link._id,
        date: formattedDate,
        expirationEnabled: link.expirationEnabled,
        destinationUrl: link.destinationUrl,
        shortLink: link.shortLink,
        remarks: link.remarks,
        clicks: link.logs.length,
        status,
      };
    });

    return { linksData, count };
  };

  export const Login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid credentials." });
      }

      const token = jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        secure:true
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const Register = async (req, res) => {
    const { name, email, password, number } = req.body;

    if (!name || !email || !password || !number) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    try {
      const existingUser = await User.findOne({
        $or: [{ email }, { number }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email or phone number already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await User.create({
        username: name,
        number,
        email,
        password: hashedPassword,
      });

      return res.status(201).json({
        success: true,
        message: "User Created Successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getUserData = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    try {
      const user = await User.findById(userId).select("-password");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        data: user,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const updateUser = async (req, res) => {
    const { name, email, number } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!name || !email || !number) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Name , Email and Number is Required",
          });
      }

      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res
            .status(400)
            .json({ success: false, message: "Email already in use" });
        }
        user.email = email;
      }

      if (number && number !== user.number) {
        const numberExists = await User.findOne({ number });
        if (numberExists) {
          return res
            .status(400)
            .json({ success: false, message: "Phone number already in use" });
        }
        user.number = number;
      }

      if (name) {
        user.username = name;
      }

      await user.save();

      const { password, ...restData } = user.toObject();

      return res.status(200).json({
        success: true,
        message: "User data updated successfully",
        data: restData,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getDashboardData = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    try {
      const Links = await UserLinks.find({ userId });

      let totalClicks = 0;
      const dateWiseClicks = {};
      const clickedDevices = {};

      Links.forEach((link) => {
        link.logs.forEach((log) => {
          totalClicks++;
          const device = log.userDevice.toLowerCase();
          if (clickedDevices[device]) {
            clickedDevices[device]++;
          } else {
            clickedDevices[device] = 1;
          }
          const dateKey = new Date(log.timeStamp);
          const formattedDate = `${String(dateKey.getDate()).padStart(
            2,
            "0"
          )}-${String(dateKey.getMonth() + 1).padStart(2, "0")}-${String(
            dateKey.getFullYear()
          ).slice(2)}`;

          dateWiseClicks[formattedDate] =
            (dateWiseClicks[formattedDate] || 0) + 1;
        });
      });
      const formattedClickedDevices = Object.keys(clickedDevices).map(
        (device) => ({
          name: device,
          count: clickedDevices[device],
        })
      );

      const sortedDates = Object.keys(dateWiseClicks).sort();
      let cumulativeClicks = 0;
      const cumulativeDateWiseClicks = sortedDates.map((date) => {
        cumulativeClicks += dateWiseClicks[date];
        return { date, clicks: cumulativeClicks };
      });

      const formattedDateWiseClicks = cumulativeDateWiseClicks.map((item) => ({
        name: item.date,
        count: item.clicks,
      }));

      res.status(200).json({
        success: true,
        data: {
          totalClicks,
          dateWiseClicks: formattedDateWiseClicks,
          clickedDevices: formattedClickedDevices,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getLinks = async (req, res) => {
    const userId = req.user?.id;
    const { page, limit, remarks } = req.query;

    try {
      const skip = (page - 1) * limit;

      const query = {
        userId,
        remarks: remarks ? { $regex: remarks, $options: "i" } : { $ne: null },
      };

      const { linksData, count } = await GetLink(query, skip, limit);

      res.status(200).json({
        success: true,
        data: linksData,
        count,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const createLink = async (req, res) => {
    const userId = req.user?.id;
    const { destinationUrl, remarks, expirationEnabled, expirationDate } =
      req.body;
    try {
      if (!destinationUrl) {
        return res
          .status(400)
          .json({ success: false, message: "Destination URL is required" });
      }

      const hostname = req.headers.host;

      let hash;
      let shortLinkExists = true;

      while (shortLinkExists) {
        hash = shortid.generate();
        const existingLink = await UserLinks.findOne({
          shortLink: `${hostname}/${hash}`,
        });
        if (!existingLink) {
          shortLinkExists = false;
        }
      }

      await UserLinks.create({
        userId,
        destinationUrl,
        shortLink: `${hostname}/${hash}`,
        remarks: remarks || "",
        expirationEnabled: expirationEnabled || false,
        expirationDate: expirationEnabled ? new Date(expirationDate) : null,
      });

      const query = {
        userId: userId,
      }

      const { linksData, count } = await GetLink(query, 0, 10);

      res.status(201).json({
        success: true,
        message: "Link created successfully",
        data: linksData,
        count
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const editLink = async (req, res) => {
    const userId = req.user?.id;
    const { _id, destinationUrl, remarks, expirationEnabled, expirationDate } =
      req.body;

    try {
      if (!_id) {
        return res
          .status(400)
          .json({ success: false, message: "Link ID is required" });
      }

      const userLink = await UserLinks.findById(_id);

      if (!userLink) {
        return res
          .status(404)
          .json({ success: false, message: "Link not found" });
      }

      if (userLink.userId != userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to edit this link",
        });
      }

      if (destinationUrl) {
        userLink.destinationUrl = destinationUrl;
      }

      if (remarks) {
        userLink.remarks = remarks;
      }

      if (expirationEnabled) {
        userLink.expirationEnabled = expirationEnabled;
        if (expirationEnabled && !expirationDate) {
          return res.status(400).json({
            success: false,
            message: "Expiration date is required when expiration is enabled",
          });
        }
        if (expirationDate) {
          userLink.expirationDate = new Date(expirationDate);
        }
      }

      await userLink.save();

      const query = {
        userId: userId,
      }

      const { linksData, count } = await GetLink(query, 0, 10);

      res.status(200).json({
        success: true,
        message: "Link updated successfully",
        data: linksData,
        count
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const deleteLink = async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    try {
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Link ID is required" });
      }

      const userLink = await UserLinks.findById(id);

      if (!userLink) {
        return res
          .status(404)
          .json({ success: false, message: "Link not found" });
      }

      if (userLink.userId != userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this link",
        });
      }

      await UserLinks.findByIdAndDelete(id);

      const query = {
        userId: userId,
      }

      const { linksData, count } = await GetLink(query, 0, 10);

      res.status(200).json({
        success: true,
        message: "Link deleted successfully",
        data: linksData,
        count
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getAnalytics = async (req, res) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10, remarks } = req.query;
  
    try {
      const skip = (page - 1) * limit;
  
      const query = {
        userId,
        ...(remarks
          ? { remarks: { $regex: remarks, $options: "i" } }
          : { remarks: { $ne: null } }),
      };
  
      const allLinks = await UserLinks.find(query);
  
      const logsData = allLinks.flatMap((link) =>
        (link.logs || []).map((log) => {
          const dateKey = new Date(log.timeStamp);
  
          const formattedDate = dateKey.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
  
          return {
            date: formattedDate,
            destinationUrl: link.destinationUrl,
            shortLink: link.shortLink,
            ipAddress: log.ipAddress,
            userDevice: log.userDevice,
          };
        })
      );
  
      const count = logsData.length;
  
      const paginatedData = logsData.slice(skip, skip + Number(limit));
  
      res.status(200).json({
        success: true,
        data: paginatedData,
        count,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const deleteUser = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      await UserLinks.deleteMany({ userId });

      await User.findByIdAndDelete(userId);

      res.status(200).json({
        message: "User and associated links deleted successfully",
        success: true,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const redirectUrl = async (req, res) => {
    let userSystemInfo = req.headers["user-agent"];
    userSystemInfo = useragent.parse(userSystemInfo);

    const userIPAddress = requestIp.getClientIp(req);

    const hostname = req.headers.host;
    const { hash } = req.params;
    const shortLink = `${hostname}/${hash}`;

    try {
      const Link = await UserLinks.findOne({ shortLink });

      if (!Link) {
        return res.status(404).json({ message: "Invalid URL / URL not found" });
      }

      if (Link.expirationEnabled && new Date() > Link.expirationDate) {
        return res.status(404).json({ message: "URL has expired" });
      }

      const osName = userSystemInfo.os;

      Link.logs.push({
        timeStamp: new Date(),
        ipAddress: userIPAddress,
        userDevice: osName,
      });

      await Link.save();

      res.redirect(Link.destinationUrl);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  