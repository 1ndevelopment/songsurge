import os
import json
from flask import Flask, request, Response, send_file, jsonify
from flask_cors import CORS
from mutagen import File
from mutagen.mp3 import MP3
from mutagen.wave import WAVE
from mutagen.oggvorbis import OggVorbis
from mutagen.flac import FLAC
import mimetypes
import re

app = Flask(__name__)

# Configure CORS to allow all origins and methods for development
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Range", "Authorization"],
        "expose_headers": ["Content-Range", "Accept-Ranges", "Content-Length"]
    }
})

# Configuration
MUSIC_DIR = '/app/music'
SUPPORTED_FORMATS = {'.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a'}

@app.route('/')
def home():
    """Home endpoint to test if backend is running"""
    return jsonify({
        'message': 'SongSurge Backend is running!',
        'status': 'healthy',
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'endpoints': {
            'music_list': '/api/music',
            'search': '/api/music/search?q=query',
            'stream': '/api/music/stream/<file_path>',
            'health': '/api/health'
        }
    })

def get_audio_metadata(file_path):
    """Extract metadata from audio file"""
    try:
        audio = None
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.mp3':
            audio = MP3(file_path)
        elif file_ext == '.wav':
            audio = WAVE(file_path)
        elif file_ext == '.ogg':
            audio = OggVorbis(file_path)
        elif file_ext == '.flac':
            audio = FLAC(file_path)
        
        if audio:
            # Get duration
            duration = int(audio.info.length) if hasattr(audio.info, 'length') else 0
            
            # Get tags
            title = None
            artist = None
            album = None
            
            if hasattr(audio, 'tags'):
                if file_ext == '.mp3' and audio.tags:
                    title = audio.tags.get('TIT2', [None])[0] if 'TIT2' in audio.tags else None
                    artist = audio.tags.get('TPE1', [None])[0] if 'TPE1' in audio.tags else None
                    album = audio.tags.get('TALB', [None])[0] if 'TALB' in audio.tags else None
                elif file_ext == '.ogg' and audio.tags:
                    title = audio.tags.get('title', [None])[0] if 'title' in audio.tags else None
                    artist = audio.tags.get('artist', [None])[0] if 'artist' in audio.tags else None
                    album = audio.tags.get('album', [None])[0] if 'album' in audio.tags else None
                elif file_ext == '.flac' and audio.tags:
                    title = audio.tags.get('title', [None])[0] if 'title' in audio.tags else None
                    artist = audio.tags.get('artist', [None])[0] if 'artist' in audio.tags else None
                    album = audio.tags.get('album', [None])[0] if 'album' in audio.tags else None
            
            return {
                'duration': duration,
                'title': title,
                'artist': artist,
                'album': album
            }
    except Exception as e:
        print(f"Error reading metadata for {file_path}: {e}")
    
    return {'duration': 0, 'title': None, 'artist': None, 'album': None}

def scan_music_directory():
    """Scan music directory and return list of audio files"""
    music_files = []
    
    if not os.path.exists(MUSIC_DIR):
        print(f"Music directory {MUSIC_DIR} does not exist")
        return music_files
    
    for root, dirs, files in os.walk(MUSIC_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            file_ext = os.path.splitext(file)[1].lower()
            
            if file_ext in SUPPORTED_FORMATS:
                # Get relative path from music directory
                rel_path = os.path.relpath(file_path, MUSIC_DIR)
                
                # Get file info
                file_stat = os.stat(file_path)
                file_size = file_stat.st_size
                
                # Get metadata
                metadata = get_audio_metadata(file_path)
                
                music_files.append({
                    'filename': file,
                    'path': rel_path,
                    'size': file_size,
                    'duration': metadata['duration'],
                    'title': metadata['title'] or os.path.splitext(file)[0],
                    'artist': metadata['artist'] or 'Unknown Artist',
                    'album': metadata['album'] or 'Unknown Album',
                    'format': file_ext[1:].upper()
                })
    
    print(f"Found {len(music_files)} music files")
    return sorted(music_files, key=lambda x: x['title'].lower())

@app.route('/api/music', methods=['GET'])
def get_music_list():
    """Get list of all music files"""
    try:
        print("API: Getting music list")
        music_files = scan_music_directory()
        return jsonify({
            'success': True,
            'data': music_files,
            'count': len(music_files)
        })
    except Exception as e:
        print(f"Error in get_music_list: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/music/search', methods=['GET'])
def search_music():
    """Search music files by query"""
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({'success': False, 'error': 'Query parameter required'}), 400
    
    try:
        music_files = scan_music_directory()
        results = []
        
        for file_info in music_files:
            if (query in file_info['title'].lower() or 
                query in file_info['artist'].lower() or 
                query in file_info['album'].lower() or
                query in file_info['filename'].lower()):
                results.append(file_info)
        
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results),
            'query': query
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/music/stream/<path:file_path>', methods=['GET', 'OPTIONS'])
def stream_music(file_path):
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization')
        response.headers.add('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length')
        response.headers.add('Access-Control-Max-Age', '86400')
        return response
    """Stream audio file with range support"""
    try:
        print(f"API: Streaming request for {file_path}")
        
        # Construct full file path
        full_path = os.path.join(MUSIC_DIR, file_path)
        
        if not os.path.exists(full_path):
            print(f"File not found: {full_path}")
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        # Check if file is an audio file
        file_ext = os.path.splitext(full_path)[1].lower()
        if file_ext not in SUPPORTED_FORMATS:
            print(f"Unsupported format: {file_ext}")
            return jsonify({'success': False, 'error': 'Unsupported file format'}), 400
        
        # Get file size
        file_size = os.path.getsize(full_path)
        print(f"File size: {file_size} bytes")
        
        # Handle range requests for streaming
        range_header = request.headers.get('Range', None)
        
        if range_header:
            print(f"Range request: {range_header}")
            byte1, byte2 = 0, None
            match = re.search('(\d+)-(\d*)', range_header)
            groups = match.groups()
            
            if groups[0]:
                byte1 = int(groups[0])
            if groups[1]:
                byte2 = int(groups[1])
            
            if byte2 is None:
                byte2 = file_size - 1
            
            length = byte2 - byte1 + 1
            print(f"Range: {byte1}-{byte2}, length: {length}")
            
            # Read the requested portion of the file
            with open(full_path, 'rb') as f:
                f.seek(byte1)
                data = f.read(length)
            
            resp = Response(
                data,
                206,
                mimetype=mimetypes.guess_type(full_path)[0],
                direct_passthrough=True
            )
            
            resp.headers.add('Content-Range', f'bytes {byte1}-{byte2}/{file_size}')
            resp.headers.add('Accept-Ranges', 'bytes')
            resp.headers.add('Content-Length', str(length))
            resp.headers.add('Access-Control-Allow-Origin', '*')
            resp.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
            resp.headers.add('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization')
            resp.headers.add('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length')
            return resp
        
        # No range request, send entire file
        print("Sending entire file")
        resp = send_file(
            full_path,
            mimetype=mimetypes.guess_type(full_path)[0]
        )
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        resp.headers.add('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization')
        resp.headers.add('Accept-Ranges', 'bytes')
        return resp
        
    except Exception as e:
        print(f"Error streaming {file_path}: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/music/info/<path:file_path>')
def get_music_info(file_path):
    """Get detailed information about a music file"""
    try:
        full_path = os.path.join(MUSIC_DIR, file_path)
        
        if not os.path.exists(full_path):
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        file_stat = os.stat(full_path)
        metadata = get_audio_metadata(full_path)
        
        return jsonify({
            'success': True,
            'data': {
                'filename': os.path.basename(full_path),
                'path': file_path,
                'size': file_stat.st_size,
                'created': file_stat.st_ctime,
                'modified': file_stat.st_mtime,
                'duration': metadata['duration'],
                'title': metadata['title'],
                'artist': metadata['artist'],
                'album': metadata['album']
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        music_files = scan_music_directory()
        return jsonify({
            'success': True,
            'status': 'healthy',
            'music_directory': MUSIC_DIR,
            'music_files_count': len(music_files),
            'timestamp': __import__('datetime').datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
