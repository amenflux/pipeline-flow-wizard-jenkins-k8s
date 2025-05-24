
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, AlertCircle, FileCode } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  title: string;
  language: string;
  code: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  title,
  language,
  code,
  onCodeChange,
  readOnly = false,
  className
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: `${title} code has been copied to your clipboard.`,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="bg-muted/50 border-b py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode size={18} />
            {title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <pre className={`code-editor text-sm bg-black text-gray-200 p-4 overflow-x-auto h-[300px] max-h-[60vh] overflow-y-auto`}>
          {!readOnly ? (
            <textarea
              className="w-full h-full bg-transparent outline-none resize-none font-mono"
              value={code}
              onChange={(e) => onCodeChange && onCodeChange(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <code className="font-mono">{code}</code>
          )}
        </pre>
      </CardContent>
      {!readOnly && (
        <CardFooter className="bg-muted/50 border-t py-2 px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>Edit this file to customize your configuration.</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default CodeEditor;
