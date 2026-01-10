
import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, Area, XAxis, YAxis, Tooltip, Cell, CartesianGrid, Brush, ReferenceLine } from 'recharts';
import { Candle, Order, PriceAlert } from '../types';

interface CandleChartProps {
  data: Candle[];
  showEMA20?: boolean;
  showEMA50?: boolean;
  showEMA200?: boolean;
  showBollinger?: boolean;
  showMACD?: boolean;
  showRSI?: boolean;
  showStochRSI?: boolean;
  showVolume?: boolean;
  userAverageBuyPrice?: number;
  activeOrders?: Order[];
  priceAlerts?: PriceAlert[];
}

const CustomCandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;

  if (!payload) return null;

  const { open, close, high, low, isBuyCandle, buyVolume, sellVolume, tradeCount } = payload;

  // Priority: Buy/Sell volume > price movement for candle color
  let color;
  if (buyVolume > sellVolume) {
    // Predominantly buy - bright green
    color = '#00E054';
  } else if (sellVolume > buyVolume) {
    // Predominantly sell - bright red
    color = '#FF3B30';
  } else {
    // Equal volume or no volume - use price movement
    const isUp = close >= open;
    color = isUp ? '#00E054' : '#FF3B30';
  }

  // Make sure we have valid dimensions
  if (!x || !y || !width || !height || width <= 0 || height <= 0) {
    return null;
  }

  // Use simplified rendering that works with chart coordinate system
  const isUpCandle = close >= open;
  const bodyHeight = Math.max(height * 0.4, 3); // Standard body height
  const bodyTop = y + (isUpCandle ? height - bodyHeight : 0);

  // Add subtle glow for high volume candles
  const glowIntensity = Math.min((buyVolume + sellVolume) / 1000, 1);
  const glowSize = glowIntensity > 0.5 ? 2 : 0;

  return (
    <g>
      {/* Glow effect for high volume */}
      {glowSize > 0 && (
        <rect
          x={x - glowSize}
          y={bodyTop - glowSize}
          width={width + glowSize * 2}
          height={bodyHeight + glowSize * 2}
          fill={color}
          opacity={0.3 * glowIntensity}
        />
      )}

      {/* Candle wick */}
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={color} strokeWidth={1} />

      {/* Candle body */}
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} stroke={color} />

      {/* Trade count indicator for very active candles */}
      {tradeCount > 5 && (
        <circle
          cx={x + width}
          cy={bodyTop}
          r={3}
          fill="#FFD700"
          stroke="#000"
          strokeWidth={0.5}
        />
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const candlePayload = payload.find((p: any) => p.dataKey === 'close')?.payload;
    if (!candlePayload) return null;

    const { open, high, low, close, volume, buyVolume, sellVolume, tradeCount, ema20, ema50, ema200, bollinger, rsi, macd, stochRsi } = candlePayload;
    const isUp = close >= open;
    const isPredominantlyBuy = buyVolume > sellVolume;

    return (
      <div className="bg-[#050505]/95 border border-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-md shadow-xl text-xs font-mono z-50 min-w-[150px] sm:min-w-[200px] max-w-[90vw]">
        <div className="text-gray-400 mb-2 font-sans font-bold uppercase tracking-wider text-[10px] sm:text-xs">{label}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2 border-b border-white/10 pb-2">
           <span className="text-gray-500">O:</span> <span className={isUp ? 'text-green-400' : 'text-red-400'}>{open.toFixed(6)}</span>
           <span className="text-gray-500">H:</span> <span>{high.toFixed(6)}</span>
           <span className="text-gray-500">L:</span> <span>{low.toFixed(6)}</span>
           <span className="text-gray-500">C:</span> <span className={isUp ? 'text-green-400' : 'text-red-400'}>{close.toFixed(6)}</span>
           <span className="text-gray-500">Trades:</span> <span className="text-yellow-400">{tradeCount}</span>
        </div>

        {/* Buy/Sell Volume Info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2 border-b border-white/10 pb-2">
           <div>
              <span className="text-gray-500">Buy Vol:</span>
              <span className="text-green-400"> {Math.floor(buyVolume).toLocaleString()}</span>
           </div>
           <div>
              <span className="text-gray-500">Sell Vol:</span>
              <span className="text-red-400"> {Math.floor(sellVolume).toLocaleString()}</span>
           </div>
           <div className="col-span-2">
              <span className="text-gray-500">Total Vol:</span>
              <span className="text-white font-bold"> {Math.floor(volume).toLocaleString()}</span>
           </div>
           <div className="col-span-2">
              <span className="text-gray-500">Dominance:</span>
              <span className={isPredominantlyBuy ? 'text-green-400' : 'text-red-400'}>
                 {isPredominantlyBuy ? 'BUY' : 'SELL'} ({Math.floor((isPredominantlyBuy ? buyVolume : sellVolume) / (buyVolume + sellVolume) * 100)}%)
              </span>
           </div>
        </div>

        {/* Indicators Info */}
        <div className="space-y-1">
            {ema20 && <div className="text-purple-400">EMA(20): {ema20.toFixed(6)}</div>}
            {ema50 && <div className="text-blue-400">EMA(50): {ema50.toFixed(6)}</div>}
            {ema200 && <div className="text-yellow-400">EMA(200): {ema200.toFixed(6)}</div>}
            {bollinger && (
               <div className="text-orange-400 flex flex-col">
                  <span>BB Upper: {bollinger.upper.toFixed(6)}</span>
                  <span>BB Lower: {bollinger.lower.toFixed(6)}</span>
               </div>
            )}
            {rsi && <div className="text-cyan-400">RSI(14): {rsi.toFixed(2)}</div>}
            {macd && <div className="text-pink-400">MACD: {macd.histogram.toFixed(6)}</div>}
            {stochRsi && <div className="text-lime-400">Stoch: {stochRsi.k.toFixed(1)}</div>}
        </div>
      </div>
    );
  }
  return null;
};

const VolumeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const volumePayload = payload.find((p: any) => p.dataKey === 'volume')?.payload;
    if (!volumePayload) return null;

    const { volume, buyVolume, sellVolume, tradeCount } = volumePayload;
    const totalVolume = buyVolume + sellVolume;
    const isPredominantlyBuy = buyVolume > sellVolume;
    const dominancePercent = totalVolume > 0 ? Math.floor((isPredominantlyBuy ? buyVolume : sellVolume) / totalVolume * 100) : 0;

    return (
      <div className="bg-[#050505]/95 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-xl text-xs font-mono z-50 min-w-[180px]">
        <div className="text-gray-400 mb-2 font-sans font-bold uppercase tracking-wider">{label}</div>

        {/* Volume Info */}
        <div className="space-y-1">
           <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Volume:</span>
              <span className="text-white font-bold">{Math.floor(volume).toLocaleString()}</span>
           </div>

           <div className="flex justify-between items-center">
              <span className="text-gray-500">Buy Volume:</span>
              <span className="text-green-400">{Math.floor(buyVolume).toLocaleString()}</span>
           </div>

           <div className="flex justify-between items-center">
              <span className="text-gray-500">Sell Volume:</span>
              <span className="text-red-400">{Math.floor(sellVolume).toLocaleString()}</span>
           </div>

           <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="text-gray-500">Dominance:</span>
              <span className={isPredominantlyBuy ? 'text-green-400' : 'text-red-400'}>
                 {isPredominantlyBuy ? 'BUY' : 'SELL'} ({dominancePercent}%)
              </span>
           </div>

           <div className="flex justify-between items-center">
              <span className="text-gray-500">Trades:</span>
              <span className="text-yellow-400">{tradeCount}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

const CandleChartComponent: React.FC<CandleChartProps> = ({
    data, showEMA20, showEMA50, showEMA200, showBollinger, showRSI, showMACD, showStochRSI, showVolume = true,
    userAverageBuyPrice, activeOrders = [], priceAlerts = []
}) => {
  const [chartWidth, setChartWidth] = React.useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        const width = containerRef.current?.clientWidth || 0;
        // Calculate optimal chart width (container width minus Y-axis space)
        // Y-axis is 60px plus small margin
        setChartWidth(Math.max(width - 65, 300)); // Minimum 300px for chart
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  // Always render chart container, even with minimal data
  // Use fallback data if absolutely necessary
  const chartData = data.length > 0 ? data : [{
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    open: 0.000001,
    high: 0.0000011,
    low: 0.0000009,
    close: 0.000001,
    volume: 1000,
    buyVolume: 500,
    sellVolume: 500,
    tradeCount: 1,
    isBuyCandle: true
  }];

  // Debug: Check all indicator data
  console.log('=== CandleChart Component Render ===');
  console.log('Props received:', { showRSI, showMACD, showStochRSI, showBollinger, showVolume });
  console.log('Data length:', chartData.length);

  if (chartData.length > 0) {
    const firstCandle = chartData[0];
    const lastCandle = chartData[chartData.length - 1];

    console.log('First candle indicators:', {
      ema20: firstCandle.ema20,
      ema50: firstCandle.ema50,
      ema200: firstCandle.ema200,
      bollinger: firstCandle.bollinger,
      rsi: firstCandle.rsi,
      macd: firstCandle.macd,
      stochRsi: firstCandle.stochRsi
    });

    console.log('Last candle indicators:', {
      ema20: lastCandle.ema20,
      ema50: lastCandle.ema50,
      ema200: lastCandle.ema200,
      bollinger: lastCandle.bollinger,
      rsi: lastCandle.rsi,
      macd: lastCandle.macd,
      stochRsi: lastCandle.stochRsi
    });

    // Count candles with indicator data
    const withRSI = chartData.filter(d => d.rsi !== undefined).length;
    const withMACD = chartData.filter(d => d.macd !== undefined).length;
    const withStoch = chartData.filter(d => d.stochRsi !== undefined).length;
    console.log('Candles with indicator data:', { withRSI, withMACD, withStoch });
  }
  console.log('=====================================');

  const minPrice = Math.min(...chartData.map(d => d.low));
  const maxPrice = Math.max(...chartData.map(d => d.high));
  let padding = (maxPrice - minPrice) * 0.1;
  if (padding === 0 || padding < minPrice * 0.01) padding = minPrice * 0.02 || 0.000001;

  const formattedData = chartData.map((d, index) => {
    // Create fallback Bollinger data if missing (for testing)
    let bollinger = d.bollinger;
    if (!bollinger && index >= 19 && showBollinger) {
      // Simple fallback calculation for testing
      const period = 20;
      const slice = chartData.slice(Math.max(0, index - period + 1), index + 1);
      if (slice.length >= period) {
        const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
        const sma = sum / period;
        const variance = slice.reduce((acc, curr) => acc + Math.pow(curr.close - sma, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        bollinger = {
          upper: sma + (stdDev * 2),
          middle: sma,
          lower: sma - (stdDev * 2)
        };
      }
    }

    return {
      ...d,
      // Bollinger (existing)
      bollingerUpper: bollinger ? bollinger.upper : null,
      bollingerLower: bollinger ? bollinger.lower : null,
      bollingerMiddle: bollinger ? bollinger.middle : null,
      hasBollinger: !!bollinger,
      // Explicit indicator preservation for Recharts
      rsi: d.rsi !== undefined ? d.rsi : null,
      macd: d.macd ? {
        macdLine: d.macd.macdLine !== undefined ? d.macd.macdLine : 0,
        signalLine: d.macd.signalLine !== undefined ? d.macd.signalLine : 0,
        histogram: d.macd.histogram !== undefined ? d.macd.histogram : 0
      } : null,
      stochRsi: d.stochRsi ? {
        k: d.stochRsi.k !== undefined ? d.stochRsi.k : 50,
        d: d.stochRsi.d !== undefined ? d.stochRsi.d : 50
      } : null
    };
  });

  // Layout calculations - use fixed pixel heights for better ResponsiveContainer compatibility
  const hasIndicators = showRSI || showMACD || showStochRSI;
  const indicatorCount = (showRSI ? 1 : 0) + (showMACD ? 1 : 0) + (showStochRSI ? 1 : 0);

  // Data validation: Check if indicator data actually exists
  const hasValidRSI = showRSI && formattedData.some(d => d.rsi !== undefined && d.rsi !== null);
  const hasValidMACD = showMACD && formattedData.some(d => d.macd !== undefined && d.macd !== null);
  const hasValidStoch = showStochRSI && formattedData.some(d => d.stochRsi !== undefined && d.stochRsi !== null);

  // Count candles with indicator data
  const rsiCount = formattedData.filter(d => d.rsi !== undefined && d.rsi !== null).length;
  const macdCount = formattedData.filter(d => d.macd !== undefined && d.macd !== null).length;
  const stochCount = formattedData.filter(d => d.stochRsi !== undefined && d.stochRsi !== null).length;

  // Log validation results for debugging
  if (showRSI || showMACD || showStochRSI) {
    console.log('🔍 [CandleChart] Indicator Data Validation:', {
      totalDataPoints: formattedData.length,
      rsi: { enabled: showRSI, valid: hasValidRSI, count: rsiCount },
      macd: { enabled: showMACD, valid: hasValidMACD, count: macdCount },
      stochRsi: { enabled: showStochRSI, valid: hasValidStoch, count: stochCount }
    });
  }

  let mainChartHeight = 500;
  let volumeChartHeight = 0;
  let subChartHeight = 0;

  if (showVolume || hasIndicators) {
    if (showVolume && !hasIndicators) {
      // Only volume shown - give main chart more space
      mainChartHeight = 400;
      volumeChartHeight = 100;
    } else if (showVolume && hasIndicators) {
      // Volume + indicators - balanced layout
      mainChartHeight = 300;
      volumeChartHeight = 75;
      // Ensure minimum 100px height per indicator, prevent division by zero
      subChartHeight = indicatorCount > 0
        ? Math.max(100, Math.floor(125 / indicatorCount))
        : 0;
    } else if (!showVolume && hasIndicators) {
      // Only indicators - give main chart more space
      mainChartHeight = 350;
      // Ensure minimum 100px height per indicator, prevent division by zero
      subChartHeight = indicatorCount > 0
        ? Math.max(100, Math.floor(150 / indicatorCount))
        : 0;
    }
  }

  const totalHeight = mainChartHeight + volumeChartHeight + (subChartHeight * indicatorCount);

  return (
    <div className="w-full flex flex-col" style={{ height: `${totalHeight}px`, minHeight: totalHeight, width: '100%', position: 'relative' }}>
        {/* Main Price Chart */}
        <div ref={containerRef} style={{ height: mainChartHeight, transition: 'height 0.3s', minHeight: 200, flex: '0 0 auto', width: '100%', overflow: 'visible', position: 'relative', display: 'block' }}>
            {chartWidth > 0 && (
              <ComposedChart width={chartWidth} height={mainChartHeight} data={formattedData} margin={{ top: 8, right: 5, left: 5, bottom: 0 }} syncId="anyId">
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis 
                    dataKey="time" 
                    stroke="#333" 
                    tick={{fontSize: 10, fill: '#444', fontFamily: 'monospace'}} 
                    minTickGap={40}
                    axisLine={false}
                    tickLine={false}
                    hide={showVolume || hasIndicators} // Hide X axis if subcharts exist
                />
                <YAxis
                    domain={[minPrice - padding, maxPrice + padding]}
                    stroke="#666"
                    tick={{fontSize: 10, fill: '#888', fontFamily: 'monospace', fontWeight: 'bold'}}
                    tickFormatter={(val) => val >= 0.000001 ? `$${val.toFixed(6)}` : `$${val.toExponential(2)}`}
                    width={60}
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    mirror={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                
                {/* Overlays */}
                {showBollinger && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="bollingerUpper"
                      stroke="#f97316"
                      strokeWidth={1}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="bollingerMiddle"
                      stroke="#f97316"
                      strokeWidth={1}
                      dot={false}
                      connectNulls={false}
                      strokeDasharray="3 3"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="bollingerLower"
                      stroke="#f97316"
                      strokeWidth={1}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </>
                )}
                
                {showEMA20 && <Line type="monotone" dataKey="ema20" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />}
                {showEMA50 && <Line type="monotone" dataKey="ema50" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />}
                {showEMA200 && <Line type="monotone" dataKey="ema200" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />}
                
                {/* User Lines */}
                {userAverageBuyPrice && userAverageBuyPrice > 0 && (
                  <ReferenceLine y={userAverageBuyPrice} stroke="#D4AF37" strokeDasharray="3 3" label={{ position: 'insideRight', value: 'AVG BUY', fill: '#D4AF37', fontSize: 10, fontWeight: 'bold' }} />
                )}

                <Bar dataKey="close" shape={<CustomCandleShape />} isAnimationActive={false}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#00E054' : '#FF3B30'} />
                ))}
                </Bar>
                
                {/* Only show brush on main chart if it's the only chart */}
                {!showVolume && !hasIndicators && <Brush dataKey="time" height={30} stroke="#333" fill="#0A0A0A" tickFormatter={() => ''} y={510} />}
              </ComposedChart>
            )}
        </div>

        {/* Volume Subchart */}
        {showVolume && volumeChartHeight > 0 && (
            <div style={{ height: volumeChartHeight, borderTop: '1px solid #222', flex: '0 0 auto' }}>
                <ResponsiveContainer width="100%" height={volumeChartHeight}>
                    <ComposedChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <YAxis
                            domain={[0, 'dataMax']}
                            orientation="right"
                            width={80}
                            tick={{fontSize: 9, fill: '#666'}}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(0)}
                        />
                        <XAxis dataKey="time" hide />
                        <Tooltip content={<VolumeTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />

                        {/* Volume Bars */}
                        <Bar
                            dataKey="volume"
                            fill="#00E054"
                            fillOpacity={0.5}
                            isAnimationActive={false}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`volume-cell-${index}`} fill={
                                    entry.buyVolume > entry.sellVolume ? '#00E054' :
                                    entry.sellVolume > entry.buyVolume ? '#FF3B30' :
                                    '#666'
                                } />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        )}

        {/* RSI Subchart */}
        {hasValidRSI && subChartHeight > 0 && (
            <div style={{ height: subChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', backgroundColor: '#0a0a0a', position: 'relative' }}>
                <ResponsiveContainer width="100%" height={subChartHeight}>
                    <ComposedChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} syncId="anyId">
                        <YAxis domain={[0, 100]} orientation="right" width={80} tick={{fontSize: 9, fill: '#444'}} axisLine={false} tickLine={false} ticks={[30, 50, 70]} />
                        <XAxis dataKey="time" hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                        <ReferenceLine y={70} stroke="#444" strokeDasharray="3 3" />
                        <ReferenceLine y={30} stroke="#444" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="rsi" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        )}

        {/* MACD Subchart */}
        {hasValidMACD && subChartHeight > 0 && (
            <div style={{ height: subChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', backgroundColor: '#0a0a0a' }}>
                <ResponsiveContainer width="100%" height={subChartHeight}>
                    <ComposedChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} syncId="anyId">
                        <YAxis domain={['auto', 'auto']} orientation="right" width={80} tick={{fontSize: 9, fill: '#444'}} axisLine={false} tickLine={false} />
                        <XAxis dataKey="time" hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                        <ReferenceLine y={0} stroke="#444" />
                        <Bar dataKey="macd.histogram" fill="#ec4899" isAnimationActive={false}>
                            {formattedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={(entry.macd?.histogram || 0) > 0 ? '#00E054' : '#FF3B30'} />
                            ))}
                        </Bar>
                        <Line type="monotone" dataKey="macd.macdLine" stroke="#fff" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                        <Line type="monotone" dataKey="macd.signalLine" stroke="#f59e0b" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        )}

        {/* StochRSI Subchart */}
        {hasValidStoch && subChartHeight > 0 && (
            <div style={{ height: subChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', backgroundColor: '#0a0a0a' }}>
                <ResponsiveContainer width="100%" height={subChartHeight}>
                    <ComposedChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} syncId="anyId">
                        <YAxis domain={[0, 100]} orientation="right" width={80} tick={{fontSize: 9, fill: '#444'}} axisLine={false} tickLine={false} ticks={[20, 80]} />
                        <XAxis dataKey="time" hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                        <ReferenceLine y={80} stroke="#444" strokeDasharray="3 3" />
                        <ReferenceLine y={20} stroke="#444" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="stochRsi.k" stroke="#84cc16" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                        <Line type="monotone" dataKey="stochRsi.d" stroke="#fff" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        )}
    </div>
  );
};

// Memoize with custom comparison for performance optimization
export const CandleChart = React.memo(CandleChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data[prevProps.data.length - 1]?.timestamp === nextProps.data[nextProps.data.length - 1]?.timestamp &&
    prevProps.showEMA20 === nextProps.showEMA20 &&
    prevProps.showEMA50 === nextProps.showEMA50 &&
    prevProps.showEMA200 === nextProps.showEMA200 &&
    prevProps.showBollinger === nextProps.showBollinger &&
    prevProps.showRSI === nextProps.showRSI &&
    prevProps.showMACD === nextProps.showMACD &&
    prevProps.showStochRSI === nextProps.showStochRSI &&
    prevProps.showVolume === nextProps.showVolume &&
    prevProps.userAverageBuyPrice === nextProps.userAverageBuyPrice
  );
});

CandleChart.displayName = 'CandleChart';
