
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Code, GitBranch, Database, 
  Box, Cpu, LineChart, Menu, 
  Home, Settings, Download
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SidebarProps {
  className?: string;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

interface StepItem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  id: number;
}

const Sidebar = ({ className, activeStep, setActiveStep }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  const steps: StepItem[] = [
    { icon: Home, name: "Overview", id: 0 },
    { icon: GitBranch, name: "Repository Setup", id: 1 },
    { icon: Code, name: "Jenkinsfile", id: 2 },
    { icon: Box, name: "Dockerfile", id: 3 },
    { icon: Database, name: "Kubernetes Manifests", id: 4 },
    { icon: Cpu, name: "Deployment Config", id: 5 },
    { icon: LineChart, name: "Monitoring Setup", id: 6 },
    { icon: Download, name: "Export Project", id: 7 },
    { icon: Settings, name: "Settings", id: 8 },
  ];

  const handleDownload = () => {
    toast({
      title: "Coming Soon",
      description: "This feature will be available in a future update.",
    });
  };

  return (
    <div className={cn(
      "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Pipeline Wizard</h1>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {steps.map((step) => (
            <Button
              key={step.id}
              variant={activeStep === step.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
                activeStep === step.id && "bg-sidebar-accent"
              )}
              onClick={() => setActiveStep(step.id)}
            >
              <step.icon className="w-5 h-5 mr-2" />
              {!collapsed && <span>{step.name}</span>}
            </Button>
          ))}
        </nav>
      </div>
      
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="outline" 
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Files
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
