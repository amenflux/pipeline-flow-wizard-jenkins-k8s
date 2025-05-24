import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Cog } from "lucide-react";
import ApplyButton from '../ApplyButton';
import { useConfig } from '../../context/ConfigContext';

interface DeploymentConfigProps {
  goToNextStep: () => void;
}

const defaultEnvSampleFile = `# Jenkins Configuration
JENKINS_URL=http://jenkins.example.com:8080
JENKINS_USER=admin
JENKINS_API_TOKEN=your-api-token

# Docker Registry
DOCKER_REGISTRY_URL=https://index.docker.io/v1/
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-secure-password

# Kubernetes
KUBE_CONFIG_PATH=/path/to/your/kubeconfig
KUBE_NAMESPACE=default
KUBE_CONTEXT=production

# Application
APP_NAME=go-microservice
APP_VERSION=1.0.0
`;

const defaultReadmeFile = `# CI/CD Pipeline with Jenkins, Docker, and Kubernetes

This repository contains the necessary configuration files to set up a complete CI/CD pipeline for a Go microservice using Jenkins, Docker, and Kubernetes.

## Application Overview

This is a Go-based microservice that performs calculations and stores data in Redis. It provides a RESTful API for interacting with the service.

## Technology Stack

- **Go**: Programming language for the application
- **Redis**: For data storage
- **Jenkins**: CI/CD automation
- **Docker**: For containerization
- **Kubernetes**: For container orchestration
- **Prometheus/Grafana**: For monitoring

## Repository Structure

- \`/cmd/api\`: Application code
- \`/k8s\`: Kubernetes manifests
- \`/config\`: Configuration files
- \`Dockerfile\`: Container definition
- \`Jenkinsfile\`: Jenkins pipeline definition

## CI/CD Pipeline

The CI/CD pipeline consists of the following stages:

1. **Code Checkout**: Pull the latest code from the repository
2. **Unit Testing**: Run automated tests
3. **Docker Build**: Build the application container
4. **Push to Registry**: Push the container to Docker Hub
5. **Deploy to Kubernetes**: Deploy the application to Kubernetes
6. **Monitoring**: Set up monitoring with Prometheus and Grafana

## Getting Started

### Prerequisites

- Jenkins server with necessary plugins
- Docker installed on Jenkins agents
- Kubernetes cluster
- Git repository

### Setup Instructions

1. Configure Jenkins credentials for Git, Docker, and Kubernetes
2. Create a Jenkins pipeline job pointing to this repository
3. Set up the required environment variables (see \`.env.sample\`)
4. Run the pipeline

## Configuration

See the \`.env.sample\` file for the required environment variables.

## Monitoring

The application is set up with Prometheus for metrics collection and Grafana for visualization.
`;

const defaultDocumentationFile = `# Pipeline Flow Documentation

## Jenkins Pipeline

The Jenkins pipeline is defined in the Jenkinsfile and consists of several stages:

### 1. Checkout

This stage checks out the code from the Git repository.

\`\`\`groovy
stage('Checkout') {
  steps {
    checkout scm
  }
}
\`\`\`

### 2. Unit Tests

This stage runs the Go unit tests.

\`\`\`groovy
stage('Unit Tests') {
  steps {
    container('golang') {
      sh 'go test -v ./...'
    }
  }
}
\`\`\`

### 3. Build Docker Image

This stage builds the Docker image.

\`\`\`groovy
stage('Build Docker Image') {
  steps {
    container('docker') {
      sh '''
        echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin
        docker build -t $DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG -f $DOCKERFILE_PATH .
      '''
    }
  }
}
\`\`\`

### 4. Push Docker Image

This stage pushes the Docker image to the registry.

\`\`\`groovy
stage('Push Docker Image') {
  steps {
    container('docker') {
      sh 'docker push $DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG'
      sh 'docker tag $DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG $DOCKER_REGISTRY/$IMAGE_NAME:latest'
      sh 'docker push $DOCKER_REGISTRY/$IMAGE_NAME:latest'
    }
  }
}
\`\`\`

### 5. Deploy to Kubernetes

This stage deploys the application to Kubernetes.

\`\`\`groovy
stage('Deploy to Kubernetes') {
  steps {
    container('kubectl') {
      sh '''
        export KUBECONFIG=$KUBECONFIG
        kubectl apply -f k8s/deployment.yaml
        kubectl apply -f k8s/service.yaml
        kubectl apply -f k8s/configmap.yaml
        kubectl set image deployment/go-microservice go-microservice=$DOCKER_REGISTRY/$IMAGE_NAME:$IMAGE_TAG
      '''
    }
  }
}
\`\`\`

## Kubernetes Configuration

The application is deployed to Kubernetes using the following manifests:

- \`deployment.yaml\`: Defines the application deployment
- \`service.yaml\`: Exposes the application
- \`configmap.yaml\`: Contains application configuration
- \`redis.yaml\`: Deploys Redis for data storage

## Docker Configuration

The application is containerized using a multi-stage Dockerfile:

1. Build stage: Compiles the Go application
2. Final stage: Creates a minimal container with just the binary
`;

const DeploymentConfig: React.FC<DeploymentConfigProps> = ({ goToNextStep }) => {
  const { applyConfig, getConfig } = useConfig();
  const savedConfig = getConfig('deploymentConfig');
  
  const [envSampleFile, setEnvSampleFile] = useState(savedConfig.envSampleFile || defaultEnvSampleFile);
  const [readmeFile, setReadmeFile] = useState(savedConfig.readmeFile || defaultReadmeFile);
  const [documentationFile, setDocumentationFile] = useState(savedConfig.documentationFile || defaultDocumentationFile);
  
  const [settings, setSettings] = useState(savedConfig.settings || {
    companyName: 'Your Company',
    projectName: 'Go Microservice CI/CD Pipeline',
    enableSlackNotifications: true,
    slackChannel: '#deployments',
    enableEmailNotifications: false,
    emailRecipients: 'devops@example.com',
    includeGithubWorkflows: true
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [envSampleFile, readmeFile, documentationFile, settings]);
  
  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleApplyChanges = () => {
    const currentConfig = {
      envSampleFile,
      readmeFile,
      documentationFile,
      settings
    };
    
    applyConfig('deploymentConfig', currentConfig);
    setHasUnsavedChanges(false);
  };
  
  const handleNextStep = () => {
    if (hasUnsavedChanges) {
      handleApplyChanges();
    }
    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cog className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Deployment Configuration</h1>
      </div>
      <p className="text-muted-foreground mt-2">
        Configure additional deployment settings and documentation
      </p>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>
            Configure project-wide settings and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                value={settings.companyName}
                onChange={(e) => handleSettingsChange('companyName', e.target.value)}
                placeholder="Your Company"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input 
                id="projectName" 
                value={settings.projectName}
                onChange={(e) => handleSettingsChange('projectName', e.target.value)}
                placeholder="Go Microservice CI/CD Pipeline"
              />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="slack">Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to Slack when pipeline events occur
                  </p>
                </div>
                <Switch 
                  id="slack"
                  checked={settings.enableSlackNotifications}
                  onCheckedChange={(checked) => handleSettingsChange('enableSlackNotifications', checked)}
                />
              </div>
              
              {settings.enableSlackNotifications && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="slackChannel">Slack Channel</Label>
                  <Input 
                    id="slackChannel" 
                    value={settings.slackChannel}
                    onChange={(e) => handleSettingsChange('slackChannel', e.target.value)}
                    placeholder="#deployments"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for pipeline events
                  </p>
                </div>
                <Switch 
                  id="email"
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleSettingsChange('enableEmailNotifications', checked)}
                />
              </div>
              
              {settings.enableEmailNotifications && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="emailRecipients">Email Recipients</Label>
                  <Textarea 
                    id="emailRecipients" 
                    value={settings.emailRecipients}
                    onChange={(e) => handleSettingsChange('emailRecipients', e.target.value)}
                    placeholder="devops@example.com, alerts@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of email addresses
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Additional Features</h3>
            <div className="items-top flex space-x-2">
              <Checkbox
                id="githubWorkflows"
                checked={settings.includeGithubWorkflows} 
                onCheckedChange={(checked) => handleSettingsChange('includeGithubWorkflows', checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="githubWorkflows"
                  className="text-sm font-medium leading-none"
                >
                  Include GitHub Workflows
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add GitHub Actions workflows as an alternative CI/CD option
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mb-4">
        <ApplyButton onApply={handleApplyChanges} hasChanges={hasUnsavedChanges} />
      </div>
      
      <Tabs defaultValue="env" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="env">.env.sample</TabsTrigger>
          <TabsTrigger value="readme">README.md</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="env" className="mt-4">
          <CodeEditor
            title=".env.sample"
            language="ini"
            code={envSampleFile}
            onCodeChange={setEnvSampleFile}
          />
        </TabsContent>
        
        <TabsContent value="readme" className="mt-4">
          <CodeEditor
            title="README.md"
            language="markdown"
            code={readmeFile}
            onCodeChange={setReadmeFile}
          />
        </TabsContent>
        
        <TabsContent value="docs" className="mt-4">
          <CodeEditor
            title="DOCUMENTATION.md"
            language="markdown"
            code={documentationFile}
            onCodeChange={setDocumentationFile}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleNextStep}>
          Continue to Monitoring Setup
        </Button>
      </div>
    </div>
  );
};

export default DeploymentConfig;
