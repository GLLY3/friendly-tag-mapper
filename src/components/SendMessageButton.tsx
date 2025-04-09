import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SlackService } from '@/services/slackService';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import MessageEditor from './MessageEditor';

interface SendMessageButtonProps {
  userId: string;
  slackService: SlackService | null;
  userName?: string;
}

const DEFAULT_MESSAGE = `🎉*Welcome to the Spring 25 Slack Workspace!* ✨\n\n
We hope you're doing well! We're excited to officially welcome you to the *Antler Spring 2025* residency. Hopefully, you're just as thrilled as we are to have you on board!\n\n
Before we kick things off, there are a few quick onboarding tasks to complete. Please head to your Slack settings and:
   • Set your status to the correct location: 🐻 Berlin, 🥨 Munich, or 🚲 Amsterdam
   • Set your *title* to *Founder + Location*, e.g. Founder Berlin
   • Upload a *profile picture*
   • Add your *Mail address and phone number* to your profile\n\n
🎥 *Next Step*: Introduce yourself to your fellow residency founders and the Antler team in the <#C08D7RV5MEC> channel. Please send a *30-60 seconds self-recorded video* of yourself with the following information:
   • A short personal introduction on who you are
   • Two sentences about your career and expertise
   • Why are you at Antler — Do you have a specific idea, or are you actively exploring?
   • What ideas excite you?
Please also *add your residency location, and your LinkedIn link!*\n\n
☀️*Finish your onboarding tasks:*
   • *Google Calendar * - Stay up to date by subscribing to our <https://calendar.google.com/calendar/u/0?cid=Y180MTkwOWMyNGMyNTA3ZmJiN2NmOTkzZThiZjNjZTNlYzA2MzU3NjRiZDRiNDRmYTkzZmMxOTVmNWU4YjMwMWZlQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20|Google Calendar> — Stay up to date!
   • *Onboarding Form* - Please fill in the <https://docs.google.com/forms/d/e/1FAIpQLSe-pu0zmiAF1zzbMJ1S1j7GwqLQGDR_KWcs2PDExFXjuhlQEg/viewform?usp=pp_url|Onboarding Form> — ASAP
   • *Antler Hub* - Please complete your profile registration on the Antler Hub
   • *Intro Slide* - Please send your <https://docs.google.com/presentation/d/1ziVObhGI9RhrSC9qLT7_VkX6FufdPT6kTDcq5WCTGk8/edit?usp=sharing|intro slide> (this is atemplate — make a copy!) - with this slide you will shortly introduce yourself on the first day.
      Please upload your intro slide using <https://docs.google.com/forms/d/e/1FAIpQLSfxj8CcRcwucBKX2W8hwlf3c_MttUexTIQFpUT_Joh9dX4Awg/viewform?usp=header|this form>\n\n
Please contact <@gleb.lialine> (gleb.lialine@antler.co) if you have any questions!\n\n\n
We're super excited to get to know you and can't wait to see what you'll build! 💡🔥`;

const SendMessageButton: React.FC<SendMessageButtonProps> = ({ userId, slackService, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string) => {
    if (!slackService) return;

    setIsSending(true);
    try {
      await slackService.sendDirectMessage(userId, message);
      setIsOpen(false);
      
      toast({
        title: "Message sent",
        description: `Successfully sent message to ${userName || ''}`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 p-0"
        title={`Send message to ${userName || ''}`}
        disabled={!slackService}
      >
        <MessageSquare className="h-4 w-4 text-primary hover:text-primary/80 transition-colors" />
        <span className="sr-only">Send message</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Send Message to {userName || ''}
            </DialogTitle>
          </DialogHeader>
            
          <MessageEditor 
            defaultMessage={DEFAULT_MESSAGE}
            onSend={handleSendMessage}
            isLoading={isSending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SendMessageButton;
