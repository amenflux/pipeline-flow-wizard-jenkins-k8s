
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Package, Server, BarChart } from "lucide-react";
import PipelineVisualizer from '../PipelineVisualizer';

interface OverviewProps {
  goToNextStep: () => void;
}

const Overview: React.FC<OverviewProps> = ({ goToNextStep }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pipeline Flow Wizard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Design your CI/CD pipeline with Jenkins, Docker, and Kubernetes using this interactive wizard
        </p>
      </div>
      
      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle>CI/CD Pipeline Visualization</CardTitle>
          <CardDescription>
            A complete Jenkins pipeline for building, testing, and deploying your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineVisualizer />
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="text-primary" size={20} />
              Source Control & CI/CD
            </CardTitle>
            <CardDescription>Configure your repository and Jenkins pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Automated code checkout from Git</li>
              <li>Unit and integration testing</li>
              <li>Multi-stage Jenkinsfile</li>
              <li>Build notifications and reporting</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="text-primary" size={20} />
              Containerization
            </CardTitle>
            <CardDescription>Containerize your application with Docker</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Optimized Dockerfile creation</li>
              <li>Multi-stage builds for smaller images</li>
              <li>Automatic image tagging and versioning</li>
              <li>Push to Docker registry</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="text-primary" size={20} />
              Kubernetes Deployment
            </CardTitle>
            <CardDescription>Deploy to Kubernetes clusters</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Kubernetes deployment manifests</li>
              <li>Service and ingress configuration</li>
              <li>ConfigMaps and Secrets management</li>
              <li>Horizontal Pod Autoscaling</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="text-primary" size={20} />
              Monitoring & Metrics
            </CardTitle>
            <CardDescription>Monitor your application with Prometheus and Grafana</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Prometheus for metrics collection</li>
              <li>Grafana dashboards for visualization</li>
              <li>Alert configuration</li>
              <li>Resource usage monitoring</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center mt-8">
        <Button 
          onClick={goToNextStep} 
          size="lg" 
          className="gap-2"
        >
          Get Started
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Overview;
