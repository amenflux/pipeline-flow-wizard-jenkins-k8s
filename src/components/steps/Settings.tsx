
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

interface SettingsProps {
  goToNextStep: () => void;
}

const Settings: React.FC<SettingsProps> = ({ goToNextStep }) => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    projectName: 'Jenkins Pipeline Flow Wizard',
    darkMode: false,
    autoSave: true,
    notifications: true,
    templateSource: 'github',
    exportFormat: 'zip'
  });
  
  const [profile, setProfile] = useState({
    name: 'User',
    email: 'user@example.com',
    company: 'Your Company',
    apiToken: 'xxxxxxxxxxxxxxxxxxxxxxxx'
  });

  // Initialize dark mode state based on theme
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: theme === 'dark'
    }));
  }, [theme]);
  
  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'darkMode') {
      // Toggle theme
      setTheme(value ? 'dark' : 'light');
      
      toast({
        title: "Theme Changed",
        description: `Theme switched to ${value ? 'dark' : 'light'} mode.`,
      });
    }
    
    if (key === 'autoSave') {
      // Auto save implementation
      if (value) {
        toast({
          title: "Auto Save Enabled",
          description: "Your changes will now be saved automatically.",
        });
        
        // Trigger initial auto-save
        localStorage.setItem('pipelineWizardSettings', JSON.stringify({
          ...settings,
          [key]: value
        }));
      } else {
        toast({
          title: "Auto Save Disabled",
          description: "You'll need to save changes manually.",
        });
      }
    }
    
    if (key === 'notifications') {
      if (value) {
        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications for important events.",
        });
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive notifications.",
        });
      }
    }
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    
    // Auto save profile if enabled
    if (settings.autoSave) {
      localStorage.setItem('pipelineWizardProfile', JSON.stringify({
        ...profile,
        [name]: value
      }));
    }
  };
  
  const handleResetSettings = () => {
    const defaultSettings = {
      projectName: 'Jenkins Pipeline Flow Wizard',
      darkMode: false,
      autoSave: true,
      notifications: true,
      templateSource: 'github',
      exportFormat: 'zip'
    };
    
    setSettings(defaultSettings);
    setTheme('light');
    localStorage.setItem('pipelineWizardSettings', JSON.stringify(defaultSettings));
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };
  
  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('pipelineWizardSettings', JSON.stringify(settings));
    localStorage.setItem('pipelineWizardProfile', JSON.stringify(profile));
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pipelineWizardSettings');
    const savedProfile = localStorage.getItem('pipelineWizardProfile');
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      
      // Apply theme from saved settings
      setTheme(parsedSettings.darkMode ? 'dark' : 'light');
    }
    
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, [setTheme]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure application settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure application-wide settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input 
                  id="projectName" 
                  value={settings.projectName}
                  onChange={(e) => handleSettingsChange('projectName', e.target.value)}
                  placeholder="Jenkins Pipeline Flow Wizard"
                />
                <p className="text-xs text-muted-foreground">
                  The name of your pipeline project
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark color scheme
                    </p>
                  </div>
                  <Switch 
                    id="darkMode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => handleSettingsChange('darkMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSave">Auto Save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes
                    </p>
                  </div>
                  <Switch 
                    id="autoSave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => handleSettingsChange('autoSave', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications for important events
                    </p>
                  </div>
                  <Switch 
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', checked)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateSource">Template Source</Label>
                  <Select 
                    value={settings.templateSource} 
                    onValueChange={(value) => handleSettingsChange('templateSource', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="gitlab">GitLab</SelectItem>
                      <SelectItem value="bitbucket">Bitbucket</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exportFormat">Export Format</Label>
                  <Select 
                    value={settings.exportFormat} 
                    onValueChange={(value) => handleSettingsChange('exportFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select export format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zip">ZIP Archive</SelectItem>
                      <SelectItem value="tar">TAR Archive</SelectItem>
                      <SelectItem value="directory">Directory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleResetSettings}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Manage your user profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="Your Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    type="email"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    name="company"
                    value={profile.company}
                    onChange={handleProfileChange}
                    placeholder="Your Company"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input 
                    id="apiToken" 
                    name="apiToken"
                    value={profile.apiToken}
                    onChange={handleProfileChange}
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this token secure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => {
              toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
              });
            }}>
              Save Profile
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="about" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>About Pipeline Flow Wizard</CardTitle>
              <CardDescription>
                Information about this application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <h3 className="text-xl font-bold mb-2">Pipeline Flow Wizard</h3>
                <p className="text-muted-foreground">Version 1.0.0</p>
                <p className="mt-4 text-sm">
                  A tool for designing and configuring CI/CD pipelines using Jenkins, Docker, and Kubernetes.
                </p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Technologies Used</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>React with TypeScript</li>
                  <li>Tailwind CSS for styling</li>
                  <li>Shadcn UI components</li>
                </ul>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">License</h4>
                <p className="text-sm">
                  This project is licensed under the MIT License.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
