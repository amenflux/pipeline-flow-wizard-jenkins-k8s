
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

interface ApplyButtonProps {
  onApply: () => void;
  hasChanges?: boolean;
}

const ApplyButton: React.FC<ApplyButtonProps> = ({ onApply, hasChanges = true }) => {
  const { toast } = useToast();

  const handleApply = () => {
    onApply();
    toast({
      title: "Changes applied",
      description: "Your configuration has been updated successfully.",
    });
  };

  return (
    <Button 
      onClick={handleApply}
      disabled={!hasChanges}
      variant="outline"
      className="gap-2"
    >
      <Check className="h-4 w-4" />
      Apply Changes
    </Button>
  );
};

export default ApplyButton;
