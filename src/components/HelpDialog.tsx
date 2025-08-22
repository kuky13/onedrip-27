import React from 'react';
import { HelpSystem } from './help/HelpSystem';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContext?: string;
}

export const HelpDialog = ({
  open,
  onOpenChange,
  initialContext
}: HelpDialogProps) => {
  return (
    <HelpSystem />
  );
};