'use client'
import { UUID } from 'crypto';
import React, { useState, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import { PieChart, PieChartProps } from 'react-minimal-pie-chart';

export type ClockData = {
  id: UUID;
  length?: number;
  lineWidth?: number;
  isRounded?: boolean;
  lightenIntensity?: number;
  darkenIntensity?: number;
  color?: string;
  filled?: number;
}

export type ClockProps = {
  clockData: ClockData;
  updateClock: (newData: ClockData) => void;
}

// Define the React component
export const Clock: React.FC<ClockProps> = ({ clockData, updateClock }) => {
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(clockData.filled ? clockData.filled - 1 : null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);
  const clockSize = clockData.length || 4;
  const lineWidth = clockData.lineWidth || 20; // Width of the chart's line
  const isRounded = clockData.isRounded || false; // Whether to round the chart's corners
  const lightenIntensity = clockData.lightenIntensity || 0.35; // How much to lighten the color on hover
  const darkenIntensity = clockData.darkenIntensity || 0.5; // How much to darken the color on hover

  // Call updateClock with new data when internal state changes
  useEffect(() => {
    clockData.filled = selectedSliceIndex !== null ? selectedSliceIndex + 1 : 0;
    updateClock({
      ...clockData,
    });
  }, [selectedSliceIndex, clockData, updateClock]);


  // Sample data for the donut chart
  const chartData = Array.from({ length: clockSize }, (_, i) => ({
    title: `Segment ${i + 1}`,
    value: 10,
    color: '#E38627', // Green
  }));

  // Handle mouse over slice
  const handleMouseOver = (_: ReactMouseEvent<Element, MouseEvent>, index: number) => {
    setHoveredSliceIndex(index);
  };

  // Handle mouse out of slice
  const handleMouseOut = () => {
    setHoveredSliceIndex(null);
  };

  // Handle slice click
  const handleSliceClick = (event: ReactMouseEvent<Element, MouseEvent>, index: number) => {
    if (selectedSliceIndex === index || (selectedSliceIndex !== null && index < selectedSliceIndex)) {
      setSelectedSliceIndex(index === 0 ? null : index - 1);
    } else {
      setSelectedSliceIndex(index);
    }
  };

  // Update data based on the selected and hovered slice index
  const updatedData = chartData.map((entry, index) => {
    let fillColor = 'gray';  // Default color for non-active slices

    if (selectedSliceIndex !== null && index <= selectedSliceIndex) {
      fillColor = entry.color; // Original color for selected slices
    }

    if (hoveredSliceIndex === index) {
      // If already filled darken color for hovered slices
      if (selectedSliceIndex !== null && index <= selectedSliceIndex) {
        fillColor = darkenHexColor(entry.color, darkenIntensity);
      } else {
        fillColor = lightenHexColor(entry.color, lightenIntensity); // Lighten color for hovered slices
      }
    } else if (hoveredSliceIndex !== null) {
      if (index < hoveredSliceIndex) {
        // Check if selectedSliceIndex is null or index is greater
        if (selectedSliceIndex === null || index > selectedSliceIndex) {
          fillColor = lightenHexColor(entry.color, lightenIntensity); // Lighten color for slices that would be filled
        }
      } else if (selectedSliceIndex !== null && index <= selectedSliceIndex) {
        fillColor = darkenHexColor(entry.color, darkenIntensity); // Darken color for filled slices after the hovered slice
      }
    }

    return {
      ...entry,
      color: fillColor,
    };
  });


  return (
    <PieChart
      data={updatedData}
      lineWidth={isRounded ? lineWidth + 5 : lineWidth}  // Custom arc's width for the Donut chart
      paddingAngle={isRounded ? lineWidth + 5 : lineWidth / 4}  // Padding between arcs
      rounded={isRounded ? true : false}
      startAngle={-90}  // Start from the top-right
      segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
      segmentsShift={(index) => (index === hoveredSliceIndex ? 0.5 : -0.5)}  // Slight grow on hover
      onClick={handleSliceClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      viewBoxSize={[110, 110]}  // Increase the viewbox dimensions
      center={[55, 55]}  // Move the center of the chart
    />
  );
};


export default Clock;

const lightenHexColor = (hex: string, factor: number): string => {
  // Remove the '#' from the beginning of the hex code if it exists
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16));

  // Lighten each color component
  const lighten = (color: number) => Math.min(255, Math.max(0, Math.floor(color + (255 - color) * factor)));

  // Convert back to hex
  const componentToHex = (color: number) => {
    const hex = color.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${componentToHex(lighten(r))}${componentToHex(lighten(g))}${componentToHex(lighten(b))}`;
};

const darkenHexColor = (hex: string, factor: number): string => {
  // Remove the '#' from the beginning of the hex code if it exists
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16));

  // Darken each color component
  const darken = (color: number) => Math.min(255, Math.max(0, Math.floor(color * (1 - factor))));

  // Convert back to hex
  const componentToHex = (color: number) => {
    const hex = color.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${componentToHex(darken(r))}${componentToHex(darken(g))}${componentToHex(darken(b))}`;
};
