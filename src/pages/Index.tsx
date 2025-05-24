
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Overview from '../components/steps/Overview';
import RepositorySetup from '../components/steps/RepositorySetup';
import JenkinsfileSetup from '../components/steps/JenkinsfileSetup';
import DockerfileSetup from '../components/steps/DockerfileSetup';
import KubernetesSetup from '../components/steps/KubernetesSetup';
import DeploymentConfig from '../components/steps/DeploymentConfig';
import MonitoringSetup from '../components/steps/MonitoringSetup';
import ExportProject from '../components/steps/ExportProject';
import Settings from '../components/steps/Settings';
import { GitMerge } from "lucide-react";
import { useConfig } from '../context/ConfigContext';

const Index = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { configs } = useConfig();

  const handleNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, 8));
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar activeStep={activeStep} setActiveStep={setActiveStep} />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto mb-20">
          <div className="mb-8 flex items-center gap-3 justify-center">
            <div className="bg-primary rounded-xl p-3 rotate-6 hover:rotate-12 transition-transform duration-300">
              <GitMerge className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-center">Pipeline Flow Wizard</h1>
          </div>
          
          {activeStep === 0 && <Overview goToNextStep={handleNextStep} />}
          {activeStep === 1 && <RepositorySetup goToNextStep={handleNextStep} />}
          {activeStep === 2 && <JenkinsfileSetup goToNextStep={handleNextStep} />}
          {activeStep === 3 && <DockerfileSetup goToNextStep={handleNextStep} />}
          {activeStep === 4 && <KubernetesSetup goToNextStep={handleNextStep} />}
          {activeStep === 5 && <DeploymentConfig goToNextStep={handleNextStep} />}
          {activeStep === 6 && <MonitoringSetup goToNextStep={handleNextStep} />}
          {activeStep === 7 && <ExportProject goToNextStep={handleNextStep} />}
          {activeStep === 8 && <Settings goToNextStep={handleNextStep} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
