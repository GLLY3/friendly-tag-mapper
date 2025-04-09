
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

const ProxyNotification: React.FC = () => {
  return (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <Terminal className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Express Proxy Server Required</AlertTitle>
      <AlertDescription className="text-blue-700">
        <p>To bypass CORS restrictions, this app requires a proxy server.</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Set your Slack token in the <code>.env</code> file</li>
          <li>Run <code>node server.js</code> in a terminal</li>
          <li>Keep that terminal open while using the app</li>
        </ol>
      </AlertDescription>
    </Alert>
  );
};

export default ProxyNotification;
