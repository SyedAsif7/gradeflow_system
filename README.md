# Exam Management System

A comprehensive exam management system with React frontend and FastAPI backend.

## Project Structure

```
.
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── json/             # Sample data files
└── uploads/          # Uploaded answer sheets
```

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB Atlas account

## Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your configuration:
   ```env
   MONGO_URL=your_mongodb_connection_string
   DB_NAME=your_database_name
   JWT_SECRET=your_jwt_secret
   CORS_ORIGINS=http://localhost:3000
   ```

4. Run the backend server:
   ```bash
   python server.py
   ```
   or
   ```bash
   uvicorn server:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file with your configuration:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   yarn start
   ```

## Deployment to Vercel

### Prerequisites

1. Create a [Vercel account](https://vercel.com/)
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

### Environment Variables

Set the following environment variables in your Vercel project settings:

- `MONGO_URL` - Your MongoDB connection string
- `DB_NAME` - Your database name
- `JWT_SECRET` - Your JWT secret
- `CORS_ORIGINS` - Your frontend URL (e.g., https://your-project.vercel.app)

### Deploy Steps

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy the project:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your project:
   - Set the root directory to `.`
   - Set the output directory to `frontend/build`
   - Set the build command to `cd frontend && yarn build`
   - Set the install command to `yarn install`

### Manual Deployment

Alternatively, you can deploy by connecting your GitHub repository to Vercel:

1. Push your code to GitHub
2. Create a new project in Vercel
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Other
   - Root Directory: `.` (default)
   - Build Command: `cd frontend && yarn build`
   - Output Directory: `frontend/build`
   - Install Command: `yarn install`

## API Endpoints

The backend API is available at `/api/` when deployed to Vercel.

## Features

- Teacher and student dashboards
- Exam management
- Answer sheet uploading and grading
- PDF viewing
- Excel export functionality
- User authentication and authorization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License.