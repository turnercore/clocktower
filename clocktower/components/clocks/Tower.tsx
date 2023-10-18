'use client';
import React, { useState, useEffect } from 'react';
import TowerRow, { RowData } from './TowerRow';
import { Button } from '@/components/ui';  // Make sure to import Button from your UI library

interface TowerProps {
  towerId: string;
}

export const Tower: React.FC<TowerProps> = ({ towerId }) => {
  const [towerData, setTowerData] = useState<RowData[]>([]);  // Initialize towerData as an empty array

  // Fetch initial data from the server
  useEffect(() => {
    // Fetch initial data from server and setTowerData
    // For example: setTowerData(fetchedData);
  }, []);

  // Update a specific row in towerData
  const updateRow = (updatedRow: RowData, index: number) => {
    const newTowerData = [...towerData];
    newTowerData[index] = updatedRow;
    setTowerData(newTowerData);

    // Sync the updated towerData with the server
    // For example: api.updateTower(newTowerData);
  };

  // Add a new row to the tower
  const addRow = () => {
    setTowerData([...towerData, { name: '', clocks: [] }]);
  };

  return (
    <div>
      <Button onClick={addRow}>Add Row</Button>
      {towerData.map((rowData, index) => (
        <TowerRow
          key={index}
          rowData={rowData}
          updateRow={(newData: RowData) => updateRow(newData, index)}
        />
      ))}
    </div>
  );
};

export default Tower;
