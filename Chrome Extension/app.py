from flask import Flask, redirect, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

app.secret_key = os.getenv("SESSION_SECRET", os.urandom(24))

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
# Make sure to add http://localhost:5000/callback to your OAuth 2.0 Redirect URLs in the LinkedIn Developer portal
REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:5000/callback")

AUTHORIZATION_BASE_URL = 'https://www.linkedin.com/oauth/v2/authorization'
TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'

@app.route('/')
def index():
    return "LinkedIn OAuth Server Running. <a href='/login'>Login with LinkedIn</a>"

@app.route('/login')
def login():
    # Use modern OpenID Connect scopes
    # Since you don't have access to the Community API, we remove the social scopes 
    # to prevent login errors.
    scope = 'openid profile email' 
    state = 'random_string_for_security_123'
    
    auth_url = f"{AUTHORIZATION_BASE_URL}?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&state={state}&scope={scope}"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    error = request.args.get('error')
    if error:
        error_description = request.args.get('error_description', '')
        return f"LinkedIn Authorization Error: {error} - {error_description}", 400

    code = request.args.get('code')
    if not code:
        return "Error: No code provided", 400
        
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI
    }
    
    # Exchange auth code for access token
    response = requests.post(TOKEN_URL, data=data)
    token_data = response.json()
    
    if 'access_token' in token_data:
        access_token = token_data['access_token']
        # Return a simple page that the Chrome extension can use to extract the token
        return f"""
        <html>
            <body>
                <h2>LinkedIn Login Successful!</h2>
                <p>You can close this window now.</p>
                <div id="access_token" style="display:none;">{access_token}</div>
            </body>
        </html>
        """
    else:
        return jsonify({"error": "Failed to get access token", "details": token_data}), 400

@app.route('/posts')
def get_posts():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
        
    if not token:
        return jsonify({"error": "No access token provided"}), 401
        
    headers = {
        'Authorization': f'Bearer {token}',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    
    # 1. Fetch user data to get the user ID (sub)
    profile_url = 'https://api.linkedin.com/v2/userinfo'
    profile_response = requests.get(profile_url, headers=headers)
    profile_data = profile_response.json()
    
    if 'sub' not in profile_data:
        return jsonify({"error": "Could not fetch user ID from profile", "details": profile_data}), 400
        
    user_id = profile_data['sub']
    
    # 2. Fetch the user's posts using the ugcPosts API
    # Note: This requires the 'r_member_social' or 'w_member_social' permission depending on LinkedIn's partner tier.
    posts_url = f"https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:person:{user_id}"
    posts_response = requests.get(posts_url, headers=headers)
    posts_data = posts_response.json()
    
    return jsonify({
        "profile": profile_data,
        "posts": posts_data,
        "message": "If posts contain an error, ensure your LinkedIn App has 'Share on LinkedIn' or 'r_member_social' permissions and you requested those scopes during login."
    })

@app.route('/save_posts', methods=['POST', 'OPTIONS'])
def save_posts():
    if request.method == 'OPTIONS':
        return jsonify({"success": True})
        
    data = request.json
    print("\n" + "✨" * 25)
    print("🚀 AUTOMATICALLY SCRAPED POSTS RECEIVED FROM EXTENSION")
    print("✨" * 25)
    import json
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print("✨" * 25 + "\n")
    return jsonify({"success": True, "message": "Data successfully logged to terminal"})

if __name__ == '__main__':
    # Running on HTTP for local testing
    app.run(debug=True, port=5000)
