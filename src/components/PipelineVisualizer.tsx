
import React from 'react';
import { Check, GitBranch, Package, Layers, Server, BarChart, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineVisualizerProps {
  className?: string;
  activeStage?: number;
}

const stages = [
  { name: 'Code Checkout', icon: GitBranch, description: 'Clone repository from git' },
  { name: 'Unit Testing', icon: Check, description: 'Run automated tests' },
  { name: 'Docker Build', icon: Package, description: 'Build container image' },
  { name: 'Push to Registry', icon: Layers, description: 'Push to Docker Hub' },
  { name: 'Deploy to K8s', icon: Server, description: 'Deploy to Kubernetes' },
  { name: 'Monitor', icon: BarChart, description: 'Prometheus monitoring' },
];

const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ 
  className,
  activeStage = -1 
}) => {
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="relative">
        {/* Pipeline path */}
        <div className="absolute top-10 left-0 w-full h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: activeStage >= 0 ? `${Math.min(100, (activeStage / (stages.length - 1)) * 100)}%` : '0%' }}
          />
        </div>
        
        {/* Pipeline flow line with animation */}
        <svg className="absolute top-9 left-0 w-full h-3 overflow-visible">
          <line 
            x1="0%" 
            y1="50%" 
            x2="100%" 
            y2="50%" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeDasharray="10 5" 
            className="text-primary/30 pipeline-connection animate-flow"
          />
        </svg>
        
        {/* Stages */}
        <div className="flex justify-between relative z-10">
          {stages.map((stage, index) => {
            const isActive = index <= activeStage;
            const isCurrentStage = index === activeStage;
            
            return (
              <div key={index} className="flex flex-col items-center">
                {/* Node */}
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground",
                    "hover:scale-110 hover:shadow-md transition-transform cursor-pointer"
                  )}
                >
                  <stage.icon size={16} />
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center">
                  <div className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {stage.name}
                  </div>
                  <div className="text-xs mt-1 max-w-[80px] text-muted-foreground">
                    {stage.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-4 gap-6">
        <div className="p-4 border rounded-md shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:border-primary cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="text-primary w-5 h-5" />
            <h3 className="font-medium">Source Control</h3>
          </div>
          <p className="text-xs text-muted-foreground">Git repository management with automated pipelines</p>
        </div>
        
        <div className="p-4 border rounded-md shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:border-primary cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-primary w-5 h-5" />
            <h3 className="font-medium">Containerization</h3>
          </div>
          <p className="text-xs text-muted-foreground">Docker image build and management</p>
        </div>
        
        <div className="p-4 border rounded-md shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:border-primary cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <Server className="text-primary w-5 h-5" />
            <h3 className="font-medium">K8s Deployment</h3>
          </div>
          <p className="text-xs text-muted-foreground">Orchestration with Kubernetes</p>
        </div>
        
        <div className="p-4 border rounded-md shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:border-primary cursor-pointer">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="text-primary w-5 h-5" />
            <h3 className="font-medium">Monitoring</h3>
          </div>
          <p className="text-xs text-muted-foreground">Metrics and alerts with Prometheus</p>
        </div>
      </div>
    </div>
  );
};

export default PipelineVisualizer;
