import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MusicPlayer from './components/MusicPlayer';
import MusicLibrary from './components/MusicLibrary';
import SearchBar from './components/SearchBar';
import './App.css';

// Use relative URLs to avoid CORS issues in Docker environment
// The nginx proxy will handle routing /api/* requests to the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

console.log('API Base URL:', API_BASE_URL); // Debug log

// Utility function to retry API calls
const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`API call attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

function App() {
  const [musicFiles, setMusicFiles] = useState([]);
  const [filteredMusic, setFilteredMusic] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMusicLibrary();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMusic(musicFiles);
    } else {
      const filtered = musicFiles.filter(
        track =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.album.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMusic(filtered);
    }
  }, [searchQuery, musicFiles]);

  const fetchMusicLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, check if backend is healthy with retry
      console.log('Checking backend health at:', `${API_BASE_URL}/api/health`);
      try {
        const healthResponse = await retryApiCall(() => 
          axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 })
        );
        console.log('Backend health check:', healthResponse.data);
      } catch (healthErr) {
        console.warn('Backend health check failed:', healthErr);
        // Continue anyway, the main endpoint might still work
      }
      
      console.log('Fetching music from:', `${API_BASE_URL}/api/music`);
      const response = await retryApiCall(() => 
        axios.get(`${API_BASE_URL}/api/music`, { timeout: 10000 })
      );
      
      if (response.data.success) {
        setMusicFiles(response.data.data);
        setFilteredMusic(response.data.data);
        console.log('Music library loaded:', response.data.data.length, 'tracks');
      } else {
        setError('Failed to fetch music library: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching music:', err);
      
      let errorMessage = 'Error connecting to server';
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend server. Please check if the backend is running.';
      } else if (err.response) {
        errorMessage = `Server error: ${err.response.status} - ${err.response.data?.error || err.response.statusText}`;
      } else if (err.message) {
        errorMessage = `Connection error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = (track) => {
    console.log('Track selected:', track); // Debug log
    
    // If the same track is selected, just toggle play/pause
    if (currentTrack && currentTrack.path === track.path) {
      setIsPlaying(!isPlaying);
      return;
    }
    
    // If a different track is selected, stop current and start new one
    if (currentTrack && currentTrack.path !== track.path) {
      console.log('Switching tracks - stopping current and starting new'); // Debug log
      setIsPlaying(false); // Stop current track
      // Small delay to ensure the stop is processed before starting new track
      setTimeout(() => {
        setCurrentTrack(track);
        setIsPlaying(true);
      }, 100);
    } else {
      // First track selection
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    console.log('Play/Pause toggled. Current state:', isPlaying); // Debug log
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (filteredMusic.length === 0) return;
    
    const currentIndex = filteredMusic.findIndex(track => track.path === currentTrack?.path);
    const nextIndex = (currentIndex + 1) % filteredMusic.length;
    const nextTrack = filteredMusic[nextIndex];
    
    console.log('Playing next track:', nextTrack.title); // Debug log
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (filteredMusic.length === 0) return;
    
    const currentIndex = filteredMusic.findIndex(track => track.path === currentTrack?.path);
    const prevIndex = currentIndex === 0 ? filteredMusic.length - 1 : currentIndex - 1;
    const prevTrack = filteredMusic[prevIndex];
    
    console.log('Playing previous track:', prevTrack.title); // Debug log
    setCurrentTrack(prevTrack);
    setIsPlaying(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Create a track object with playing state for the library
  const currentTrackWithState = currentTrack ? {
    ...currentTrack,
    isPlaying: isPlaying
  } : null;

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your music library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchMusicLibrary}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 SongSurge</h1>
        <p>A Custom Music Streaming App</p>
      </header>

      <main className="app-main">
        <div className="search-section">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="content-area">
          <div className="library-section">
            <MusicLibrary
              tracks={filteredMusic}
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrackWithState}
            />
          </div>

          <div className="player-section">
            <MusicPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasNext={filteredMusic.length > 1}
              hasPrevious={filteredMusic.length > 1}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 SongSurge. Made with ❤️ for music lovers.</p>
      </footer>
    </div>
  );
}

export default App;
