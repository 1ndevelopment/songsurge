import React from 'react';
import { Music, Clock, Disc } from 'lucide-react';
import './MusicLibrary.css';

const MusicLibrary = ({ tracks, onTrackSelect, currentTrack }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleTrackClick = (track) => {
    onTrackSelect(track);
  };

  if (tracks.length === 0) {
    return (
      <div className="music-library empty">
        <div className="empty-state">
          <Music size={48} />
          <h3>No music found</h3>
          <p>Add some music files to the music directory to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-library">
      <div className="library-header">
        <h2>Music Library</h2>
        <div className="library-stats">
          <span className="stat">
            <Music size={16} />
            {tracks.length} tracks
          </span>
        </div>
      </div>

      <div className="tracks-container">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack && currentTrack.path === track.path;
          const isPlaying = isCurrentTrack && currentTrack.isPlaying;
          
          return (
            <div
              key={track.path}
              className={`track-item ${isCurrentTrack ? 'active' : ''} ${isPlaying ? 'playing' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-number">
                {index + 1}
              </div>
              
              <div className="track-info">
                <div className="track-main">
                  <h4 className="track-title">{track.title}</h4>
                  <p className="track-artist">{track.artist}</p>
                </div>
                
                <div className="track-secondary">
                  <span className="track-album">{track.album}</span>
                  <span className="track-format">{track.format}</span>
                </div>
              </div>

              <div className="track-meta">
                <div className="track-duration">
                  <Clock size={14} />
                  {formatDuration(track.duration)}
                </div>
                <div className="track-size">
                  {formatFileSize(track.size)}
                </div>
              </div>

              <div className="track-actions">
                <button
                  className="play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackClick(track);
                  }}
                  title={isCurrentTrack ? (isPlaying ? 'Pause' : 'Resume') : 'Play track'}
                >
                  <Music size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MusicLibrary;
