interface SlackUserProfile {
  real_name: string;
  display_name: string;
}

interface SlackUser {
  id: string;
  name: string;
  profile: SlackUserProfile;
  is_bot: boolean;
  deleted: boolean;
}

interface SlackMembersResponse {
  members: string[];
  response_metadata?: {
    next_cursor?: string;
  };
  ok: boolean;
  error?: string;
}

interface SlackUserResponse {
  user: SlackUser;
  ok: boolean;
  error?: string;
}

export interface UserMapping {
  realName: string;
  slackTag: string;
  userId: string;
  addedOn?: string;
}

interface SendDmResponse {
  success: boolean;
  messageTs?: string;
  channel?: string;
  error?: string;
}

export class SlackService {
  private token: string;
  private channelId: string;
  private apiUrl: string;

  constructor() {
    this.token = import.meta.env.VITE_SLACK_BOT_TOKEN;
    this.channelId = import.meta.env.VITE_SLACK_CHANNEL_ID;
    this.apiUrl = 'http://localhost:3001/api/slack';

    if (!this.token || !this.channelId) {
      throw new Error('SLACK_BOT_TOKEN and SLACK_CHANNEL_ID must be set in environment variables');
    }
  }

  async getChannelMembers(): Promise<string[]> {
    try {
      let members: string[] = [];
      let cursor: string | undefined;
      
      if (this.token.startsWith('xoxb-demo')) {
        return this.getMockMembers();
      }
      
      do {
        const response = await fetch(`${this.apiUrl}/conversations.members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: this.token,
            channel: this.channelId,
            limit: '200',
            ...(cursor ? { cursor } : {})
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.statusText}`);
        }

        const data = await response.json() as SlackMembersResponse;
        
        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
        }
        
        if (!data.members) {
          throw new Error('No members found in response');
        }
        
        members = [...members, ...data.members];
        cursor = data.response_metadata?.next_cursor;
      } while (cursor);

      return members;
    } catch (error) {
      console.error('Error retrieving channel members:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(
          'Failed to connect to proxy server. Make sure your server is running on http://localhost:3001. ' +
          'Run "node server.js" in a separate terminal window before using this app.'
        );
      }
      
      throw error;
    }
  }

  async getUserInfo(userId: string): Promise<SlackUser> {
    try {
      if (this.token.startsWith('xoxb-demo')) {
        return this.getMockUserInfo(userId);
      }
      
      const response = await fetch(`${this.apiUrl}/users.info?user=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json() as SlackUserResponse;
      
      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
      }
      
      return data.user;
    } catch (error) {
      console.error(`Error retrieving user info for ${userId}:`, error);
      throw error;
    }
  }

  async mapUserTagsToIds(): Promise<UserMapping[]> {
    try {
      if (this.token.startsWith('xoxb-demo')) {
        return this.getMockUserMappings();
      }
      
      const members = await this.getChannelMembers();
      const userMappings: UserMapping[] = [];
      const existingMappings = await this.getStoredMappings();
      const existingUserIds = new Set(existingMappings.map(m => m.userId));
      const today = new Date().toISOString().split('T')[0];

      for (const userId of members) {
        try {
          const userInfo = await this.getUserInfo(userId);
          
          if (userInfo && !userInfo.deleted && !userInfo.is_bot) {
            const realName = userInfo.profile.real_name || '';
            if (realName) {
              const isNewUser = !existingUserIds.has(userId);
              const existingUser = existingMappings.find(m => m.userId === userId);
              
              userMappings.push({
                realName,
                slackTag: `@${userInfo.name}`,
                userId,
                addedOn: isNewUser ? today : existingUser?.addedOn
              });
            }
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
        }
      }

      await this.storeMappings(userMappings);
      
      return userMappings;
    } catch (error) {
      console.error('Error mapping user tags to IDs:', error);
      throw error;
    }
  }
  
  async sendDirectMessage(userId: string, messageText: string): Promise<SendDmResponse> {
    try {
      if (this.token.startsWith('xoxb-demo')) {
        return this.getMockDmResponse(userId);
      }
      
      const response = await fetch(`${this.apiUrl}/send-dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          userId,
          messageText
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send direct message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error sending direct message to ${userId}:`, error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(
          'Failed to connect to proxy server. Make sure your server is running on http://localhost:3001. ' +
          'Run "node server.js" in a separate terminal window before using this app.'
        );
      }
      
      throw error;
    }
  }
  
  private async storeMappings(mappings: UserMapping[]): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/api/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to store mappings on server');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Server returned unsuccessful response');
      }
    } catch (e) {
      console.error('Failed to store mappings:', e);
      throw e;
    }
  }
  
  private async getStoredMappings(): Promise<UserMapping[]> {
    try {
      const response = await fetch('http://localhost:3001/api/mappings');
      
      if (!response.ok) {
        throw new Error('Failed to retrieve mappings from server');
      }
      
      return await response.json();
    } catch (e) {
      console.error('Failed to retrieve stored mappings:', e);
      return [];
    }
  }
  
  private findAddedOnDate(existingMappings: UserMapping[], userId: string): string | undefined {
    const existing = existingMappings.find(m => m.userId === userId);
    return existing?.addedOn;
  }
  
  private getMockMembers(): string[] {
    return ['U01', 'U02', 'U03', 'U04', 'U05', 'U06', 'U07', 'U08', 'U09', 'U10'];
  }
  
  private getMockUserInfo(userId: string): SlackUser {
    const id = userId;
    const userNumber = parseInt(userId.replace('U', ''));
    const name = `user${userNumber}`;
    
    return {
      id,
      name,
      profile: {
        real_name: `User ${userNumber}`,
        display_name: `user${userNumber}`
      },
      is_bot: false,
      deleted: false
    };
  }
  
  private async getMockUserMappings(): Promise<UserMapping[]> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const existingMappings = await this.getStoredMappings();
    const existingUserIds = new Map(existingMappings.map(m => [m.userId, m.addedOn]));
    
    const mockMappings: UserMapping[] = [
      { realName: 'John Doe', slackTag: '@johndoe', userId: 'U01', addedOn: existingUserIds.get('U01') || today },
      { realName: 'Jane Smith', slackTag: '@janesmith', userId: 'U02', addedOn: existingUserIds.get('U02') || today },
      { realName: 'Alex Johnson', slackTag: '@alexj', userId: 'U03', addedOn: existingUserIds.get('U03') || today },
      { realName: 'Sarah Williams', slackTag: '@sarahw', userId: 'U04', addedOn: existingUserIds.get('U04') || today },
      { realName: 'Michael Brown', slackTag: '@mikeb', userId: 'U05', addedOn: existingUserIds.get('U05') || today },
      { realName: 'Emily Davis', slackTag: '@emilyd', userId: 'U06', addedOn: existingUserIds.get('U06') || today },
      { realName: 'David Miller', slackTag: '@davidm', userId: 'U07', addedOn: existingUserIds.get('U07') || today },
      { realName: 'Jessica Wilson', slackTag: '@jessw', userId: 'U08', addedOn: existingUserIds.get('U08') || today },
      { realName: 'Chris Taylor', slackTag: '@christ', userId: 'U09', addedOn: existingUserIds.get('U09') || today },
      { realName: 'Anna Martinez', slackTag: '@annam', userId: 'U10', addedOn: existingUserIds.get('U10') || today }
    ];
    
    await this.storeMappings(mockMappings);
    
    return mockMappings;
  }
  
  private getMockDmResponse(userId: string): SendDmResponse {
    return {
      success: true,
      messageTs: new Date().getTime().toString(),
      channel: `D${userId.substring(1)}`
    };
  }
}
