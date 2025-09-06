# SongSurge - Personal Music Streaming App

A modern web application for streaming your personal music collection with a beautiful, responsive interface.

## Features

- 🎵 Stream your personal music collection
- 🔍 Search through your music library
- 🎧 Modern music player with controls
- 📱 Responsive design for all devices
- 🐳 Docker-based deployment
- 🔄 Real-time music streaming with range support

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Your music files (MP3, WAV, FLAC, OGG, AAC, M4A)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd songsurge
   ```

2. **Add your music files**
   ```bash
   # Copy your music files to the music directory
   cp /path/to/your/music/* music/
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Architecture

### Frontend (React + Nginx)
- **Port**: 3000
- **Technology**: React 18, Axios, Lucide React
- **Proxy**: Nginx handles API routing to backend
- **CORS**: Configured to avoid cross-origin issues

### Backend (Flask + Gunicorn)
- **Port**: 5000
- **Technology**: Flask, Flask-CORS, Mutagen
- **Features**: Music metadata extraction, streaming with range support
- **CORS**: Configured to allow all origins for development

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/music` - List all music files
- `GET /api/music/search?q=query` - Search music files
- `GET /api/music/stream/<file_path>` - Stream audio file
- `GET /api/music/info/<file_path>` - Get music file info

## CORS Configuration

The application is configured to handle CORS properly:

1. **Frontend**: Uses relative URLs to avoid cross-origin issues
2. **Nginx Proxy**: Routes `/api/*` requests to backend with proper CORS headers
3. **Backend**: Configured with Flask-CORS to allow all origins

## Troubleshooting

### CORS Issues
If you encounter CORS errors:
1. Ensure both containers are running: `docker-compose ps`
2. Check logs: `docker-compose logs frontend` and `docker-compose logs backend`
3. Verify API endpoints: `curl http://localhost:3000/api/health`

### No Music Files
If the music library is empty:
1. Add music files to the `music/` directory
2. Restart the backend: `docker-compose restart backend`

### Port Conflicts
If ports 3000 or 5000 are already in use:
1. Modify `docker-compose.yml` to use different ports
2. Update the frontend API configuration if needed

## Development

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm start
```

### Building Images
```bash
docker-compose build --no-cache
```

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Made with ❤️ for music lovers
