import { google } from 'googleapis';
import { storage } from './storage.js';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export class GoogleDriveService {
  private static oauth2Client: any = null;

  private static async getOauth2Client() {
    if (this.oauth2Client) return this.oauth2Client;

    const clientId = await storage.getSetting('google_drive_client_id');
    const clientSecret = await storage.getSetting('google_drive_client_secret');
    const redirectUri = await storage.getSetting('google_drive_redirect_uri') || `${process.env.APP_URL || 'http://localhost:5004'}/api/backup/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google Drive API credentials not configured');
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    
    const token = await storage.getSetting('google_drive_token');
    if (token) {
      this.oauth2Client.setCredentials(JSON.parse(token));
    }

    return this.oauth2Client;
  }

  static async getAuthUrl() {
    const client = await this.getOauth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  static async setToken(code: string) {
    const client = await this.getOauth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    await storage.setSetting('google_drive_token', JSON.stringify(tokens));
    return tokens;
  }

  static async uploadBackup(filePath: string) {
    const client = await this.getOauth2Client();
    const drive = google.drive({ version: 'v3', auth: client });

    const fileName = path.basename(filePath);
    const fileMetadata = {
      name: fileName,
      parents: [] // You can specify a folder ID here if needed
    };

    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });

    return response.data;
  }

  static async isConfigured() {
    try {
      const clientId = await storage.getSetting('google_drive_client_id');
      const clientSecret = await storage.getSetting('google_drive_client_secret');
      return !!(clientId && clientSecret);
    } catch {
      return false;
    }
  }

  static async isAuthenticated() {
    try {
      const token = await storage.getSetting('google_drive_token');
      return !!token;
    } catch {
      return false;
    }
  }
}
