import React from 'react';
import { useMatchStore } from '../../store/useMatchStore';
import { CourtSelector } from '../common/CourtSelector';

export const CourtManager: React.FC = () => {
  const { config, addCourt, removeCourt } = useMatchStore();

  return (
    <CourtSelector
      courts={config.courtNames}
      onAddCourt={addCourt}
      onRemoveCourt={removeCourt}
      title="Courts Configuration"
      subtitle="Add arena courts reserved for this session"
      minCourts={1}
    />
  );
};

