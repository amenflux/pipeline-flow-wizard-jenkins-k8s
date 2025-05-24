import React, { useState, useEffect } from 'react';
import CodeEditor from '../CodeEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ApplyButton from '../ApplyButton';
import { useConfig } from '../../context/ConfigContext';

interface MonitoringSetupProps {
  goToNextStep: () => void;
}

const defaultPrometheusYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']
      
      - job_name: 'go-microservice'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            action: keep
            regex: go-microservice
          - source_labels: [__meta_kubernetes_pod_container_port_name]
            action: keep
            regex: metrics
          
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.34.0
        args:
          - "--config.file=/etc/prometheus/prometheus.yml"
          - "--storage.tsdb.path=/prometheus"
          - "--web.console.libraries=/etc/prometheus/console_libraries"
          - "--web.console.templates=/etc/prometheus/consoles"
          - "--web.enable-lifecycle"
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-storage
          mountPath: /prometheus
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090`;

const defaultGrafanaYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:9.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: GF_SECURITY_ADMIN_USER
          value: admin
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: admin123
        - name: GF_USERS_ALLOW_SIGN_UP
          value: "false"
        volumeMounts:
        - name: grafana-storage
          mountPath: /var/lib/grafana
      volumes:
      - name: grafana-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP`;

const defaultDashboardJson = `// ... keep existing code (dashboard JSON definition)`;

const defaultAlertsYaml = `// ... keep existing code (alerts YAML definition)`;

const MonitoringSetup: React.FC<MonitoringSetupProps> = ({ goToNextStep }) => {
  const { applyConfig, getConfig } = useConfig();
  const savedConfig = getConfig('monitoringSetup');
  
  const [prometheusYaml, setPrometheusYaml] = useState(savedConfig.prometheusYaml || defaultPrometheusYaml);
  const [grafanaYaml, setGrafanaYaml] = useState(savedConfig.grafanaYaml || defaultGrafanaYaml);
  const [dashboardJson, setDashboardJson] = useState(savedConfig.dashboardJson || defaultDashboardJson);
  const [alertsYaml, setAlertsYaml] = useState(savedConfig.alertsYaml || defaultAlertsYaml);
  
  const [settings, setSettings] = useState(savedConfig.settings || {
    enablePrometheus: true,
    enableGrafana: true,
    enableAlertManager: true,
    prometheusVersion: 'v2.34.0',
    grafanaVersion: '9.0.0',
    namespace: 'monitoring',
    persistStorage: false,
    grafanaAdminPassword: 'admin123',
    alertManagerReceivers: [
      { name: 'slack', type: 'slack' }
    ],
    storageClass: 'standard',
    prometheusStorageSize: '10Gi',
    grafanaStorageSize: '2Gi',
    storagePath: '/var/lib/monitoring'
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [prometheusYaml, grafanaYaml, dashboardJson, alertsYaml, settings]);
  
  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'prometheusVersion') {
      const updatedPrometheusYaml = prometheusYaml.replace(/prom\/prometheus:v\d+\.\d+\.\d+/g, `prom/prometheus:${value}`);
      setPrometheusYaml(updatedPrometheusYaml);
    } else if (key === 'grafanaVersion') {
      const updatedGrafanaYaml = grafanaYaml.replace(/grafana\/grafana:\d+\.\d+\.\d+/g, `grafana/grafana:${value}`);
      setGrafanaYaml(updatedGrafanaYaml);
    } else if (key === 'namespace') {
      const updatedPrometheusYaml = prometheusYaml.replace(/namespace: monitoring/g, `namespace: ${value}`);
      setPrometheusYaml(updatedPrometheusYaml);
      
      const updatedGrafanaYaml = grafanaYaml.replace(/namespace: monitoring/g, `namespace: ${value}`);
      setGrafanaYaml(updatedGrafanaYaml);
    } else if (key === 'grafanaAdminPassword') {
      const updatedGrafanaYaml = grafanaYaml.replace(/value: admin123/g, `value: ${value}`);
      setGrafanaYaml(updatedGrafanaYaml);
    } else if (key === 'persistStorage' && value === true) {
      const persistentPrometheusStorage = `      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        persistentVolumeClaim:
          claimName: prometheus-storage
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-storage
  namespace: ${settings.namespace}
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ${settings.storageClass}
  resources:
    requests:
      storage: ${settings.prometheusStorageSize}`;
      
      const updatedPrometheusYaml = prometheusYaml.replace(/      volumes:[\s\S]*?emptyDir: \{\}/g, persistentPrometheusStorage);
      setPrometheusYaml(updatedPrometheusYaml);
      
      const persistentGrafanaStorage = `      volumes:
      - name: grafana-storage
        persistentVolumeClaim:
          claimName: grafana-storage
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-storage
  namespace: ${settings.namespace}
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ${settings.storageClass}
  resources:
    requests:
      storage: ${settings.grafanaStorageSize}`;
      
      const updatedGrafanaYaml = grafanaYaml.replace(/      volumes:[\s\S]*?emptyDir: \{\}/g, persistentGrafanaStorage);
      setGrafanaYaml(updatedGrafanaYaml);
    } else if (key === 'persistStorage' && value === false) {
      const nonPersistentPrometheusStorage = `      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        emptyDir: {}`;
      
      const prometheusYamlWithoutPVC = prometheusYaml.replace(/---\napiVersion: v1\nkind: PersistentVolumeClaim[\s\S]*?storage: .*Gi/g, '');
      const updatedPrometheusYaml = prometheusYamlWithoutPVC.replace(/      volumes:[\s\S]*?claimName: prometheus-storage/g, nonPersistentPrometheusStorage);
      setPrometheusYaml(updatedPrometheusYaml);
      
      const nonPersistentGrafanaStorage = `      volumes:
      - name: grafana-storage
        emptyDir: {}`;
      
      const grafanaYamlWithoutPVC = grafanaYaml.replace(/---\napiVersion: v1\nkind: PersistentVolumeClaim[\s\S]*?storage: .*Gi/g, '');
      const updatedGrafanaYaml = grafanaYamlWithoutPVC.replace(/      volumes:[\s\S]*?claimName: grafana-storage/g, nonPersistentGrafanaStorage);
      setGrafanaYaml(updatedGrafanaYaml);
    } else if ((key === 'storageClass' || key === 'prometheusStorageSize' || key === 'grafanaStorageSize') && settings.persistStorage) {
      if (prometheusYaml.includes('PersistentVolumeClaim')) {
        let updatedPrometheusYaml = prometheusYaml;
        
        if (key === 'storageClass') {
          updatedPrometheusYaml = updatedPrometheusYaml.replace(/storageClassName: .*$/m, `storageClassName: ${value}`);
        } else if (key === 'prometheusStorageSize') {
          updatedPrometheusYaml = updatedPrometheusYaml.replace(/storage: .*Gi/g, `storage: ${value}`);
        }
        
        setPrometheusYaml(updatedPrometheusYaml);
      }
      
      if (grafanaYaml.includes('PersistentVolumeClaim')) {
        let updatedGrafanaYaml = grafanaYaml;
        
        if (key === 'storageClass') {
          updatedGrafanaYaml = updatedGrafanaYaml.replace(/storageClassName: .*$/m, `storageClassName: ${value}`);
        } else if (key === 'grafanaStorageSize') {
          updatedGrafanaYaml = updatedGrafanaYaml.replace(/storage: .*Gi/g, `storage: ${value}`);
        }
        
        setGrafanaYaml(updatedGrafanaYaml);
      }
    }
  };

  const handleApplyChanges = () => {
    const currentConfig = {
      prometheusYaml,
      grafanaYaml,
      dashboardJson,
      alertsYaml,
      settings
    };
    
    applyConfig('monitoringSetup', currentConfig);
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
        <h1 className="text-2xl font-bold tracking-tight">Monitoring Setup</h1>
        <p className="text-muted-foreground mt-2">
          Configure monitoring with Prometheus and Grafana
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monitoring Configuration</CardTitle>
          <CardDescription>
            Configure Prometheus and Grafana for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enablePrometheus">Enable Prometheus</Label>
                <p className="text-sm text-muted-foreground">
                  Deploy Prometheus for metrics collection
                </p>
              </div>
              <Switch 
                id="enablePrometheus"
                checked={settings.enablePrometheus}
                onCheckedChange={(checked) => handleSettingsChange('enablePrometheus', checked)}
              />
            </div>
            
            {settings.enablePrometheus && (
              <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prometheusVersion">Prometheus Version</Label>
                  <Select 
                    value={settings.prometheusVersion} 
                    onValueChange={(value) => handleSettingsChange('prometheusVersion', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v2.33.0">2.33.0</SelectItem>
                      <SelectItem value="v2.34.0">2.34.0</SelectItem>
                      <SelectItem value="v2.35.0">2.35.0</SelectItem>
                      <SelectItem value="v2.36.0">2.36.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableGrafana">Enable Grafana</Label>
                <p className="text-sm text-muted-foreground">
                  Deploy Grafana for metrics visualization
                </p>
              </div>
              <Switch 
                id="enableGrafana"
                checked={settings.enableGrafana}
                onCheckedChange={(checked) => handleSettingsChange('enableGrafana', checked)}
              />
            </div>
            
            {settings.enableGrafana && (
              <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grafanaVersion">Grafana Version</Label>
                  <Select 
                    value={settings.grafanaVersion} 
                    onValueChange={(value) => handleSettingsChange('grafanaVersion', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8.5.0">8.5.0</SelectItem>
                      <SelectItem value="9.0.0">9.0.0</SelectItem>
                      <SelectItem value="9.1.0">9.1.0</SelectItem>
                      <SelectItem value="9.2.0">9.2.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grafanaAdminPassword">Admin Password</Label>
                  <Input 
                    id="grafanaAdminPassword" 
                    value={settings.grafanaAdminPassword}
                    onChange={(e) => handleSettingsChange('grafanaAdminPassword', e.target.value)}
                    placeholder="admin123"
                    type="password"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableAlertManager">Enable Alert Manager</Label>
                <p className="text-sm text-muted-foreground">
                  Configure alerts and notifications
                </p>
              </div>
              <Switch 
                id="enableAlertManager"
                checked={settings.enableAlertManager}
                onCheckedChange={(checked) => handleSettingsChange('enableAlertManager', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="namespace">Kubernetes Namespace</Label>
              <Input 
                id="namespace" 
                value={settings.namespace}
                onChange={(e) => handleSettingsChange('namespace', e.target.value)}
                placeholder="monitoring"
              />
              <p className="text-xs text-muted-foreground">
                The Kubernetes namespace for monitoring components
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="persistStorage"
                checked={settings.persistStorage}
                onCheckedChange={(checked) => handleSettingsChange('persistStorage', checked)}
              />
              <Label htmlFor="persistStorage">
                Configure Persistent Storage
              </Label>
            </div>
            
            {settings.persistStorage && (
              <div className="ml-6 space-y-4 border p-4 rounded-md bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storageClass">Storage Class</Label>
                    <Select 
                      value={settings.storageClass} 
                      onValueChange={(value) => handleSettingsChange('storageClass', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">standard</SelectItem>
                        <SelectItem value="premium">premium</SelectItem>
                        <SelectItem value="fast">fast</SelectItem>
                        <SelectItem value="ssd">ssd</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Kubernetes storage class to use for persistent volumes
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storagePath">Storage Path</Label>
                    <Input 
                      id="storagePath" 
                      value={settings.storagePath}
                      onChange={(e) => handleSettingsChange('storagePath', e.target.value)}
                      placeholder="/var/lib/monitoring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Host path for persistent storage (if using hostPath)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prometheusStorageSize">Prometheus Storage Size</Label>
                    <Select 
                      value={settings.prometheusStorageSize} 
                      onValueChange={(value) => handleSettingsChange('prometheusStorageSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5Gi">5 GB</SelectItem>
                        <SelectItem value="10Gi">10 GB</SelectItem>
                        <SelectItem value="20Gi">20 GB</SelectItem>
                        <SelectItem value="50Gi">50 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grafanaStorageSize">Grafana Storage Size</Label>
                    <Select 
                      value={settings.grafanaStorageSize} 
                      onValueChange={(value) => handleSettingsChange('grafanaStorageSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1Gi">1 GB</SelectItem>
                        <SelectItem value="2Gi">2 GB</SelectItem>
                        <SelectItem value="5Gi">5 GB</SelectItem>
                        <SelectItem value="10Gi">10 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end mb-4">
        <ApplyButton onApply={handleApplyChanges} hasChanges={hasUnsavedChanges} />
      </div>
      
      <Tabs defaultValue="prometheus" className="w-full">
        <TabsList className="grid w-full md:grid-cols-4 grid-cols-2">
          <TabsTrigger value="prometheus">Prometheus</TabsTrigger>
          <TabsTrigger value="grafana">Grafana</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prometheus" className="mt-4">
          <CodeEditor
            title="prometheus.yaml"
            language="yaml"
            code={prometheusYaml}
            onCodeChange={setPrometheusYaml}
          />
        </TabsContent>
        
        <TabsContent value="grafana" className="mt-4">
          <CodeEditor
            title="grafana.yaml"
            language="yaml"
            code={grafanaYaml}
            onCodeChange={setGrafanaYaml}
          />
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-4">
          <CodeEditor
            title="dashboard.json"
            language="json"
            code={dashboardJson}
            onCodeChange={setDashboardJson}
          />
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-4">
          <CodeEditor
            title="alerts.yaml"
            language="yaml"
            code={alertsYaml}
            onCodeChange={setAlertsYaml}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleNextStep}>
          Continue to Export Project
        </Button>
      </div>
    </div>
  );
};

export default MonitoringSetup;
