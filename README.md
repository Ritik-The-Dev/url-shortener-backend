# URL Shortener and Management Platform

This project is a URL shortening and management platform that allows users to shorten URLs, track clicks, manage their account, and more.

## Prerequisites

Ensure that you have **Node.js** installed on your system before setting up the project.

## URL Shortener - Backend

A powerful and open URL shortening service built with Node.js, Express, and MongoDB. This backend provides a public API for creating, managing, and tracking shortened URLs without requiring user authentication.

## Features

- **Public Access**: No authentication required - anyone can create and manage short URLs
- **URL Shortening**: Convert long URLs into short, manageable links
- **Analytics Tracking**: Track clicks, devices, IP addresses, and timestamps
- **Link Management**: Edit, delete, and organize links with custom remarks
- **Expiration Support**: Set expiration dates for temporary links
- **Dashboard Statistics**: View global statistics including total clicks, date-wise analytics, and device breakdown
- **RESTful API**: Clean and intuitive API endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **URL Generation**: ShortID
- **Device Detection**: express-useragent
- **IP Tracking**: request-ip
- **CORS**: Enabled for cross-origin requests

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=999
MONGO_URI=your_mongodb_connection_string
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Dashboard
- **GET** `/api/v1/dashboard` - Get global statistics (total clicks, total links, date-wise clicks, device breakdown)

### Links Management
- **POST** `/api/v1/create-link` - Create a new short URL
  - Body: `{ destinationUrl, remarks, expirationEnabled, expirationDate }`
  
- **GET** `/api/v1/links` - Get all links with pagination
  - Query: `?page=1&limit=10&remarks=search_term`
  
- **PUT** `/api/v1/edit-link` - Edit an existing link
  - Body: `{ _id, destinationUrl, remarks, expirationEnabled, expirationDate }`
  
- **DELETE** `/api/v1/delete-link/:id` - Delete a link

### Analytics
- **GET** `/api/v1/analytics` - Get detailed analytics with pagination
  - Query: `?page=1&limit=10&remarks=search_term`

### Redirection
- **GET** `/:hash` - Redirect to the original URL and log the visit

## Database Schema

### Links Collection
```javascript
{
  destinationUrl: String,
  shortLink: String (unique),
  remarks: String,
  expirationEnabled: Boolean,
  expirationDate: Date,
  logs: [{
    timeStamp: Date,
    ipAddress: String,
    userDevice: String
  }],
  timestamps: true
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port number | No (default: 998) |
| MONGO_URI | MongoDB connection string | Yes |

## Deployment

This application is configured for deployment on Vercel. The `vercel.json` configuration file is included.

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

## Project Structure

```
Backend/
├── config/
│   └── connectDb.js      # MongoDB connection
├── controllers/
│   └── controllers.js    # Business logic
├── modals/
│   └── Links.js          # Mongoose schema
├── routes/
│   └── route.js          # API routes
├── middleware/           # (Deprecated - auth removed)
├── index.js              # Entry point
├── package.json
└── vercel.json          # Vercel config
```

## Key Changes from Original

This is a **public version** of the original authenticated URL shortener. Key changes include:

- ✅ Removed all authentication requirements
- ✅ Removed user management system
- ✅ Made all links publicly accessible
- ✅ Simplified database schema (removed userId references)
- ✅ Public dashboard with global statistics
- ✅ Anyone can create, edit, or delete any link

## License

ISC

## Author

Portfolio Project - Showcasing full-stack development skills

---

**Note**: This is a public service intended for portfolio demonstration. In production, consider adding rate limiting, spam prevention, and optional authentication for link management. Setup

1. Open a terminal and navigate to the backend project directory.
2. Install the required dependencies by running:
   ```bash
   npm install
   ```
3. Start the backend server with:
   ```bash
   npm run dev
   ```
   The backend will now be running locally.

## Frontend Setup

1. Open a terminal and navigate to the frontend project directory.
2. Install the required dependencies by running:
   ```bash
   npm install
   ```
3. Start the frontend with:
   ```bash
   npm run dev
   ```
   The frontend will now be accessible in your browser.

## Running Frontend with Local Backend

To connect the frontend to your local backend:

1. Go to the `/src/api/hooks.js` file in the frontend project.
2. Comment out the deployment URL and uncomment the local URL to ensure the frontend connects to your local backend server.

## Features Implemented

The platform includes the following features:

### 1. **URL Shortening**
   - Users can shorten long URLs into unique, shortened versions.
   - Shortened URLs are generated using a hash or random string (e.g., `https://<hostname>/<6-8 digit alphanumeric>`).
   - Expiration dates can be set for links, and they will automatically expire once the set date is reached.

### 2. **User Management**
   - User registration and login using email and password.
   - Passwords are securely hashed before being stored.
   - Users can update their profile information (name and email). If the email is updated, the user will be logged out.
   - Users can delete their account and all associated links and data.

### 3. **Dashboard**
   - Users can view a list of their shortened URLs, including:
     - Original URL.
     - Shortened URL.
     - Click analytics data.
   - Users can edit or delete their shortened URLs.

### 4. **Click Tracking**
   - Clicks on shortened URLs are tracked with metadata such as:
     - Timestamp.
     - IP address.
     - User agent (browser and OS details).
   - The collected click data is displayed on the user's dashboard.

### 5. **Link Management**
   - Users can manage their shortened links by:
     - Editing the original URL or its alias.
     - Deleting individual links.

### 6. **Analytics**
   - Detailed analytics are provided for each shortened link:
     - Device type (mobile, desktop, tablet).
     - Browser details.

### 7. **Responsive Design**
   - The platform is fully responsive, providing a seamless experience on both desktop and mobile devices.

### 8. **Pagination**
   - Pagination is implemented in both the Links and Analytics sections for easier navigation through multiple records.

## Demo Credentials

You can test the platform using the following demo credentials:

- **Email**: demo@mail.com  
- **Password**: testing

---

Now you're ready to explore the platform. Feel free to reach out if you have any questions or encounter issues!
```

---
