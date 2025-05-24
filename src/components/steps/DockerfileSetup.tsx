import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApplyButton from '../ApplyButton';
import { useConfig } from '../../context/ConfigContext';

interface DockerfileSetupProps {
  goToNextStep: () => void;
}

const defaultDockerfile = `# Build stage
FROM golang:1.18-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Final stage
FROM alpine:3.16

WORKDIR /app

# Install runtime dependencies
RUN apk --no-cache add ca-certificates

# Copy binary from build stage
COPY --from=builder /app/main .

# Copy configuration files
COPY --from=builder /app/config/config.yaml ./config/

# Expose the application port
EXPOSE 8080

# Set the entry point
CMD ["./main"]`;

const DockerfileSetup: React.FC<DockerfileSetupProps> = ({ goToNextStep }) => {
  const { applyConfig, getConfig } = useConfig();
  const savedConfig = getConfig('dockerfile');
  
  const [dockerfile, setDockerfile] = useState(savedConfig.dockerfile || defaultDockerfile);
  const [vars, setVars] = useState(savedConfig.vars || {
    goVersion: '1.18-alpine',
    baseImage: 'alpine:3.16',
    port: '8080',
    mainPath: './cmd/api'
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [dockerfile, vars]);
  
  const handleVarChange = (name: string, value: string) => {
    setVars(prev => ({ ...prev, [name]: value }));
    
    let updatedDockerfile = defaultDockerfile;
    if (name === 'goVersion') {
      updatedDockerfile = updatedDockerfile.replace(/golang:1.18-alpine/g, `golang:${value}`);
    } else if (name === 'baseImage') {
      updatedDockerfile = updatedDockerfile.replace(/alpine:3.16/g, value);
    } else if (name === 'port') {
      updatedDockerfile = updatedDockerfile.replace(/EXPOSE 8080/g, `EXPOSE ${value}`);
    } else if (name === 'mainPath') {
      updatedDockerfile = updatedDockerfile.replace(/\.\/cmd\/api/g, value);
    }
    
    setDockerfile(updatedDockerfile);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleVarChange(name, value);
  };
  
  const handleApplyChanges = () => {
    const currentConfig = {
      dockerfile,
      vars
    };
    
    applyConfig('dockerfile', currentConfig);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dockerfile Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure the Dockerfile to containerize your application
        </p>
      </div>
      
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
          <TabsTrigger value="editor">Dockerfile Editor</TabsTrigger>
          <TabsTrigger value="settings">Docker Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="mt-4">
          <CodeEditor
            title="Dockerfile"
            language="dockerfile"
            code={dockerfile}
            onCodeChange={setDockerfile}
          />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Configuration</CardTitle>
              <CardDescription>
                Configure the build environment for your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="goVersion">Go Version</Label>
                  <Select 
                    value={vars.goVersion} 
                    onValueChange={(value) => handleVarChange('goVersion', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Go version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.18-alpine">Go 1.18 (Alpine)</SelectItem>
                      <SelectItem value="1.19-alpine">Go 1.19 (Alpine)</SelectItem>
                      <SelectItem value="1.20-alpine">Go 1.20 (Alpine)</SelectItem>
                      <SelectItem value="1.21-alpine">Go 1.21 (Alpine)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The Go version used in the build environment
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="mainPath">Main Path</Label>
                  <Input 
                    id="mainPath" 
                    name="mainPath"
                    value={vars.mainPath}
                    onChange={handleInputChange}
                    placeholder="./cmd/api"
                  />
                  <p className="text-xs text-muted-foreground">
                    The path to your application's main package
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Runtime Configuration</CardTitle>
              <CardDescription>
                Configure the runtime environment for your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="baseImage">Base Image</Label>
                  <Select 
                    value={vars.baseImage} 
                    onValueChange={(value) => handleVarChange('baseImage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base image" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alpine:3.16">Alpine 3.16</SelectItem>
                      <SelectItem value="alpine:3.17">Alpine 3.17</SelectItem>
                      <SelectItem value="alpine:3.18">Alpine 3.18</SelectItem>
                      <SelectItem value="distroless/static:nonroot">Distroless (Static)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The base image for the runtime container
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="port">Exposed Port</Label>
                  <Input 
                    id="port" 
                    name="port"
                    value={vars.port}
                    onChange={handleInputChange}
                    placeholder="8080"
                  />
                  <p className="text-xs text-muted-foreground">
                    The port exposed by the container
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
          Continue to Kubernetes Manifests
        </Button>
      </div>
    </div>
  );
};

export default DockerfileSetup;
