
import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplyButton from '../ApplyButton';
import { useConfig } from '../../context/ConfigContext';

interface JenkinsfileSetupProps {
  goToNextStep: () => void;
}

// Full Jenkins pipeline template with variables that can be replaced
const defaultJenkinsfile = `pipeline {
  agent any
  
  environment {
    DOCKER_USERNAME = 'DOCKER_USERNAME'
    IMAGE_NAME = 'go-microservice'
    IMAGE_TAG = "\${BUILD_NUMBER}"
    KUBECONFIG = credentials('kubeconfig')
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
        withCredentials([string(credentialsId: 'docker-credentials', variable: 'DOCKER_PASSWORD')]) {
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

const JenkinsfileSetup: React.FC<JenkinsfileSetupProps> = ({ goToNextStep }) => {
  const { applyConfig, getConfig } = useConfig();
  const savedConfig = getConfig('jenkinsfile');
  
  const [jenkinsfile, setJenkinsfile] = useState(savedConfig.jenkinsfile || defaultJenkinsfile);
  const [vars, setVars] = useState(savedConfig.vars || {
    dockerUsername: 'DOCKER_USERNAME',
    imageName: 'go-microservice',
    kubeConfigId: 'kubeconfig',
    dockerCredentialsId: 'docker-credentials'
  });
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Update the hasUnsavedChanges flag whenever any state changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [jenkinsfile, vars]);

  const handleVarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVars(prev => ({ ...prev, [name]: value }));
    
    // Update the Jenkinsfile content with the new variable values
    let updatedJenkinsfile = defaultJenkinsfile;
    if (name === 'dockerUsername') {
      updatedJenkinsfile = updatedJenkinsfile.replace('DOCKER_USERNAME', value);
    } else if (name === 'imageName') {
      updatedJenkinsfile = updatedJenkinsfile.replace(/IMAGE_NAME = 'go-microservice'/g, `IMAGE_NAME = '${value}'`);
      updatedJenkinsfile = updatedJenkinsfile.replace(/deployment\/go-microservice/g, `deployment/${value}`);
    } else if (name === 'kubeConfigId') {
      updatedJenkinsfile = updatedJenkinsfile.replace(/credentials\('kubeconfig'\)/g, `credentials('${value}')`);
    } else if (name === 'dockerCredentialsId') {
      updatedJenkinsfile = updatedJenkinsfile.replace(/credentials\('docker-credentials'\)/g, `credentials('${value}')`);
    }
    
    setJenkinsfile(updatedJenkinsfile);
  };

  const handleApplyChanges = () => {
    const currentConfig = {
      jenkinsfile,
      vars
    };
    
    applyConfig('jenkinsfile', currentConfig);
    setHasUnsavedChanges(false);
  };
  
  const handleNextStep = () => {
    // Apply changes if there are unsaved changes before moving to next step
    if (hasUnsavedChanges) {
      handleApplyChanges();
    }
    goToNextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jenkinsfile Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Jenkins pipeline stages and settings
        </p>
      </div>
      
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
          <TabsTrigger value="editor">Jenkinsfile Editor</TabsTrigger>
          <TabsTrigger value="variables">Pipeline Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="mt-4">
          <CodeEditor
            title="Jenkinsfile"
            language="groovy"
            code={jenkinsfile}
            onCodeChange={setJenkinsfile}
          />
        </TabsContent>
        
        <TabsContent value="variables" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Docker Configuration</CardTitle>
              <CardDescription>
                Configure Docker image settings for your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dockerUsername">Docker Registry Username</Label>
                  <Input 
                    id="dockerUsername" 
                    name="dockerUsername"
                    value={vars.dockerUsername}
                    onChange={handleVarChange}
                    placeholder="yourusername"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Docker Hub or private registry username
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="imageName">Image Name</Label>
                  <Input 
                    id="imageName" 
                    name="imageName"
                    value={vars.imageName}
                    onChange={handleVarChange}
                    placeholder="go-microservice"
                  />
                  <p className="text-xs text-muted-foreground">
                    The name of the Docker image to build
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Jenkins Credentials</CardTitle>
              <CardDescription>
                Configure credentials IDs used in the Jenkins pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dockerCredentialsId">Docker Credentials ID</Label>
                  <Input 
                    id="dockerCredentialsId" 
                    name="dockerCredentialsId"
                    value={vars.dockerCredentialsId}
                    onChange={handleVarChange}
                    placeholder="docker-credentials"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jenkins credential ID for Docker registry authentication
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="kubeConfigId">Kubernetes Config ID</Label>
                  <Input 
                    id="kubeConfigId" 
                    name="kubeConfigId"
                    value={vars.kubeConfigId}
                    onChange={handleVarChange}
                    placeholder="kubeconfig"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jenkins credential ID for Kubernetes authentication
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mb-4">
        <ApplyButton onApply={handleApplyChanges} hasChanges={hasUnsavedChanges} />
      </div>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleNextStep}>
          Continue to Dockerfile
        </Button>
      </div>
    </div>
  );
};

export default JenkinsfileSetup;
