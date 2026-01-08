# Chart Sizing Error Fix

## Issue Description

The CandleChart component on token detail pages was displaying console warnings about invalid chart dimensions:

```
The width(-1) and height(-1) of chart should be greater than 0,
please check the style of container, or the props width(100%) and height(100%),
or add a minWidth(0) or minHeight(0) or use aspect(undefined) to control the
height and width.
```

This error occurred at multiple locations:
- `CandleChart.tsx:297` (Main price chart)
- `CandleChart.tsx:379` (Volume subchart)
- Additional subcharts (RSI, MACD, StochRSI)

## Root Cause

The `ResponsiveContainer` component from Recharts cannot properly calculate dimensions when:

1. **Parent container uses percentage heights in flex layouts** - The chart container used `flex-1` with `h-full`, which created a circular dependency where the child needed to know parent dimensions before the parent had calculated them
2. **ResponsiveContainer received percentage strings instead of numeric values** - Passing `"80%"`, `"20%"` etc. to the `height` prop caused dimension calculations to fail
3. **Timing issue** - The chart attempted to render before the flex container layout was computed, resulting in -1 dimensions

## Solution

Changed from percentage-based height calculations to fixed pixel heights:

### Before (Percentage-Based)
```tsx
let mainChartHeight = "100%";
let volumeChartHeight = "20%";
let subChartHeight = `${25 / indicatorCount}%`;

<ResponsiveContainer width="100%" height="100%" aspect={undefined}>
```

### After (Fixed Pixel Heights)
```tsx
let mainChartHeight = 500;
let volumeChartHeight = 100;
let subChartHeight = Math.floor(125 / indicatorCount);

<ResponsiveContainer width="100%" height={mainChartHeight} aspect={undefined}>
```

### Key Changes

1. **Calculated total height** - Added `totalHeight` variable to compute the complete chart height:
   ```tsx
   const totalHeight = mainChartHeight + volumeChartHeight + (subChartHeight * indicatorCount);
   ```

2. **Fixed container height** - Set explicit pixel height on root container:
   ```tsx
   <div className="w-full flex flex-col" style={{ height: `${totalHeight}px`, minHeight: totalHeight }}>
   ```

3. **Numeric heights for ResponsiveContainer** - All charts now receive number values:
   - Main chart: 500px (or 400px/300px/350px depending on visible indicators)
   - Volume chart: 100px (or 75px with indicators)
   - Subcharts: Calculated pixel values (75px, 62px, or 41px based on count)

4. **Conditional rendering** - Added `height > 0` checks to prevent rendering subcharts when they shouldn't be visible:
   ```tsx
   {showVolume && volumeChartHeight > 0 && (
     <div style={{ height: volumeChartHeight, ... }}>
       <ResponsiveContainer width="100%" height={volumeChartHeight} ...>
   ```

5. **Fixed flex behavior** - Changed from `flex: '1 1 auto'` to `flex: '0 0 auto'` to prevent flex from interfering with fixed heights

## Height Distribution

| Configuration | Main Chart | Volume | Each Subchart | Total |
|--------------|-----------|--------|---------------|-------|
| No subcharts | 500px | - | - | 500px |
| Volume only | 400px | 100px | - | 500px |
| 1 indicator | 350px | - | 150px | 500px |
| Volume + 1 indicator | 300px | 75px | 125px | 500px |
| Volume + 2 indicators | 300px | 75px | 62px | 499px |
| Volume + 3 indicators | 300px | 75px | 41px | 498px |

## Files Modified

- `components/CandleChart.tsx` - Changed height calculation logic and ResponsiveContainer props

## Testing

After applying the fix:
1. Navigate to any token detail page (e.g., `/token/token-16`)
2. Check browser console - no dimension warnings should appear
3. Charts should render correctly with all indicators (Volume, RSI, MACD, StochRSI)
4. Layout should remain stable when toggling indicators on/off

## Related Issues

This is a known issue with Recharts `ResponsiveContainer` when used in flex containers. The official recommendation is to either:
- Use fixed pixel heights
- Add `minWidth={0}` prop
- Use `ResizeObserver` to detect when container has dimensions before rendering

Our solution implements the fixed pixel height approach as it's the most reliable and maintainable.

## Date Fixed

December 31, 2024
