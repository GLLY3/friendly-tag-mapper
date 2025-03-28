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

export class SlackService {
  private token: string;
  private channelId: string;

  constructor(token: string, channelId: string) {
    this.token = token;
    this.channelId = channelId;
  }

  async getChannelMembers(): Promise<string[]> {
    try {
      let members: string[] = [];
      let cursor: string | undefined;
      
      if (this.token.startsWith('xoxb-demo')) {
        return this.getMockMembers();
      }
      
      do {
        const response = await fetch(`https://slack.com/api/conversations.members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${this.token}`
          },
          body: new URLSearchParams({
            channel: this.channelId,
            limit: '200',
            ...(cursor ? { cursor } : {})
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch members: ${response.statusText}. This is likely due to CORS restrictions. You need a server-side proxy to call Slack APIs.`);
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
          'Failed to connect to Slack API due to CORS restrictions. For browser security reasons, ' +
          'direct API calls to Slack from a browser are not allowed. To use this feature, you would need ' +
          'a server-side proxy or backend. For demo purposes, use token "xoxb-demo" to see sample data.'
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
      
      const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
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
      const existingMappings = this.getStoredMappings();
      const existingUserIds = new Set(existingMappings.map(m => m.userId));
      const today = new Date().toISOString().split('T')[0];

      for (const userId of members) {
        try {
          const userInfo = await this.getUserInfo(userId);
          
          if (userInfo && !userInfo.deleted && !userInfo.is_bot) {
            const realName = userInfo.profile.real_name || '';
            if (realName) {
              const isNewUser = !existingUserIds.has(userId);
              
              userMappings.push({
                realName,
                slackTag: `@${userInfo.name}`,
                userId,
                addedOn: isNewUser ? today : this.findAddedOnDate(existingMappings, userId)
              });
            }
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
        }
      }

      this.storeMappings(userMappings);
      
      return userMappings;
    } catch (error) {
      console.error('Error mapping user tags to IDs:', error);
      throw error;
    }
  }
  
  private storeMappings(mappings: UserMapping[]): void {
    try {
      localStorage.setItem('slack_user_mappings', JSON.stringify(mappings));
    } catch (e) {
      console.error('Failed to store mappings:', e);
    }
  }
  
  private getStoredMappings(): UserMapping[] {
    try {
      const stored = localStorage.getItem('slack_user_mappings');
      return stored ? JSON.parse(stored) : [];
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
  
  private getMockUserMappings(): UserMapping[] {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const existingMappings = this.getStoredMappings();
    const existingUserIds = new Map(existingMappings.map(m => [m.userId, m.addedOn]));
    
    const mockMappings = [
      { realName: 'John Doe', slackTag: '@johndoe', userId: 'U01' },
      { realName: 'Jane Smith', slackTag: '@janesmith', userId: 'U02' },
      { realName: 'Alex Johnson', slackTag: '@alexj', userId: 'U03' },
      { realName: 'Sarah Williams', slackTag: '@sarahw', userId: 'U04' },
      { realName: 'Michael Brown', slackTag: '@mikeb', userId: 'U05' },
      { realName: 'Emily Davis', slackTag: '@emilyd', userId: 'U06' },
      { realName: 'David Miller', slackTag: '@davidm', userId: 'U07' },
      { realName: 'Jessica Wilson', slackTag: '@jessw', userId: 'U08' },
      { realName: 'Chris Taylor', slackTag: '@christ', userId: 'U09' },
      { realName: 'Anna Martinez', slackTag: '@annam', userId: 'U10' }
    ].map(mapping => {
      const existingDate = existingUserIds.get(mapping.userId);
      const addedOn = existingDate || (Math.random() > 0.7 ? today : yesterday);
      
      return {
        ...mapping,
        addedOn
      };
    });
    
    this.storeMappings(mockMappings);
    
    return mockMappings;
  }
}
