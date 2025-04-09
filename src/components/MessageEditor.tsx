
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PenLine, Smile, Eye, Send } from "lucide-react";

interface MessageEditorProps {
  defaultMessage: string;
  onSend: (message: string) => Promise<void>;
  isLoading?: boolean;
}

const MessageEditor: React.FC<MessageEditorProps> = ({ 
  defaultMessage, 
  onSend,
  isLoading = false
}) => {
  const [message, setMessage] = useState(defaultMessage);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const { toast } = useToast();
  
  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message before sending",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onSend(message);
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const formatMessagePreview = (text: string) => {
    const formattedText = text
      .replace(/\n/g, '<br>')
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<strike>$1</strike>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([^```]+)```/g, '<pre>$1</pre>')
      .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/<#([A-Z0-9]+)>/g, '#channel')
      .replace(/<@([A-Z0-9]+)>/g, '@user');
      
    return { __html: formattedText };
  };

  return (
    <Card className="w-full mt-6 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <PenLine className="w-5 h-5 mr-2" />
          Message Editor
        </CardTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center justify-center space-x-2">
              <PenLine className="w-4 h-4" />
              <span>Edit</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center justify-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="edit" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Supports Slack formatting: *bold*, _italic_, ~strikethrough~, `code`, and links like &lt;https://example.com|text&gt;
              </p>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(message);
                    toast({
                      title: "Copied to clipboard",
                      description: "Message has been copied to clipboard",
                    });
                  }}
                >
                  Copy to clipboard
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <div className="border rounded-md p-4 min-h-[300px] bg-white">
              <div 
                className="slack-message-preview text-sm"
                dangerouslySetInnerHTML={formatMessagePreview(message)}
              />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMessage(defaultMessage);
            toast({
              title: "Reset to default",
              description: "Message has been reset to the default template",
            });
          }}
        >
          Reset to default
        </Button>
        <Button 
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="flex items-center"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MessageEditor;
