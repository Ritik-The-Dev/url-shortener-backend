  import shortid from "shortid";
  import UserLinks from "../modals/Links.js";
  import useragent from "express-useragent";
  import requestIp from "request-ip";

  const GetLink = async (query, skip, limit) => {
    const allLinks = await UserLinks.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  
    const count = await UserLinks.find(query).countDocuments();
  
    const linksData = allLinks.map((link) => {

      let status = "Active";

      if(link.expirationEnabled){
        const expirationDateStr = link.expirationDate; 
        const currentTimeUtc = new Date();
        const currentTimeIST = new Date(currentTimeUtc.getTime() + (5.5 * 60 * 60 * 1000));
        const expirationDateUtc = new Date(expirationDateStr);
        status = expirationDateUtc > currentTimeIST ? "Active" : "Inactive";
      }

      return {
        _id: link._id,
        date: link.createdAt,
        expirationDate: link.expirationDate,
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



  export const getDashboardData = async (req, res) => {
    try {
      const Links = await UserLinks.find({});

      let totalClicks = 0;
      let totalLinks = Links.length;
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
      ).sort((a, b) => b.count - a.count);

      const sortedDates = Object.keys(dateWiseClicks).sort();
      let cumulativeClicks = 0;
      const cumulativeDateWiseClicks = sortedDates.map((date) => {
        cumulativeClicks += dateWiseClicks[date];
        return { date, clicks: cumulativeClicks };
      });

      const formattedDateWiseClicks = cumulativeDateWiseClicks.map((item) => ({
        name: item.date,
        count: item.clicks,
        originalDate: new Date(
          `20${item.date.split("-")[2]}`,
          item.date.split("-")[1] - 1,
          item.date.split("-")[0]
        ),
      })).sort((a, b) => b.originalDate - a.originalDate);

      res.status(200).json({
        success: true,
        data: {
          totalClicks,
          totalLinks,
          dateWiseClicks: formattedDateWiseClicks,
          clickedDevices: formattedClickedDevices,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const getLinks = async (req, res) => {
    const { page, limit, remarks } = req.query;

    try {
      const skip = (page - 1) * limit;

      const query = {
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

      const newLink = await UserLinks.create({
        destinationUrl,
        shortLink: `${hostname}/${hash}`,
        remarks: remarks || "",
        expirationEnabled: expirationEnabled || false,
        expirationDate: expirationEnabled ? new Date(expirationDate) : null,
      });

      const query = {}

      const { linksData, count } = await GetLink(query, 0, 10);

      res.status(201).json({
        success: true,
        message: "Link created successfully",
        data: linksData,
        count,
        createdLink: {
          shortLink: newLink.shortLink,
          destinationUrl: newLink.destinationUrl,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  export const editLink = async (req, res) => {
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

      if (destinationUrl) {
        userLink.destinationUrl = destinationUrl;
      }

      if (remarks !== undefined) {
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

      if(!expirationEnabled){
        userLink.expirationEnabled = false;
        userLink.expirationDate = null;
      }

      await userLink.save();

      const query = {}

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

      await UserLinks.findByIdAndDelete(id);

      const query = {}

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
    const { page = 1, limit = 10, remarks } = req.query;
  
    try {
      const skip = (page - 1) * limit;
  
      const query = {
        ...(remarks
          ? { remarks: { $regex: remarks, $options: "i" } }
          : { remarks: { $ne: null } }),
      };
  
      const allLinks = await UserLinks.find(query);
  
      const logsData = allLinks.flatMap((link) =>
        (link.logs || []).map((log) => {
          const dateKey = new Date(log.timeStamp);
          return {
            date: dateKey,
            destinationUrl: link.destinationUrl,
            shortLink: link.shortLink,
            ipAddress: log.ipAddress,
            userDevice: log.userDevice,
          };
        })
      ).sort((a, b) => b.date - a.date);
  
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

const getDeviceName = (userSystemInfo) => {
    if (userSystemInfo?.isMobile) {
      if (userSystemInfo?.isAndroid) return "Android";
      if (userSystemInfo?.isiPhone) return "iPhone";
      if (userSystemInfo?.isiPad) return "iPad";
      return "Mobile";
    }
  
    if (userSystemInfo?.isTablet) {
      return "Tablet";
    }
  
    if (userSystemInfo?.isDesktop) {
      if (userSystemInfo?.isWindows) return "Windows PC";
      if (userSystemInfo?.isMac) return "Mac PC";
      if (userSystemInfo?.isLinux) return "Linux PC";
      return "Desktop";
    }
  
    return userSystemInfo?.platform;
  };
  
  export const redirectUrl = async (req, res) => {
    let userSystemInfo = useragent.parse(req.headers["user-agent"]);

    const userIPAddress = requestIp.getClientIp(req);

    const hostname = req.headers.host;
    const { hash } = req.params;
    const shortLink = `${hostname}/${hash}`;

    try {

      const userDevice = getDeviceName(userSystemInfo);
      
      const Link = await UserLinks.findOne({ shortLink });

      if (!Link) {
        return res.status(404).json({ message: "Invalid URL / URL not found" });
      }

      if (Link.expirationEnabled) {
        const currentTimeUtc = new Date();
        const currentTimeIST = new Date(currentTimeUtc.getTime() + (5.5 * 60 * 60 * 1000));
        const expirationDateUtc = new Date(Link.expirationDate);
        if (expirationDateUtc <= currentTimeIST) {
          return res.status(404).json({ message: "URL has expired" });
        }
      }
      
      Link.logs.push({
        timeStamp: new Date(),
        ipAddress: userIPAddress,
        userDevice
      });

      await Link.save();
      
      let destinationUrl = Link.destinationUrl;
      if (!/^https?:\/\//i.test(destinationUrl)) {
        destinationUrl = `https://${destinationUrl}`;
      }
  
      res.redirect(destinationUrl);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  