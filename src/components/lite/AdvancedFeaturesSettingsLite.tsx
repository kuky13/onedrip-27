import React from 'react';
import { UnifiedAdvancedFeaturesSettings } from '../UnifiedAdvancedFeaturesSettings';

interface AdvancedFeaturesSettingsLiteProps {
  userId: string;
  profile: any;
}

export const AdvancedFeaturesSettingsLite = ({ userId, profile }: AdvancedFeaturesSettingsLiteProps) => {
  return <UnifiedAdvancedFeaturesSettings userId={userId} profile={profile} isLite={true} />;
};