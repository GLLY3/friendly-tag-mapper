
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
}

interface SlackUserResponse {
  user: SlackUser;
}

export interface UserMapping {
  realName: string;
  slackTag: string;
  userId: string;
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
          throw new Error(`Failed to fetch members: ${response.statusText}`);
        }

        const data = await response.json() as SlackMembersResponse;
        
        if (!data.members) {
          throw new Error('No members found in response');
        }
        
        members = [...members, ...data.members];
        cursor = data.response_metadata?.next_cursor;
      } while (cursor);

      return members;
    } catch (error) {
      console.error('Error retrieving channel members:', error);
      throw error;
    }
  }

  async getUserInfo(userId: string): Promise<SlackUser> {
    try {
      const response = await fetch(`https://slack.com/api/users.info`, {
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
      return data.user;
    } catch (error) {
      console.error(`Error retrieving user info for ${userId}:`, error);
      throw error;
    }
  }

  async mapUserTagsToIds(): Promise<UserMapping[]> {
    try {
      const members = await this.getChannelMembers();
      const userMappings: UserMapping[] = [];

      for (const userId of members) {
        try {
          const userInfo = await this.getUserInfo(userId);
          
          if (userInfo && !userInfo.deleted && !userInfo.is_bot) {
            const realName = userInfo.profile.real_name || '';
            if (realName) {
              userMappings.push({
                realName,
                slackTag: `@${userInfo.name}`,
                userId
              });
            }
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          // Continue with other users
        }
      }

      return userMappings;
    } catch (error) {
      console.error('Error mapping user tags to IDs:', error);
      throw error;
    }
  }
}
