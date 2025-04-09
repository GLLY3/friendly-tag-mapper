import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

try {
  dotenv.config();
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Proxy for Slack API requests
  app.post('/api/slack/conversations.members', async (req, res) => {
    try {
      const { token, channel, limit, cursor } = req.body;
      
      const response = await axios.post('https://slack.com/api/conversations.members', 
        { channel, limit, ...(cursor ? { cursor } : {}) },
        { 
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token || process.env.SLACK_BOT_TOKEN}`
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Error proxying to Slack API:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/slack/users.info', async (req, res) => {
    try {
      const { user } = req.query;
      const token = req.headers.authorization?.split(' ')[1] || process.env.SLACK_BOT_TOKEN;
      
      const response = await axios.get(`https://slack.com/api/users.info?user=${user}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      res.json(response.data);
    } catch (error) {
      console.error('Error proxying to Slack API:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Launch server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`To use with Slack API, set SLACK_BOT_TOKEN in .env file`);
  });
} catch (error) {
  console.error('Server failed to start:', error);
  process.exit(1);
}
