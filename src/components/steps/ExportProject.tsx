import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Circle, 
  Download, 
  FileCode, 
  FileJson, 
  GitBranch, 
  Package, 
  Server,
  FileDown
} from "lucide-react";
import PipelineVisualizer from '../PipelineVisualizer';
import { useToast } from "@/components/ui/use-toast";
import { useConfig } from '../../context/ConfigContext';

interface ExportProjectProps {
  goToNextStep: () => void;
}

interface FileItem {
  name: string;
  path: string;
  size: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'config' | 'code' | 'manifest';
  content: string; // Added content for download
}

const ExportProject: React.FC<ExportProjectProps> = ({ goToNextStep }) => {
  const { toast } = useToast();
  const [activeStage, setActiveStage] = useState(5);
  const { configs } = useConfig();
  
  const generateSampleContent = (name: string, type: string): string => {
    const buildNumber = Math.floor(Math.random() * 1000) + 1;
    
    if (name === 'Jenkinsfile') {
      if (configs.jenkinsfile && configs.jenkinsfile.jenkinsfile) {
        return configs.jenkinsfile.jenkinsfile;
      }
      
      return `pipeline {
  agent any
  
  environment {
    DOCKER_USERNAME = '${configs.jenkinsfile?.vars?.dockerUsername || 'DOCKER_USERNAME'}'
    IMAGE_NAME = '${configs.jenkinsfile?.vars?.imageName || 'go-microservice'}'
    IMAGE_TAG = "${buildNumber}"
    KUBECONFIG = credentials('${configs.jenkinsfile?.vars?.kubeConfigId || 'kubeconfig'}')
  }
  
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    
    stage('Build') {
      steps {
        sh 'go build -o app'
        sh 'go test ./...'
      }
    }
    
    stage('Docker Build') {
      steps {
        withCredentials([string(credentialsId: '${configs.jenkinsfile?.vars?.dockerCredentialsId || 'docker-credentials'}', variable: 'DOCKER_PASSWORD')]) {
          sh "docker login -u $DOCKER_USERNAME -p \${DOCKER_PASSWORD}"
          sh "docker build -t $DOCKER_USERNAME/$IMAGE_NAME:\${IMAGE_TAG} ."
          sh "docker push $DOCKER_USERNAME/$IMAGE_NAME:\${IMAGE_TAG}"
        }
      }
    }
    
    stage('Deploy to Kubernetes') {
      steps {
        sh "envsubst < k8s/deployment.yaml | kubectl apply -f -"
        sh "kubectl apply -f k8s/service.yaml"
        sh "kubectl apply -f k8s/configmap.yaml"
        sh "kubectl rollout status deployment/$IMAGE_NAME"
      }
    }
    
    stage('Health Check') {
      steps {
        sh 'sleep 10' // Wait for deployment to stabilize
        sh 'curl -f \$(kubectl get svc $IMAGE_NAME -o jsonpath="{.status.loadBalancer.ingress[0].ip}")/health || exit 1'
      }
    }
    
    stage('Setup Monitoring') {
      steps {
        sh "kubectl apply -f k8s/prometheus.yaml"
        sh "kubectl apply -f k8s/grafana.yaml"
      }
    }
  }
  
  post {
    success {
      echo 'Pipeline completed successfully!'
    }
    failure {
      echo 'Pipeline failed!'
    }
  }
}`;
    } else if (name === 'Dockerfile') {
      if (configs.dockerfile && configs.dockerfile.dockerfile) {
        return configs.dockerfile.dockerfile;
      }
      
      return `FROM golang:1.18-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o app

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/app .
COPY --from=builder /app/config ./config

EXPOSE 8080
CMD ["./app"]`;
    } else if (type === 'manifest') {
      if (name === 'deployment.yaml') {
        return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${configs.jenkinsfile?.vars?.imageName || 'example-deployment'}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${configs.jenkinsfile?.vars?.imageName || 'example'}
  template:
    metadata:
      labels:
        app: ${configs.jenkinsfile?.vars?.imageName || 'example'}
    spec:
      containers:
      - name: ${configs.jenkinsfile?.vars?.imageName || 'example'}
        image: ${configs.jenkinsfile?.vars?.dockerUsername || 'username'}/${configs.jenkinsfile?.vars?.imageName || 'example'}:${buildNumber}
        ports:
        - containerPort: 8080`;
      }
      
      return `apiVersion: apps/v1
kind: ${name.split('.')[0].charAt(0).toUpperCase() + name.split('.')[0].slice(1)}
metadata:
  name: example-${name.split('.')[0]}
spec:
  # Sample configuration for ${name}
  selector:
    app: example
  ports:
  - port: 80
    targetPort: 8080`;
    }
    
    return `# ${name}\n\nThis is a sample content for ${name}`;
  };
  
  const files: FileItem[] = [
    { name: 'Jenkinsfile', path: '/Jenkinsfile', size: '2.3 KB', icon: GitBranch, type: 'config', content: generateSampleContent('Jenkinsfile', 'config') },
    { name: 'Dockerfile', path: '/Dockerfile', size: '0.7 KB', icon: Package, type: 'config', content: generateSampleContent('Dockerfile', 'config') },
    { name: 'deployment.yaml', path: '/k8s/deployment.yaml', size: '1.2 KB', icon: Server, type: 'manifest', content: generateSampleContent('deployment.yaml', 'manifest') },
    { name: 'service.yaml', path: '/k8s/service.yaml', size: '0.5 KB', icon: Server, type: 'manifest', content: generateSampleContent('service.yaml', 'manifest') },
    { name: 'redis.yaml', path: '/k8s/redis.yaml', size: '0.9 KB', icon: Server, type: 'manifest', content: generateSampleContent('redis.yaml', 'manifest') },
    { name: 'configmap.yaml', path: '/k8s/configmap.yaml', size: '0.4 KB', icon: FileCode, type: 'manifest', content: generateSampleContent('configmap.yaml', 'manifest') },
    { name: 'prometheus.yaml', path: '/k8s/prometheus.yaml', size: '2.1 KB', icon: FileCode, type: 'manifest', content: generateSampleContent('prometheus.yaml', 'manifest') },
    { name: 'grafana.yaml', path: '/k8s/grafana.yaml', size: '0.8 KB', icon: FileCode, type: 'manifest', content: generateSampleContent('grafana.yaml', 'manifest') },
    { name: 'dashboard.json', path: '/k8s/dashboard.json', size: '4.7 KB', icon: FileJson, type: 'manifest', content: generateSampleContent('dashboard.json', 'manifest') },
    { name: '.env.sample', path: '/.env.sample', size: '0.3 KB', icon: FileCode, type: 'config', content: generateSampleContent('.env.sample', 'config') },
    { name: 'README.md', path: '/README.md', size: '1.5 KB', icon: FileCode, type: 'config', content: generateSampleContent('README.md', 'config') },
    { name: 'DOCUMENTATION.md', path: '/DOCUMENTATION.md', size: '2.2 KB', icon: FileCode, type: 'config', content: generateSampleContent('DOCUMENTATION.md', 'config') },
  ];
  
  const downloadFile = (file: FileItem) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: `File Downloaded`,
      description: `${file.name} has been downloaded successfully.`,
    });
  };
  
  const handleExport = () => {
    toast({
      title: "Export Initiated",
      description: "Your configuration files will be downloaded shortly.",
    });
    
    setTimeout(() => {
      files.forEach((file, index) => {
        setTimeout(() => {
          downloadFile(file);
        }, index * 300);
      });
      
      setTimeout(() => {
        toast({
          title: "Export Complete",
          description: "All files have been successfully exported.",
        });
      }, files.length * 300 + 500);
    }, 1000);
  };
  
  const handleSingleExport = (file: FileItem) => {
    toast({
      title: `Exporting ${file.name}`,
      description: `${file.name} will be downloaded shortly.`,
    });
    
    downloadFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileDown className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Export Project</h1>
      </div>
      <p className="text-muted-foreground mt-2">
        Export your CI/CD pipeline configuration files
      </p>
      
      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle>CI/CD Pipeline Overview</CardTitle>
          <CardDescription>
            A visualization of your complete Jenkins pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineVisualizer activeStage={activeStage} />
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Summary</CardTitle>
            <CardDescription>Key components of your CI/CD setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span>Jenkins Pipeline Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span>Docker Containerization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span>Kubernetes Deployment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span>Redis Database Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span>Prometheus & Grafana Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="text-gray-300 w-4 h-4" />
              <span className="text-muted-foreground">CI/CD History Tracking</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Project Files</CardTitle>
            <CardDescription>Generated configuration files for your CI/CD pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Files</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="manifest">Manifests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4 space-y-4">
                <div className="border rounded-md divide-y">
                  {files.map((file) => (
                    <div key={file.path} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <file.icon className="text-primary w-[18px] h-[18px]" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSingleExport(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="config" className="mt-4 space-y-4">
                <div className="border rounded-md divide-y">
                  {files.filter(f => f.type === 'config').map((file) => (
                    <div key={file.path} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <file.icon className="text-primary w-[18px] h-[18px]" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSingleExport(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="manifest" className="mt-4 space-y-4">
                <div className="border rounded-md divide-y">
                  {files.filter(f => f.type === 'manifest').map((file) => (
                    <div key={file.path} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <file.icon className="text-primary w-[18px] h-[18px]" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSingleExport(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center mt-8">
        <Button 
          onClick={handleExport} 
          size="lg" 
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export All Configuration Files
        </Button>
      </div>
    </div>
  );
};

export default ExportProject;
