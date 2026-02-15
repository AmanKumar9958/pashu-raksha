# Pashu Raksha 🐾
An Android application designed to help rescue and save animals in distress. The platform connects citizens with nearby NGOs to report and respond to animal emergencies efficiently.
## 📋 Overview
Pashu Raksha ("Animal Protection" in Hindi) is a humanitarian tech solution that enables:
- **Citizens** to report injured, sick, or distressed animals with location and photo evidence
- **NGOs** to view, accept, and manage animal rescue cases in their vicinity
- **Real-time geolocation** matching to find the nearest available rescue organizations
## 🛠️ Tech Stack
### Backend
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB with Mongoose ODM
- **Image Storage:** Cloudinary integration
- **Real-time Features:** Socket.io support
- **Geospatial Queries:** MongoDB 2dsphere indexing
### Key Dependencies
```json
{
  "express": "^5.2.1",
  "mongoose": "^9.2.1",
  "cloudinary": "^2.9.0",
  "socket.io": "^4.8.3",
  "cors": "^2.8.6",
  "dotenv": "^17.3.1"
}
```
## 🚀 Features
### For Citizens
- 📸 Report animal emergencies with photo upload
- 📍 Automatic location tagging using GPS coordinates
- 📝 Add detailed descriptions and categorize incidents
- 🔍 Find nearby registered NGOs
### For NGOs
- 📋 View all pending animal rescue cases
- ✅ Accept and manage assigned cases
- 📊 Track case status (Pending, In Progress, Resolved, Transferred)
- 🗺️ Distance-based case filtering
### Case Categories
- Injured
- Sick
- Accident
- Other
## 📂 Project Structure
```
pashu-raksha/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection setup
│   ├── controllers/
│   │   ├── caseController.js   # Case management logic
│   │   ├── ngoController.js    # NGO search logic
│   │   └── userController.js   # User registration logic
│   ├── models/
│   │   ├── Case.js             # Case schema
│   │   └── User.js             # User/NGO schema
│   ├── routes/
│   │   ├── caseRoutes.js       # Case API endpoints
│   │   ├── ngoRoutes.js        # NGO API endpoints
│   │   └── userRoutes.js       # User API endpoints
│   ├── index.js                # Server entry point
│   ├── package.json
│   └── .gitIgnore
├── LICENSE
└── README.md
```
## 🔧 Installation & Setup
### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
### Environment Variables
Create a `.env` file in the `backend` directory:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
### Backend Setup
```bash
# Navigate to backend directory
cd backend
# Install dependencies
npm install
# Run development server
npm run dev
# Run production server
npm start
```
The API server will start on `http://localhost:5000`
## 📡 API Endpoints
### User Routes
```
POST /api/users/register
```
Register a new citizen or NGO user
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "citizen | NGO",
  "phone": "string",
  "location": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "ngoDetails": {
    "specialization": ["string"],
    "availableUnits": number,
    "address": "string"
  }
}
```
### Case Routes
```
POST /api/cases
```
Create a new animal rescue case
**Request Body:**
```json
{
  "reporterID": "userId",
  "image": "cloudinary_url",
  "description": "string",
  "category": "Injured | Sick | Accident | Other",
  "location": [longitude, latitude]
}
```
```
GET /api/cases
```
Get all cases (sorted by newest first)
```
PUT /api/cases/:id/accept
```
NGO accepts a case
**Request Body:**
```json
{
  "ngoID": "ngoUserId"
}
```
### NGO Routes
```
GET /api/ngos/nearby?lat=<latitude>&lng=<longitude>&distance=<km>
```
Find NGOs within specified radius
**Query Parameters:**
- `lat`: Latitude coordinate
- `lng`: Longitude coordinate
- `distance`: Search radius in kilometers
## 🗃️ Database Schema
### User Model
```javascript
{
  name: String,
  email: String (unique),
  role: Enum ['citizen', 'NGO'],
  location: GeoJSON Point,
  phone: String,
  ngoDetails: {
    isVerified: Boolean,
    specialization: [String],
    availableUnits: Number,
    address: String
  }
}
```
### Case Model
```javascript
{
  reporterID: ObjectId (ref: User),
  image: String (Cloudinary URL),
  description: String,
  category: Enum ['Injured', 'Sick', 'Accident', 'Other'],
  status: Enum ['PENDING', 'IN PROGRESS', 'RESOLVED', 'TRANSFERRED'],
  location: GeoJSON Point,
  assignedNGO: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```
## 🌍 Geospatial Features
The application uses MongoDB's geospatial indexing (`2dsphere`) to:
- Find NGOs within a specific distance from a case location
- Store precise GPS coordinates for both users and cases
- Enable efficient proximity-based queries
## 🔒 License
This project is licensed under the MIT License - see the <a>LICENSE</a> file for details.
## 👨‍💻 Author
**Aman Kumar**
- GitHub: <a href="https://github.com/AmanKumar9958">@AmanKumar9958</a>
## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
## 📞 Support
For support, please create an issue in the repository or contact the maintainers.
---
**Made with ❤️ for animal welfare**
