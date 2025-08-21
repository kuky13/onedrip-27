import React from 'react';
import { UnifiedNewBudgetContent } from '../UnifiedNewBudgetContent';

interface NewBudgetLiteProps {
  userId: string;
  onBack: () => void;
}

export const NewBudgetLite = ({
  userId,
  onBack
}: NewBudgetLiteProps) => {
  return <UnifiedNewBudgetContent userId={userId} onBack={onBack} isLite={true} />;
};