import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import TwitterApi from 'twitter-api-v2';
import { facebook } from 'facebook-sdk';

// Types for platform credentials and configurations
interface PlatformCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

// Main Ecosystem Integration Service class
class EcosystemIntegrationService {
  private googleClient: OAuth2Client;
  private twitterClient: TwitterApi;
  private facebookClient: any;

  constructor() {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID || '',
      process.env.GOOGLE_CLIENT_SECRET || '',
      process.env.GOOGLE_REDIRECT_URI || ''
    );

    // Initialize Twitter client
    this.twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || '',
      appSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || ''
    });

    // Initialize Facebook SDK
    this.facebookClient = facebook({
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || ''
    });
  }

  // Google Authentication
  async authenticateWithGoogle(code: string): Promise<UserProfile> {
    try {
      const { tokens } = await this.googleClient.getToken(code);
      this.googleClient.setCredentials(tokens);

      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token || '',
        audience: process.env.GOOGLE_CLIENT_ID || ''
      });

      const payload = ticket.getPayload();
      return {
        id: payload?.sub || '',
        name: payload?.name || '',
        email: payload?.email || '',
        avatar: payload?.picture || ''
      };
    } catch (error) {
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  // Twitter Authentication
  async authenticateWithTwitter(): Promise<string> {
    try {
      const authUrl = await this.twitterClient.generateAuthLink(
        process.env.TWITTER_REDIRECT_URI || ''
      );
      return authUrl.url;
    } catch (error) {
      throw new Error(`Twitter authentication failed: ${error.message}`);
    }
  }

  async getTwitterUserProfile(oauthToken: string, oauthVerifier: string): Promise<UserProfile> {
    try {
      const client = await this.twitterClient.login(oauthVerifier);
      const userData = await client.v2.me({ 'user.fields': ['profile_image_url'] });
      return {
        id: userData.data.id,
        name: userData.data.name,
        avatar: userData.data.profile_image_url || ''
      };
    } catch (error) {
      throw new Error(`Twitter profile fetch failed: ${error.message}`);
    }
  }

  // Facebook Authentication
  async authenticateWithFacebook(code: string): Promise<UserProfile> {
    try {
      const tokenResponse = await this.facebookClient.getAccessToken(code, process.env.FACEBOOK_REDIRECT_URI || '');
      const userData = await this.facebookClient.api('/me', {
        fields: ['id', 'name', 'email', 'picture'],
        access_token: tokenResponse.access_token
      });

      return {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        avatar: userData.picture?.data?.url || ''
      };
    } catch (error) {
      throw new Error(`Facebook authentication failed: ${error.message}`);
    }
  }

  // Data Synchronization across platforms
  async syncUserData(userId: string, platform: string, data: any): Promise<void> {
    try {
      // Implement data synchronization logic (e.g., store in DB or broadcast to other platforms)
      console.log(`Syncing data for user ${userId} on ${platform}`, data);
      // Add logic to store data in your database or broadcast to connected platforms
    } catch (error) {
      throw new Error(`Data sync failed: ${error.message}`);
    }
  }

  // Cross-platform posting
  async postToPlatform(platform: string, content: string, userCredentials: any): Promise<void> {
    try {
      switch (platform.toLowerCase()) {
        case 'twitter':
          await this.twitterClient.v2.tweet(content);
          break;
        case 'facebook':
          await this.facebookClient.api('/me/feed', 'POST', {
            message: content,
            access_token: userCredentials.accessToken
          });
          break;
        default:
          throw new Error('Unsupported platform');
      }
    } catch (error) {
      throw new Error(`Posting to ${platform} failed: ${error.message}`);
    }
  }

  // Generic API connector for other external services
  async connectToExternalApi(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: endpoint,
        data
      });
      return response.data;
    } catch (error) {
      throw new Error(`External API connection failed: ${error.message}`);
    }
  }
}

export default new EcosystemIntegrationService();
