import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlackService, UserMapping } from '@/services/slackService';
import { Loader2, Download, Check, HelpCircle, UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProxyNotification from './ProxyNotification';
import SendMessageButton from './SendMessageButton';

const SlackIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserMapping[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv'|'text'>('csv');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all'|'new'>('all');
  const [slackService, setSlackService] = useState<SlackService | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const newUsers = users.filter(user => user.addedOn === today);

  useEffect(() => {
    const loadExistingMappings = async () => {
      try {
        const response = await fetch('/api/mappings');
        if (response.ok) {
          const data = await response.json();
          if (data.mappings && data.mappings.length > 0) {
            setUsers(data.mappings);
            const service = new SlackService();
            setSlackService(service);
          }
        }
      } catch (error) {
        console.error('Error loading existing mappings:', error);
      }
    };

    loadExistingMappings();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const service = new SlackService();
      setSlackService(service);
      const userMappings = await service.mapUserTagsToIds();
      setUsers(userMappings);
      
      const newUsersCount = userMappings.filter(user => user.addedOn === today).length;
      
      toast({
        title: "Success!",
        description: `Retrieved ${userMappings.length} users from the Slack channel. ${newUsersCount} new users added today.`,
      });
      
      if (newUsersCount > 0) {
        setActiveTab('new');
      }
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

    const usersToExport = activeTab === 'new' ? newUsers : users;
    
    let content = '';
    const filename = `slack-user-mappings-${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'csv') {
      content = 'Full Name,Slack Tag,Added On\n';
      content += usersToExport.map(user => 
        `"${user.realName}","${user.slackTag}","${user.addedOn || 'N/A'}"`
      ).join('\n');
      downloadFile(`${filename}.csv`, content, 'text/csv');
    } else {
      content = usersToExport.map(user => 
        `${user.realName} / ${user.slackTag} (Added: ${user.addedOn || 'N/A'})`
      ).join('\n');
      downloadFile(`${filename}.txt`, content, 'text/plain');
    }

    toast({
      title: "Export complete",
      description: `Successfully exported ${usersToExport.length} user mappings`,
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
          <ProxyNotification />
          
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Configuration Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              Please ensure you have set up your .env file with SLACK_BOT_TOKEN and SLACK_CHANNEL_ID.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching Users...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Fetch Users
                </>
              )}
            </Button>
          </div>

          {users.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">User Mappings</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">CSV</span>
                    <input 
                      type="radio" 
                      className="h-4 w-4" 
                      checked={exportFormat === 'csv'} 
                      onChange={() => setExportFormat('csv')}
                    />
                    <span className="text-sm ml-2">Text</span>
                    <input 
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
              
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all'|'new')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Users</TabsTrigger>
                  <TabsTrigger value="new">New Today</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Slack Tag</TableHead>
                          <TableHead>Added On</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.userId}>
                            <TableCell>{user.realName}</TableCell>
                            <TableCell>{user.slackTag}</TableCell>
                            <TableCell>{user.addedOn || 'N/A'}</TableCell>
                            <TableCell>
                              <SendMessageButton 
                                userId={user.userId} 
                                slackService={slackService} 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="new">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Slack Tag</TableHead>
                          <TableHead>Added On</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newUsers.map((user) => (
                          <TableRow key={user.userId}>
                            <TableCell>{user.realName}</TableCell>
                            <TableCell>{user.slackTag}</TableCell>
                            <TableCell>{user.addedOn || 'N/A'}</TableCell>
                            <TableCell>
                              <SendMessageButton 
                                userId={user.userId} 
                                slackService={slackService} 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlackIntegration;
