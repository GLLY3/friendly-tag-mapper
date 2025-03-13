
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlackService, UserMapping } from '@/services/slackService';
import { Loader2, Download, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const SlackIntegration = () => {
  const [token, setToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserMapping[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv'|'text'>('csv');
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!token || !channelId) {
      toast({
        title: "Missing information",
        description: "Please enter both a Slack token and channel ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const slackService = new SlackService(token, channelId);
      const userMappings = await slackService.mapUserTagsToIds();
      setUsers(userMappings);
      toast({
        title: "Success!",
        description: `Retrieved ${userMappings.length} users from the Slack channel`,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch users from Slack",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (users.length === 0) {
      toast({
        title: "No data to export",
        description: "Please fetch users first",
        variant: "destructive",
      });
      return;
    }

    let content = '';
    const filename = `slack-user-mappings-${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'csv') {
      content = 'Full Name,Slack Tag\n';
      content += users.map(user => `"${user.realName}","${user.slackTag}"`).join('\n');
      downloadFile(`${filename}.csv`, content, 'text/csv');
    } else {
      content = users.map(user => `${user.realName} / ${user.slackTag}`).join('\n');
      downloadFile(`${filename}.txt`, content, 'text/plain');
    }

    toast({
      title: "Export complete",
      description: `Successfully exported ${users.length} user mappings`,
    });
  };

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-md bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">Slack Channel User Mapper</CardTitle>
          <CardDescription>
            Connect to Slack and retrieve users from a channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="token">Slack Bot Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="xoxb-..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your Slack bot token should start with xoxb-. You'll need to create a bot with users:read and conversations:read scopes.
              </p>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="channelId">Channel ID</Label>
              <Input
                id="channelId"
                placeholder="C0123456789"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find the channel ID in the URL when viewing a channel in Slack.
              </p>
            </div>
            <Button 
              onClick={fetchUsers} 
              className="w-full" 
              disabled={loading || !token || !channelId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Users...
                </>
              ) : (
                "Fetch Users from Slack"
              )}
            </Button>
          </div>

          {users.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">User Mappings</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="format-csv" className="cursor-pointer">CSV</Label>
                    <Input 
                      id="format-csv"
                      type="radio" 
                      className="h-4 w-4" 
                      checked={exportFormat === 'csv'} 
                      onChange={() => setExportFormat('csv')}
                    />
                    <Label htmlFor="format-text" className="cursor-pointer ml-2">Text</Label>
                    <Input 
                      id="format-text"
                      type="radio" 
                      className="h-4 w-4"  
                      checked={exportFormat === 'text'} 
                      onChange={() => setExportFormat('text')}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={exportData}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md max-h-96 overflow-auto">
                <Table>
                  <TableCaption>Retrieved {users.length} users from Slack</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Slack Tag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.realName}</TableCell>
                        <TableCell>{user.slackTag}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {users.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {users.length} users
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SlackIntegration;
