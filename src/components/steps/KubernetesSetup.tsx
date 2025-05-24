import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Database } from "lucide-react";
import ApplyButton from '../ApplyButton';
import { useConfig } from '../../context/ConfigContext';
import { toast } from "@/components/ui/use-toast";

interface KubernetesSetupProps {
  goToNextStep: () => void;
}

const defaultDeploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-microservice
  namespace: default
  labels:
    app: go-microservice
spec:
  replicas: 2
  selector:
    matchLabels:
      app: go-microservice
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: go-microservice
    spec:
      containers:
      - name: go-microservice
        image: DOCKER_USERNAME/go-microservice:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 300m
            memory: 256Mi
        env:
        - name: REDIS_HOST
          value: redis
        - name: REDIS_PORT
          value: "6379"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5`;

const defaultServiceYaml = `apiVersion: v1
kind: Service
metadata:
  name: go-microservice
  namespace: default
  labels:
    app: go-microservice
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: go-microservice`;

const defaultRedisYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: default
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:6.2-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: default
  labels:
    app: redis
spec:
  type: ClusterIP
  ports:
  - port: 6379
    targetPort: 6379
    protocol: TCP
  selector:
    app: redis`;

const defaultConfigMapYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: go-microservice-config
  namespace: default
data:
  config.yaml: |
    server:
      port: 8080
      timeout: 30s
    
    redis:
      host: redis
      port: 6379
      db: 0
    
    logging:
      level: info
      format: json`;

const defaultPersistentVolumeYaml = `apiVersion: v1
kind: PersistentVolume
metadata:
  name: APP_NAME-pv
  namespace: NAMESPACE
  labels:
    app: APP_NAME
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: STORAGE_CLASS
  CLOUD_PROVIDER_SPECIFIC
`;

const defaultPersistentVolumeClaimYaml = `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: APP_NAME-pvc
  namespace: NAMESPACE
  labels:
    app: APP_NAME
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: STORAGE_CLASS
  resources:
    requests:
      storage: 5Gi
`;

const cloudProviderConfigs = {
  aws: `  awsElasticBlockStore:
    volumeID: vol-XXXX # Replace with your EBS volume ID
    fsType: ext4`,
  gcp: `  gcePersistentDisk:
    pdName: DISK_NAME # Replace with your GCP disk name
    fsType: ext4`,
  azure: `  azureDisk:
    diskName: DISK_NAME # Replace with your Azure disk name
    diskURI: https://STORAGE_ACCOUNT.blob.core.windows.net/vhds/DISK_NAME.vhd
    kind: Managed
    fsType: ext4`,
  onprem: `  hostPath:
    path: PATH_VALUE
    type: DirectoryOrCreate`
};

const storageClasses = {
  aws: ['gp2', 'gp3', 'io1', 'io2', 'sc1', 'st1', 'standard'],
  gcp: ['standard', 'premium-rwo', 'balanced', 'ssd'],
  azure: ['default', 'managed-premium', 'managed-csi', 'managed-csi-premium'],
  onprem: ['local-storage', 'nfs', 'local-path', 'custom']
};

const KubernetesSetup: React.FC<KubernetesSetupProps> = ({ goToNextStep }) => {
  const { applyConfig, getConfig } = useConfig();
  const savedConfig = getConfig('kubernetes');
  
  const [deploymentYaml, setDeploymentYaml] = useState(savedConfig.deploymentYaml || defaultDeploymentYaml);
  const [serviceYaml, setServiceYaml] = useState(savedConfig.serviceYaml || defaultServiceYaml);
  const [redisYaml, setRedisYaml] = useState(savedConfig.redisYaml || defaultRedisYaml);
  const [configMapYaml, setConfigMapYaml] = useState(savedConfig.configMapYaml || defaultConfigMapYaml);
  const [persistentVolumeYaml, setPersistentVolumeYaml] = useState(savedConfig.persistentVolumeYaml || defaultPersistentVolumeYaml);
  const [persistentVolumeClaimYaml, setPersistentVolumeClaimYaml] = useState(savedConfig.persistentVolumeClaimYaml || defaultPersistentVolumeClaimYaml);
  
  const [enablePersistence, setEnablePersistence] = useState(savedConfig.enablePersistence || false);
  const [cloudProvider, setCloudProvider] = useState(savedConfig.cloudProvider || 'aws');
  const [storageClass, setStorageClass] = useState(savedConfig.storageClass || storageClasses.aws[0]);
  const [diskSize, setDiskSize] = useState(savedConfig.diskSize || '5');
  const [volumePath, setVolumePath] = useState(savedConfig.volumePath || '/data');
  
  const [vars, setVars] = useState(savedConfig.vars || {
    namespace: 'default',
    replicas: '2',
    serviceType: 'ClusterIP',
    dockerUsername: 'DOCKER_USERNAME',
    appName: 'go-microservice',
    redisVersion: '6.2-alpine'
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [deploymentYaml, serviceYaml, redisYaml, configMapYaml, persistentVolumeYaml, 
      persistentVolumeClaimYaml, enablePersistence, cloudProvider, storageClass, 
      diskSize, volumePath, vars]);
  
  const handleVarChange = (name: string, value: string) => {
    setVars(prev => ({ ...prev, [name]: value }));
    
    let updatedDeploymentYaml = defaultDeploymentYaml.replace(/namespace: default/g, `namespace: ${name === 'namespace' ? value : vars.namespace}`);
    updatedDeploymentYaml = updatedDeploymentYaml.replace(/replicas: 2/g, `replicas: ${name === 'replicas' ? value : vars.replicas}`);
    updatedDeploymentYaml = updatedDeploymentYaml.replace(/DOCKER_USERNAME/g, `${name === 'dockerUsername' ? value : vars.dockerUsername}`);
    updatedDeploymentYaml = updatedDeploymentYaml.replace(/go-microservice/g, `${name === 'appName' ? value : vars.appName}`);
    setDeploymentYaml(updatedDeploymentYaml);
    
    let updatedServiceYaml = defaultServiceYaml.replace(/namespace: default/g, `namespace: ${name === 'namespace' ? value : vars.namespace}`);
    updatedServiceYaml = updatedServiceYaml.replace(/type: ClusterIP/g, `type: ${name === 'serviceType' ? value : vars.serviceType}`);
    updatedServiceYaml = updatedServiceYaml.replace(/go-microservice/g, `${name === 'appName' ? value : vars.appName}`);
    setServiceYaml(updatedServiceYaml);
    
    let updatedRedisYaml = defaultRedisYaml.replace(/namespace: default/g, `namespace: ${name === 'namespace' ? value : vars.namespace}`);
    updatedRedisYaml = updatedRedisYaml.replace(/redis:6.2-alpine/g, `redis:${name === 'redisVersion' ? value : vars.redisVersion}`);
    setRedisYaml(updatedRedisYaml);
    
    let updatedConfigMapYaml = defaultConfigMapYaml.replace(/namespace: default/g, `namespace: ${name === 'namespace' ? value : vars.namespace}`);
    updatedConfigMapYaml = updatedConfigMapYaml.replace(/go-microservice-config/g, `${name === 'appName' ? value : vars.appName}-config`);
    setConfigMapYaml(updatedConfigMapYaml);
    
    updatePersistenceYamls(name === 'namespace' ? value : vars.namespace, name === 'appName' ? value : vars.appName);
  };

  const updatePersistenceYamls = (namespace: string, appName: string) => {
    let cloudConfig = cloudProviderConfigs[cloudProvider as keyof typeof cloudProviderConfigs];
    
    // Update volume path for on-prem deployments
    if (cloudProvider === 'onprem' && volumePath) {
      cloudConfig = cloudConfig.replace(/PATH_VALUE/g, volumePath);
    }
    
    let updatedPV = defaultPersistentVolumeYaml
      .replace(/NAMESPACE/g, namespace)
      .replace(/APP_NAME/g, appName)
      .replace(/STORAGE_CLASS/g, storageClass)
      .replace(/CLOUD_PROVIDER_SPECIFIC/g, cloudConfig)
      .replace(/DISK_NAME/g, `${appName}-disk`);
      
    updatedPV = updatedPV.replace(/storage: 5Gi/g, `storage: ${diskSize}Gi`);
      
    let updatedPVC = defaultPersistentVolumeClaimYaml
      .replace(/NAMESPACE/g, namespace)
      .replace(/APP_NAME/g, appName)
      .replace(/STORAGE_CLASS/g, storageClass)
      .replace(/5Gi/g, `${diskSize}Gi`);
    
    setPersistentVolumeYaml(updatedPV);
    setPersistentVolumeClaimYaml(updatedPVC);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleVarChange(name, value);
  };

  const handleCloudProviderChange = (value: string) => {
    setCloudProvider(value);
    setStorageClass(storageClasses[value as keyof typeof storageClasses][0]);
    updatePersistenceYamls(vars.namespace, vars.appName);
  };

  const handleStorageClassChange = (value: string) => {
    setStorageClass(value);
    updatePersistenceYamls(vars.namespace, vars.appName);
  };

  const handleDiskSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDiskSize = e.target.value;
    setDiskSize(newDiskSize);
    
    if (persistentVolumeYaml && persistentVolumeClaimYaml) {
      const updatedPV = persistentVolumeYaml.replace(/storage: \d+Gi/g, `storage: ${newDiskSize}Gi`);
      setPersistentVolumeYaml(updatedPV);
      
      const updatedPVC = persistentVolumeClaimYaml.replace(/storage: \d+Gi/g, `storage: ${newDiskSize}Gi`);
      setPersistentVolumeClaimYaml(updatedPVC);
    } else {
      updatePersistenceYamls(vars.namespace, vars.appName);
    }
  };

  const handleVolumePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
    setVolumePath(newPath);
    
    if (cloudProvider === 'onprem' && persistentVolumeYaml) {
      // Update the path in the existing PV YAML
      const updatedPV = persistentVolumeYaml.replace(/path: .*(\n|\r|$)/m, `path: ${newPath}\n`);
      setPersistentVolumeYaml(updatedPV);
    } else {
      updatePersistenceYamls(vars.namespace, vars.appName);
    }
  };

  const handlePersistenceToggle = (checked: boolean) => {
    setEnablePersistence(checked);
    if (checked) {
      updatePersistenceYamls(vars.namespace, vars.appName);
    }
  };

  const handleApplyChanges = () => {
    const currentConfig = {
      deploymentYaml,
      serviceYaml,
      redisYaml,
      configMapYaml,
      persistentVolumeYaml,
      persistentVolumeClaimYaml,
      enablePersistence,
      cloudProvider,
      storageClass,
      diskSize,
      volumePath,
      vars
    };

    applyConfig('kubernetes', currentConfig);
    setHasUnsavedChanges(false);
    toast({
      title: "Changes applied",
      description: "Kubernetes configuration has been updated successfully.",
    });
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
        <Database className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Kubernetes Manifests</h1>
      </div>
      <p className="text-muted-foreground mt-2">
        Configure your Kubernetes deployment manifests
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              Configure your application deployment settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="namespace">Namespace</Label>
                <Input 
                  id="namespace" 
                  name="namespace"
                  value={vars.namespace}
                  onChange={handleInputChange}
                  placeholder="default"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="appName">Application Name</Label>
                <Input 
                  id="appName" 
                  name="appName"
                  value={vars.appName}
                  onChange={handleInputChange}
                  placeholder="go-microservice"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="replicas">Replicas</Label>
                <Input 
                  id="replicas" 
                  name="replicas"
                  value={vars.replicas}
                  onChange={handleInputChange}
                  placeholder="2"
                  type="number"
                  min="1"
                  max="10"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select 
                  value={vars.serviceType} 
                  onValueChange={(value) => handleVarChange('serviceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ClusterIP">ClusterIP</SelectItem>
                    <SelectItem value="NodePort">NodePort</SelectItem>
                    <SelectItem value="LoadBalancer">LoadBalancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dockerUsername">Docker Username</Label>
                <Input 
                  id="dockerUsername" 
                  name="dockerUsername"
                  value={vars.dockerUsername}
                  onChange={handleInputChange}
                  placeholder="DOCKER_USERNAME"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="redisVersion">Redis Version</Label>
                <Select 
                  value={vars.redisVersion} 
                  onValueChange={(value) => handleVarChange('redisVersion', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Redis version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6.2-alpine">6.2 (Alpine)</SelectItem>
                    <SelectItem value="7.0-alpine">7.0 (Alpine)</SelectItem>
                    <SelectItem value="6.2">6.2</SelectItem>
                    <SelectItem value="7.0">7.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Storage Configuration</CardTitle>
            <CardDescription>
              Configure persistent storage for your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enablePersistence" className="flex items-center gap-2">
                Enable Persistent Storage
              </Label>
              <Switch 
                id="enablePersistence"
                checked={enablePersistence}
                onCheckedChange={handlePersistenceToggle}
              />
            </div>
            
            {enablePersistence && (
              <div className="space-y-4 mt-2 border-t pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="cloudProvider">Cloud Provider</Label>
                  <Select 
                    value={cloudProvider}
                    onValueChange={handleCloudProviderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cloud provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">AWS (EKS)</SelectItem>
                      <SelectItem value="gcp">Google Cloud (GKE)</SelectItem>
                      <SelectItem value="azure">Azure (AKS)</SelectItem>
                      <SelectItem value="onprem">On-Premises / Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="storageClass">Storage Class</Label>
                  <Select 
                    value={storageClass}
                    onValueChange={handleStorageClassChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage class" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageClasses[cloudProvider as keyof typeof storageClasses].map(sc => (
                        <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="diskSize">Disk Size (GB)</Label>
                    <Input 
                      id="diskSize"
                      type="number" 
                      min="1"
                      max="1000"
                      value={diskSize}
                      onChange={handleDiskSizeChange}
                    />
                  </div>
                  
                  {cloudProvider === 'onprem' && (
                    <div className="grid gap-2">
                      <Label htmlFor="volumePath">Volume Path</Label>
                      <Input 
                        id="volumePath"
                        value={volumePath}
                        onChange={handleVolumePathChange}
                        placeholder="/data"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mb-4">
        <ApplyButton onApply={handleApplyChanges} hasChanges={hasUnsavedChanges} />
      </div>
      
      <Tabs defaultValue="deployment" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
          <TabsTrigger value="redis">Redis</TabsTrigger>
          <TabsTrigger value="configmap">ConfigMap</TabsTrigger>
          {enablePersistence && <TabsTrigger value="pv">PersistentVolume</TabsTrigger>}
          {enablePersistence && <TabsTrigger value="pvc">PersistentVolumeClaim</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="deployment" className="mt-4">
          <CodeEditor
            title="deployment.yaml"
            language="yaml"
            code={deploymentYaml}
            onCodeChange={setDeploymentYaml}
          />
        </TabsContent>
        
        <TabsContent value="service" className="mt-4">
          <CodeEditor
            title="service.yaml"
            language="yaml"
            code={serviceYaml}
            onCodeChange={setServiceYaml}
          />
        </TabsContent>
        
        <TabsContent value="redis" className="mt-4">
          <CodeEditor
            title="redis.yaml"
            language="yaml"
            code={redisYaml}
            onCodeChange={setRedisYaml}
          />
        </TabsContent>
        
        <TabsContent value="configmap" className="mt-4">
          <CodeEditor
            title="configmap.yaml"
            language="yaml"
            code={configMapYaml}
            onCodeChange={setConfigMapYaml}
          />
        </TabsContent>

        {enablePersistence && (
          <TabsContent value="pv" className="mt-4">
            <CodeEditor
              title="persistent-volume.yaml"
              language="yaml"
              code={persistentVolumeYaml}
              onCodeChange={setPersistentVolumeYaml}
            />
          </TabsContent>
        )}
        
        {enablePersistence && (
          <TabsContent value="pvc" className="mt-4">
            <CodeEditor
              title="persistent-volume-claim.yaml"
              language="yaml"
              code={persistentVolumeClaimYaml}
              onCodeChange={setPersistentVolumeClaimYaml}
            />
          </TabsContent>
        )}
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleNextStep}>
          Continue to Deployment Config
        </Button>
      </div>
    </div>
  );
};

export default KubernetesSetup;
