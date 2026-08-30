import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  
  @Get('github')
  githubAuth(@Res() res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).send('GITHUB_CLIENT_ID is not configured in the backend environment.');
    }
    
    // Redirect to GitHub's OAuth authorization page
    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,read:org,user`;
    res.redirect(redirectUri);
  }

  @Get('github/callback')
  async githubAuthCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.status(400).send('No authorization code provided by GitHub.');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).send('GitHub OAuth credentials are not configured.');
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return res.status(400).send(`GitHub OAuth Error: ${data.error_description || data.error}`);
      }

      const accessToken = data.access_token;
      
      if (!accessToken) {
        return res.status(400).send('Failed to obtain access token from GitHub.');
      }

      // Redirect back to frontend with the token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const formattedFrontendUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
      return res.redirect(`${formattedFrontendUrl}/login?token=${accessToken}`);
      
    } catch (err) {
      return res.status(500).send(`Internal Server Error during token exchange: ${err.message}`);
    }
  }
}
