import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

try {
  dotenv.config();
  const app = express();
  const PORT = process.env.PORT || 3001;
  const MAPPINGS_FILE = path.join(process.cwd(), 'user_mappings.json');

  // Ensure the mappings file exists and is properly initialized
  const initializeMappingsFile = () => {
    try {
      if (!fs.existsSync(MAPPINGS_FILE)) {
        console.log(`Creating new mappings file at: ${MAPPINGS_FILE}`);
        fs.writeFileSync(MAPPINGS_FILE, JSON.stringify([], null, 2));
        console.log('Successfully created mappings file');
      } else {
        // Verify the file content is valid JSON
        try {
          const content = fs.readFileSync(MAPPINGS_FILE, 'utf8');
          JSON.parse(content);
          console.log('Mappings file exists and contains valid JSON');
        } catch (e) {
          console.log('Invalid JSON in mappings file, resetting...');
          fs.writeFileSync(MAPPINGS_FILE, JSON.stringify([], null, 2));
          console.log('Successfully reset mappings file');
        }
      }
    } catch (error) {
      console.error('Error initializing mappings file:', error);
      process.exit(1);
    }
  };

  // Initialize the file on server start
  initializeMappingsFile();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get all mappings
  app.get('/api/mappings', (req, res) => {
    try {
      if (!fs.existsSync(MAPPINGS_FILE)) {
        console.log('Mappings file not found, initializing...');
        initializeMappingsFile();
      }
      
      const data = fs.readFileSync(MAPPINGS_FILE, 'utf8');
      const mappings = JSON.parse(data);
      console.log(`Retrieved ${mappings.length} mappings`);
      res.json(mappings);
    } catch (error) {
      console.error('Error reading mappings:', error);
      res.status(500).json({ 
        error: 'Failed to read mappings',
        details: error.message 
      });
    }
  });

  // Save mappings
  app.post('/api/mappings', (req, res) => {
    try {
      if (!fs.existsSync(MAPPINGS_FILE)) {
        console.log('Mappings file not found, initializing...');
        initializeMappingsFile();
      }

      console.log('Received mappings to save:', JSON.stringify(req.body, null, 2));
      
      // Read current mappings
      const currentData = fs.readFileSync(MAPPINGS_FILE, 'utf8');
      const currentMappings = JSON.parse(currentData);
      console.log(`Current mappings count: ${currentMappings.length}`);
      
      // Merge existing mappings with new ones, preserving addedOn dates
      const newMappings = req.body;
      const mergedMappings = newMappings.map(newMapping => {
        const existing = currentMappings.find(m => m.userId === newMapping.userId);
        return {
          ...newMapping,
          addedOn: existing?.addedOn || newMapping.addedOn
        };
      });

      // Write back to file
      fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mergedMappings, null, 2));
      console.log(`Successfully saved ${mergedMappings.length} mappings`);
      res.json({ 
        success: true,
        count: mergedMappings.length
      });
    } catch (error) {
      console.error('Error saving mappings:', error);
      res.status(500).json({ 
        error: 'Failed to save mappings',
        details: error.message,
        stack: error.stack
      });
    }
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

  // New endpoint for sending direct messages to users
  app.post('/api/slack/send-dm', async (req, res) => {
    try {
      const { userId, messageText, token } = req.body;
      const authToken = token || process.env.SLACK_BOT_TOKEN;
      
      // First open a direct message channel
      const openResponse = await axios.post('https://slack.com/api/conversations.open', 
        { users: userId },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!openResponse.data.ok) {
        throw new Error(`Failed to open DM channel: ${openResponse.data.error}`);
      }
      
      const dmChannelId = openResponse.data.channel.id;
      
      // Then send the message to the channel
      const messageResponse = await axios.post('https://slack.com/api/chat.postMessage', 
        { 
          channel: dmChannelId,
          text: messageText 
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!messageResponse.data.ok) {
        throw new Error(`Failed to send message: ${messageResponse.data.error}`);
      }
      
      res.json({
        success: true,
        messageTs: messageResponse.data.ts,
        channel: dmChannelId
      });
    } catch (error) {
      console.error('Error sending DM via Slack API:', error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Launch server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`To use with Slack API, set SLACK_BOT_TOKEN in .env file`);
    console.log(`User mappings will be stored in ${MAPPINGS_FILE}`);
  });
} catch (error) {
  console.error('Server failed to start:', error);
  process.exit(1);
}
