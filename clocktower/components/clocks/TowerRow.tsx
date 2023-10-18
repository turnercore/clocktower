'use client';
import React, { useState, useEffect } from 'react';
import Clock, { ClockData } from './Clock';
import { Button, Input } from '@/components/ui';  // Make sure to import Button and Input from your UI library
import { UUID } from 'crypto';

export type RowData = {
  name?: string;
  clocks?: ClockData[];
};

type TowerRowProps = {
  rowData: RowData;
  updateRow: (updatedRow: RowData) => void;
};

const TowerRow: React.FC<TowerRowProps> = ({ rowData, updateRow }) => {
  const [clocks, setClocks] = useState<ClockData[]>(rowData.clocks || []);
  const [rowName, setRowName] = useState<string>(rowData.name || '');

  // Update clock data
  const updateClock = (updatedClock: ClockData, index: number) => {
    const newClocks = [...clocks];
    newClocks[index] = updatedClock;
    setClocks(newClocks);
  };

  // Add a new clock
  const addClock = () => {
    setClocks([...clocks, {id : crypto.randomUUID() as UUID }]);  // Add a new empty ClockData object
  };

  // Handle row name change
  const handleRowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowName(e.target.value);
  };

  // Synchronize state with parent component
  useEffect(() => {
    updateRow({
      name: rowName,
      clocks: clocks,
    });
  }, [clocks, rowName, updateRow]);

  return (
    <div>
      <Input 
        placeholder="Row" 
        value={rowName} 
        onChange={handleRowNameChange}
      />
      <Button onClick={addClock}>+</Button>
      {clocks.map((clockData, index) => (
        <Clock 
          key={index} 
          clockData={clockData} 
          updateClock={(newData: ClockData) => updateClock(newData, index)}
        />
      ))}
    </div>
  );
};

export default TowerRow;
