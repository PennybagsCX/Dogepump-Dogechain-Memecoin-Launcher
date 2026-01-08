import React, { useMemo, useRef, useEffect } from 'react';
import { Grid, GridProps } from 'react-window';
import { Token } from '../types';
import { TokenCard } from './TokenCard';

interface VirtualizedTokenGridProps {
  tokens: Token[];
  columnCount?: number;
  rowHeight?: number;
  className?: string;
}

// Calculate card height based on content (approximately 550px for TokenCard)
const CARD_HEIGHT = 550;
const CARD_GAP = 32; // gap-8 = 2rem = 32px

/**
 * Virtualized grid component for efficient rendering of large token lists
 * Uses react-window to render only visible items
 */
export const VirtualizedTokenGrid: React.FC<VirtualizedTokenGridProps> = ({
  tokens,
  columnCount = 3,
  rowHeight = CARD_HEIGHT + CARD_GAP,
  className = '',
}) => {
  const gridRef = useRef<any>(null);

  // Calculate row count based on tokens and columns
  const rowCount = Math.ceil(tokens.length / columnCount);

  // Recalculate grid dimensions on resize
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.resetAfterIndices(0);
    }
  }, [columnCount]);

  // Calculate grid width
  const gridWidth = useMemo(() => {
    if (typeof window !== 'undefined') {
      // Get parent container width or use window width
      const containerWidth = window.innerWidth;
      // Subtract padding and margins
      return Math.max(containerWidth - 64, 300); // Minimum 300px
    }
    return 1200; // Default fallback
  }, []);

  // Calculate column width
  const columnWidth = useMemo(() => {
    return (gridWidth - (columnCount - 1) * CARD_GAP) / columnCount;
  }, [gridWidth, columnCount]);

  // Calculate grid height
  const gridHeight = useMemo(() => {
    const visibleRows = Math.min(rowCount, 4); // Show up to 4 rows
    return visibleRows * rowHeight;
  }, [rowCount, rowHeight]);

  // If tokens list is small, render directly without virtualization
  if (tokens.length <= 12) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4 min-h-[300px] ${className}`}>
        {tokens.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))}
      </div>
    );
  }

  return (
    <div className={`pb-4 min-h-[300px] ${className}`}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={gridHeight}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={gridWidth}
        className="mx-auto"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        {...{
          cellComponent: ({ columnIndex, rowIndex, style }: any) => {
            const tokenIndex = rowIndex * columnCount + columnIndex;

            // Don't render if index is out of bounds
            if (tokenIndex >= tokens.length) {
              return null;
            }

            const token = tokens[tokenIndex];

            return (
              <div key={token.id} style={style} className="pr-0 pb-0">
                <TokenCard token={token} />
              </div>
            );
          }
        } as any}
      />
    </div>
  );
};
