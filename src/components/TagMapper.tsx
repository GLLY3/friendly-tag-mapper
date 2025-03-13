
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { ChevronRight, Download, Plus, Trash2, FileText, Table2 } from "lucide-react";

interface TagPair {
  id: string;
  fullName: string;
  slackTag: string;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const TagMapper: React.FC = () => {
  const [tagPairs, setTagPairs] = useState<TagPair[]>([]);
  const [newFullName, setNewFullName] = useState('');
  const [newSlackTag, setNewSlackTag] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  
  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedPairs = localStorage.getItem('tagPairs');
    if (savedPairs) {
      try {
        setTagPairs(JSON.parse(savedPairs));
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
  }, []);
  
  // Save to localStorage whenever tagPairs changes
  useEffect(() => {
    localStorage.setItem('tagPairs', JSON.stringify(tagPairs));
  }, [tagPairs]);

  const handleAddPair = () => {
    if (!newFullName.trim() || !newSlackTag.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both full name and Slack tag.",
        variant: "destructive",
      });
      return;
    }
    
    const formattedSlackTag = newSlackTag.startsWith('@') ? newSlackTag : `@${newSlackTag}`;
    
    const newPair: TagPair = {
      id: generateId(),
      fullName: newFullName.trim(),
      slackTag: formattedSlackTag,
    };
    
    setTagPairs([...tagPairs, newPair]);
    setNewFullName('');
    setNewSlackTag('');
    
    toast({
      title: "Pair added",
      description: `${newFullName} / ${formattedSlackTag} has been added.`,
    });
  };
  
  const handleRemovePair = (id: string) => {
    setTagPairs(tagPairs.filter(pair => pair.id !== id));
    toast({
      title: "Pair removed",
      description: "The mapping has been removed.",
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPair();
    }
  };
  
  const exportAsText = () => {
    const content = tagPairs
      .map(pair => `${pair.fullName} / ${pair.slackTag}`)
      .join('\n');
      
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slack_tag_mapping.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Your mapping has been exported as a text file.",
    });
  };
  
  const exportAsCSV = () => {
    const headers = ['Full Name', 'Slack Tag'];
    const rows = tagPairs.map(pair => [pair.fullName, pair.slackTag]);
    
    const content = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slack_tag_mapping.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Your mapping has been exported as a CSV file.",
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <Card className="shadow-lg border-opacity-40 overflow-hidden transition-all-300">
        <CardHeader className="bg-secondary/50 border-b">
          <div className="space-y-1">
            <CardTitle className="flex items-center text-2xl font-medium tracking-tight">
              <span className="bg-primary/10 text-primary text-xs uppercase font-semibold tracking-wider px-2 py-1 rounded mr-2">
                Slack
              </span>
              Tag Mapper
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create and manage full name to Slack tag mappings
            </CardDescription>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="editor" className="w-full" onValueChange={setActiveTab}>
          <div className="px-6 pt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor" className="flex items-center justify-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Editor</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center justify-center space-x-2">
                <Table2 className="w-4 h-4" />
                <span>Preview</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="editor" className="mt-0 pt-6 animate-slide-up">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="text-sm font-medium mb-1.5 block text-muted-foreground">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="transition-all-300 focus:translate-y-[-2px]"
                  />
                </div>
                <div>
                  <label htmlFor="slackTag" className="text-sm font-medium mb-1.5 block text-muted-foreground">
                    Slack Tag
                  </label>
                  <Input
                    id="slackTag"
                    placeholder="@johndoe"
                    value={newSlackTag}
                    onChange={(e) => setNewSlackTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="transition-all-300 focus:translate-y-[-2px]"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAddPair} 
                className="w-full group flex items-center justify-center transition-all"
              >
                <Plus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Add Mapping
                <ChevronRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0 pt-6 animate-slide-up">
            <CardContent>
              {tagPairs.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Slack Tag</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tagPairs.map((pair) => (
                        <TableRow key={pair.id} className="transition-all hover:bg-secondary/50">
                          <TableCell className="font-medium">{pair.fullName}</TableCell>
                          <TableCell className="text-primary">{pair.slackTag}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePair(pair.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg bg-muted/30">
                  <div className="rounded-full bg-secondary p-3 mb-3">
                    <Table2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No mappings yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Add some name-tag pairs to see them here.
                  </p>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex justify-between pt-2 pb-6 px-6 border-t bg-secondary/30 mt-6">
          <div className="text-xs text-muted-foreground">
            {tagPairs.length} {tagPairs.length === 1 ? 'mapping' : 'mappings'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsText}
              disabled={tagPairs.length === 0}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              Export as Text
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={exportAsCSV}
              disabled={tagPairs.length === 0}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Export as CSV
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TagMapper;
