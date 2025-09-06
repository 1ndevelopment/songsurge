import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import './MusicPlayer.css';

const MusicPlayer = ({ 
  track, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious, 
  hasNext, 
  hasPrevious 
}) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use environment variable or fallback to empty string for Docker nginx proxy
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    if (track) {
      console.log('New track loaded:', track); // Debug log
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
      setIsLoading(true);
      
      if (audioRef.current) {
        // Reset the audio element
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.load();
      }
    }
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        console.log('Attempting to play audio...'); // Debug log
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully'); // Debug log
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error playing audio:', error); // Debug log
              setAudioError(error.message);
              setIsLoading(false);
            });
        }
      } else {
        console.log('Pausing audio...'); // Debug log
        audioRef.current.pause();
        setIsLoading(false);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const newDuration = audioRef.current.duration;
      console.log('Audio metadata loaded, duration:', newDuration); // Debug log
      setDuration(newDuration);
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => {
    console.log('Audio can start playing'); // Debug log
    setAudioError(null);
    setIsLoading(false);
  };

  const handleError = (e) => {
    console.error('Audio error:', e); // Debug log
    const error = e.target.error;
    if (error) {
      setAudioError(`Audio error: ${error.message}`);
    } else {
      setAudioError('Audio playback error occurred');
    }
    setIsLoading(false);
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(0.7);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!track) {
    return (
      <div className="music-player empty">
        <div className="player-placeholder">
          <p>Select a track to start playing</p>
        </div>
      </div>
    );
  }

  const audioSrc = `${API_BASE_URL}/api/music/stream/${track.path}`;
  console.log('Audio source URL:', audioSrc); // Debug log

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onEnded={onNext}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {audioError && (
        <div className="audio-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
          <strong>Audio Error:</strong> {audioError}
        </div>
      )}

      {isLoading && (
        <div className="audio-loading" style={{ color: '#667eea', marginBottom: '1rem', textAlign: 'center' }}>
          <strong>Loading track...</strong>
        </div>
      )}

      <div className="track-info">
        <div className="track-artwork">
          <div className="artwork-placeholder">
            <span>🎵</span>
          </div>
        </div>
        <div className="track-details">
          <h3 className="track-title">{track.title}</h3>
          <p className="track-artist">{track.artist}</p>
          <p className="track-album">{track.album}</p>
        </div>
      </div>

      <div className="player-controls">
        <div className="control-buttons">
          <button
            className="control-btn"
            onClick={onPrevious}
            disabled={!hasPrevious}
            title="Previous"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            className="play-pause-btn"
            onClick={onPlayPause}
            disabled={isLoading}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="loading-spinner" style={{ width: '24px', height: '24px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} />
            )}
          </button>
          
          <button
            className="control-btn"
            onClick={onNext}
            disabled={!hasNext}
            title="Next"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max="100"
            value={progressPercentage}
            onChange={handleSeek}
            disabled={isLoading}
            title="Seek"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="volume-controls">
        <button
          className="volume-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <Volume2 size={18} />
        </button>
        <input
          type="range"
          className="volume-bar"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          title="Volume"
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
