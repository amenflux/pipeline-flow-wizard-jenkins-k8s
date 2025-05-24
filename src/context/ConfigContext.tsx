
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConfigContextType {
  applyConfig: (stepId: string, config: any) => void;
  getConfig: (stepId: string) => any;
  configs: Record<string, any>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [configs, setConfigs] = useState<Record<string, any>>({});

  const applyConfig = (stepId: string, config: any) => {
    setConfigs(prev => ({
      ...prev,
      [stepId]: config
    }));
  };

  const getConfig = (stepId: string) => {
    return configs[stepId] || {};
  };

  return (
    <ConfigContext.Provider value={{ applyConfig, getConfig, configs }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
