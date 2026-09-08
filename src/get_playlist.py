#%%
import requests
import json
import webbrowser
import pandas as pd
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler, HTTPServer

# Spotify App credentials
CLIENT_ID = '7e18eee0dbaa4e999f89166eae57cca1'  # Replace with your Spotify App Client ID
CLIENT_SECRET = 'd2fd4f72b0a1440f8685b99c52a5c0df'  # Replace with your Spotify App Client Secret
REDIRECT_URI = 'http://127.0.0.1:5000'  # Redirect URI from your Spotify Developer Dashboard
PLAYLIST_ID = '3rNe1k9V4EsrtPnb1XOW0X'  # Replace with your playlist ID
# Scopes required for the app
SCOPES = 'playlist-read-private'
TOKEN_CACHE_FILE = Path('.spotify_token_cache.json')

# Step 1: Get the OAuth Authorization URL
def get_auth_url():
    auth_url = (
        'https://accounts.spotify.com/authorize'
        f'?client_id={CLIENT_ID}'
        f'&response_type=code'
        f'&redirect_uri={REDIRECT_URI}'
        f'&scope={SCOPES}'
    )
    return auth_url

# Local server that captures the ?code= param from Spotify's redirect
class _AuthCodeHandler(BaseHTTPRequestHandler):
    auth_code = None

    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        _AuthCodeHandler.auth_code = query.get('code', [None])[0]
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        message = "Authorization successful!" if _AuthCodeHandler.auth_code else "Authorization failed: no code received."
        # window.close() only works on tabs opened by script, so fall back to a manual-close message
        html = f"""
        <html><body>
        <p>{message} This tab will close automatically...</p>
        <script>
            window.close();
            setTimeout(function() {{
                document.body.innerHTML = '{message} You can close this tab.';
            }}, 500);
        </script>
        </body></html>
        """
        self.wfile.write(html.encode('utf-8'))

    def log_message(self, format, *args):
        pass  # silence default request logging

def get_auth_code_via_local_server():
    redirect = urlparse(REDIRECT_URI)
    server = HTTPServer((redirect.hostname, redirect.port), _AuthCodeHandler)
    server.handle_request()  # blocks until Spotify hits the redirect once
    return _AuthCodeHandler.auth_code

# Step 2: Exchange authorization code for access token
def get_access_token(auth_code):
    token_url = 'https://accounts.spotify.com/api/token'
    data = {
        'grant_type': 'authorization_code',
        'code': auth_code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        token_data = response.json()
        if token_data.get('refresh_token'):
            TOKEN_CACHE_FILE.write_text(json.dumps({'refresh_token': token_data['refresh_token']}))
        return token_data.get('access_token')
    else:
        print('Error getting access token:', response.json())
        return None

# Use a cached refresh token to get a new access token without opening the browser
def refresh_access_token():
    if not TOKEN_CACHE_FILE.exists():
        return None
    refresh_token = json.loads(TOKEN_CACHE_FILE.read_text()).get('refresh_token')
    if not refresh_token:
        return None
    token_url = 'https://accounts.spotify.com/api/token'
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    }
    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        token_data = response.json()
        # Spotify may rotate the refresh token; keep the cache up to date
        if token_data.get('refresh_token'):
            TOKEN_CACHE_FILE.write_text(json.dumps({'refresh_token': token_data['refresh_token']}))
        return token_data.get('access_token')
    else:
        print('Error refreshing access token:', response.json())
        return None

# Step 3: Fetch playlist details
def get_all_playlist_tracks(access_token, playlist_id):
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    limit = 100  # Maximum limit allowed by Spotify API
    offset = 0
    all_tracks = []
    
    while True:
        # Request a chunk of tracks
        response = requests.get(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            headers=headers,
            params={
                "limit": limit,  # Fetch up to 100 tracks per request
                "offset": offset  # Start fetching from the current offset
            }
        )
        
        if response.status_code != 200:
            print("Error fetching playlist:", response.json())
            break

        data = response.json()
        
        # Add fetched tracks to the list
        all_tracks.extend(data["items"])
        
        # Check if there are more tracks to fetch
        if len(data["items"]) < limit:
            # If the number of tracks fetched is less than the limit, we're done
            break
        
        # Update the offset to fetch the next chunk
        offset += limit

    return all_tracks

# Main function to authenticate and fetch playlist
def main():
    # Step 1: Try a cached refresh token first to skip the browser entirely
    access_token = refresh_access_token()

    if not access_token:
        # Step 2: Fall back to the full browser authorization flow
        print("Opening the browser for Spotify authorization...")
        webbrowser.open(get_auth_url())

        print("Waiting for Spotify to redirect back with the authorization code...")
        auth_code = get_auth_code_via_local_server()
        if not auth_code:
            print("Failed to capture authorization code. Exiting.")
            return

        access_token = get_access_token(auth_code)
        if not access_token:
            print("Failed to fetch access token. Exiting.")
            return

    # Step 4: Fetch the playlist
    playlist_data = get_all_playlist_tracks(access_token, PLAYLIST_ID)

    if playlist_data:
        print("\nPlaylist Details:")
        print(json.dumps(playlist_data, indent=4))
        return playlist_data

if __name__ == '__main__':
    playlist_data = main()
    
#%% to easier readable csv
import locale
from pathlib import Path
# Stel de taal in op Nederlands
locale.setlocale(locale.LC_TIME, "nl_NL.UTF-8")
   
tracks_df = []
for track_data in playlist_data:
    track_data = track_data['track']
    title = track_data['name']
    artist =', '.join([artist['name'] for artist in track_data['artists']])
    date = track_data['album']['release_date']
    year = date.split('-')[0]
    #if int(year)>2015:
    #    year = datetime.strptime(date, "%Y-%m-%d").strftime("%B %Y")
    url = track_data['external_urls']['spotify']
    tracks_df.append([title, artist, year, url])

tracks_df = pd.DataFrame(tracks_df, columns = ['titel', 'artiest', 'jaar', 'url'])
tracks_df.index += 1
folder = Path('Top2000')
folder.mkdir(exist_ok=True)
tracks_df.to_csv(folder / 'Streepje_1.csv')
    

# %%
