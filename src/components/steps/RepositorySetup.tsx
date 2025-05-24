
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Github, GitMerge } from "lucide-react";

interface RepositorySetupProps {
  goToNextStep: () => void;
}

const RepositorySetup: React.FC<RepositorySetupProps> = ({ goToNextStep }) => {
  const [repoConfig, setRepoConfig] = useState({
    repoUrl: 'https://github.com/yourusername/go-microservice.git',
    branch: 'main',
    credentials: 'jenkins-git-credentials',
    jenkinsUrl: 'http://jenkins.example.com:8080',
    jenkinsCredentials: 'jenkins-admin-credentials'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRepoConfig(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Repository Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure your source code repository and Jenkins connection
        </p>
      </div>

      <Tabs defaultValue="repository" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
          <TabsTrigger value="repository" className="flex items-center gap-2">
            <Github size={16} />
            Git Repository
          </TabsTrigger>
          <TabsTrigger value="jenkins" className="flex items-center gap-2">
            <GitBranch size={16} />
            Jenkins Connection
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="repository" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Git Repository Settings</CardTitle>
              <CardDescription>
                Configure where your code is stored and which branch to build from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="repoUrl">Repository URL</Label>
                <Input 
                  id="repoUrl" 
                  name="repoUrl"
                  value={repoConfig.repoUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username/repo.git"
                />
                <p className="text-xs text-muted-foreground">
                  The Git repository URL where your source code is stored
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <div className="flex items-center gap-2">
                    <GitMerge size={16} className="text-muted-foreground" />
                    <Input 
                      id="branch" 
                      name="branch"
                      value={repoConfig.branch}
                      onChange={handleChange}
                      placeholder="main"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The branch to build from (e.g., main, develop)
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="credentials">Git Credentials ID</Label>
                  <Input 
                    id="credentials" 
                    name="credentials"
                    value={repoConfig.credentials}
                    onChange={handleChange}
                    placeholder="jenkins-git-credentials"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jenkins credential ID for Git authentication
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="jenkins" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Jenkins Connection Settings</CardTitle>
              <CardDescription>
                Configure your Jenkins server connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="jenkinsUrl">Jenkins URL</Label>
                <Input 
                  id="jenkinsUrl" 
                  name="jenkinsUrl"
                  value={repoConfig.jenkinsUrl}
                  onChange={handleChange}
                  placeholder="http://jenkins.example.com:8080"
                />
                <p className="text-xs text-muted-foreground">
                  The URL where your Jenkins server is accessible
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="jenkinsCredentials">Jenkins Credentials ID</Label>
                <Input 
                  id="jenkinsCredentials" 
                  name="jenkinsCredentials"
                  value={repoConfig.jenkinsCredentials}
                  onChange={handleChange}
                  placeholder="jenkins-admin-credentials"
                />
                <p className="text-xs text-muted-foreground">
                  Jenkins credential ID for Jenkins API authentication
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button onClick={goToNextStep}>
          Continue to Jenkinsfile
        </Button>
      </div>
    </div>
  );
};

export default RepositorySetup;
