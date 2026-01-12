
import React from 'react';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, Tooltip, Cell, CartesianGrid, Brush, ReferenceLine } from 'recharts';
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

    </g>
  );
};

const IndicatorTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-[#050505]/95 border border-white/10 rounded-lg p-2 sm:p-3 backdrop-blur-md shadow-xl text-xs font-mono z-50 min-w-[160px] max-w-[90vw]">
      <div className="text-gray-400 mb-2 font-sans font-bold uppercase tracking-wider text-[10px] sm:text-xs">{label}</div>
      <div className="space-y-1">
        {point.rsi !== null && point.rsi !== undefined && (
          <div className="flex justify-between gap-2 text-cyan-400">
            <span>RSI</span>
            <span>{point.rsi.toFixed(2)}</span>
          </div>
        )}
        {(point.macd_macdLine !== null && point.macd_macdLine !== undefined) && (
          <div className="flex justify-between gap-2 text-white">
            <span>MACD</span>
            <span>{point.macd_macdLine.toFixed(6)}</span>
          </div>
        )}
        {(point.macd_signalLine !== null && point.macd_signalLine !== undefined) && (
          <div className="flex justify-between gap-2 text-amber-300">
            <span>Signal</span>
            <span>{point.macd_signalLine.toFixed(6)}</span>
          </div>
        )}
        {(point.macd_histogram !== null && point.macd_histogram !== undefined) && (
          <div className="flex justify-between gap-2 text-pink-400">
            <span>Histogram</span>
            <span>{point.macd_histogram.toFixed(6)}</span>
          </div>
        )}
        {(point.stochRsi_k !== null && point.stochRsi_k !== undefined) && (
          <div className="flex justify-between gap-2 text-lime-400">
            <span>Stoch %K</span>
            <span>{point.stochRsi_k.toFixed(2)}</span>
          </div>
        )}
        {(point.stochRsi_d !== null && point.stochRsi_d !== undefined) && (
          <div className="flex justify-between gap-2 text-white">
            <span>Stoch %D</span>
            <span>{point.stochRsi_d.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const candlePayload = payload.find((p: any) => p.dataKey === 'close')?.payload;
    if (!candlePayload) return null;

    const { open, high, low, close, volume, buyVolume, sellVolume, tradeCount, ema20, ema50, ema200, bollinger, rsi, macd_macdLine, macd_signalLine, macd_histogram, stochRsi_k, stochRsi_d } = candlePayload;
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
            {macd_histogram !== null && macd_histogram !== undefined && <div className="text-pink-400">MACD: {macd_histogram.toFixed(6)}</div>}
            {stochRsi_k !== null && stochRsi_k !== undefined && <div className="text-lime-400">Stoch: {stochRsi_k.toFixed(1)}</div>}
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
  const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const formatTimeTick = React.useCallback((ts: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  React.useEffect(() => {
    const updateWidth = () => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth || 0;
      // Use full container width so tooltip/cursor math matches rendered bars
      setChartWidth(Math.max(width, 300)); // Minimum 300px for chart
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
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
      // No need to preserve indicators - data is already flat from chartUtils
      rsi: d.rsi !== undefined ? d.rsi : null,
      macd_macdLine: d.macd_macdLine !== undefined ? d.macd_macdLine : null,
      macd_signalLine: d.macd_signalLine !== undefined ? d.macd_signalLine : null,
      macd_histogram: d.macd_histogram !== undefined ? d.macd_histogram : null,
      stochRsi_k: d.stochRsi_k !== undefined ? d.stochRsi_k : null,
      stochRsi_d: d.stochRsi_d !== undefined ? d.stochRsi_d : null
    };
  });

  // Layout calculations - use fixed pixel heights for better ResponsiveContainer compatibility
  const hasIndicators = showRSI || showMACD || showStochRSI;
  const indicatorCount = (showRSI ? 1 : 0) + (showMACD ? 1 : 0) + (showStochRSI ? 1 : 0);

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
              <ComposedChart
                width={chartWidth}
                height={mainChartHeight}
                data={formattedData}
                margin={{ top: 8, right: 5, left: 5, bottom: 0 }}
                syncId="anyId"
                syncMethod="index"
                onMouseEnter={() => setActiveTooltip('main')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis 
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    tickFormatter={formatTimeTick}
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
                    tickFormatter={(val: number) => val >= 0.000001 ? `$${val.toFixed(6)}` : `$${val.toExponential(2)}`}
                    width={60}
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    mirror={false}
                />
                <Tooltip 
                  active={activeTooltip === 'main'}
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  allowEscapeViewBox={{ x: false, y: true }}
                  wrapperStyle={{
                    zIndex: 9999,
                    pointerEvents: 'none',
                    maxWidth: 'min(340px, calc(100vw - 16px))'
                  }}
                />
                
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
            <div style={{ height: volumeChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', width: '100%' }}>
                {chartWidth > 0 && (
                    <ComposedChart width={chartWidth} height={volumeChartHeight} data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }} syncId="anyId" syncMethod="index" onMouseEnter={() => setActiveTooltip('volume')} onMouseLeave={() => setActiveTooltip(null)}>
                        <YAxis
                            domain={[0, 'dataMax']}
                            orientation="right"
                            width={60}
                            tick={{fontSize: 9, fill: '#666'}}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val: number) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(0)}
                        />
                        <XAxis 
                            dataKey="timestamp" 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                            tickFormatter={formatTimeTick}
                            stroke="#333" 
                            tick={{fontSize: 10, fill: '#444', fontFamily: 'monospace'}} 
                            minTickGap={40}
                            axisLine={false}
                            tickLine={false}
                            hide={hasIndicators} // Only hide if there are indicators below
                        />
                        <Tooltip 
                          active={activeTooltip === 'volume'}
                          content={<VolumeTooltip />} 
                          cursor={{ stroke: 'rgba(255,255,255,0.05)' }} 
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperStyle={{
                            zIndex: 9999,
                            maxWidth: 'min(320px, calc(100vw - 16px))',
                            pointerEvents: 'none'
                          }}
                        />

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
                )}
            </div>
        )}

        {/* RSI Subchart */}
        {showRSI && subChartHeight > 0 && (
            <div style={{ height: subChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', backgroundColor: '#0a0a0a', position: 'relative', width: '100%' }}>
                {chartWidth > 0 && (
                    <ComposedChart width={chartWidth} height={subChartHeight} data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }} syncId="anyId" syncMethod="index" onMouseEnter={() => setActiveTooltip('rsi')} onMouseLeave={() => setActiveTooltip(null)}>
                        <YAxis domain={[0, 100]} orientation="right" width={60} tick={{fontSize: 9, fill: '#444'}} axisLine={false} tickLine={false} ticks={[30, 50, 70]} />
                        <XAxis 
                            dataKey="timestamp" 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                            tickFormatter={formatTimeTick}
                            stroke="#333" 
                            tick={{fontSize: 10, fill: '#444', fontFamily: 'monospace'}} 
                            minTickGap={40}
                            axisLine={false}
                            tickLine={false}
                            hide={showMACD || showStochRSI} // Hide if indicators below
                        />
                        <Tooltip 
                          active={activeTooltip === 'rsi'}
                          content={<IndicatorTooltip />} 
                          cursor={{ stroke: 'rgba(255,255,255,0.1)' }} 
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperStyle={{
                            zIndex: 9999,
                            maxWidth: 'min(320px, calc(100vw - 16px))',
                            pointerEvents: 'none'
                          }}
                        />
                        <ReferenceLine y={70} stroke="#444" strokeDasharray="3 3" />
                        <ReferenceLine y={30} stroke="#444" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="rsi" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                )}
            </div>
        )}

        {/* MACD Subchart */}
        {showMACD && subChartHeight > 0 && (
            <div style={{ height: subChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', backgroundColor: '#0a0a0a', width: '100%' }}>
                {chartWidth > 0 && (
                    <ComposedChart width={chartWidth} height={subChartHeight} data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }} syncId="anyId" syncMethod="index" onMouseEnter={() => setActiveTooltip('macd')} onMouseLeave={() => setActiveTooltip(null)}>
                        <YAxis domain={['auto', 'auto']} orientation="right" width={60} tick={{fontSize: 9, fill: '#444'}} axisLine={false} tickLine={false} />
                        <XAxis 
                            dataKey="timestamp" 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                            tickFormatter={formatTimeTick}
                            stroke="#333" 
                            tick={{fontSize: 10, fill: '#444', fontFamily: 'monospace'}} 
                            minTickGap={40}
                            axisLine={false}
                            tickLine={false}
                            hide={showStochRSI} // Hide if indicators below
                        />
                        <Tooltip 
                          active={activeTooltip === 'macd'}
                          content={<IndicatorTooltip />} 
                          cursor={{ stroke: 'rgba(255,255,255,0.1)' }} 
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperStyle={{
                            zIndex: 9999,
                            maxWidth: 'min(320px, calc(100vw - 16px))',
                            pointerEvents: 'none'
                          }}
                        />
                        <ReferenceLine y={0} stroke="#444" />
                        <Bar dataKey="macd_histogram" fill="#ec4899" isAnimationActive={false}>
                            {formattedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={(entry.macd_histogram || 0) > 0 ? '#00E054' : '#FF3B30'} />
                            ))}
                        </Bar>
                        <Line type="monotone" dataKey="macd_macdLine" stroke="#fff" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                        <Line type="monotone" dataKey="macd_signalLine" stroke="#f59e0b" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                )}
            </div>
        )}

        {/* StochRSI Subchart */}
        {showStochRSI && subChartHeight > 0 && (
            <div style={{ height: subChartHeight, borderTop: '1px solid #222', flex: '0 0 auto', backgroundColor: '#0a0a0a', width: '100%' }}>
                {chartWidth > 0 && (
                    <ComposedChart width={chartWidth} height={subChartHeight} data={formattedData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }} syncId="anyId" syncMethod="index" onMouseEnter={() => setActiveTooltip('stoch')} onMouseLeave={() => setActiveTooltip(null)}>
                        <YAxis domain={[0, 100]} orientation="right" width={60} tick={{fontSize: 9, fill: '#444'}} axisLine={false} tickLine={false} ticks={[20, 80]} />
                        <XAxis 
                            dataKey="timestamp" 
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                            tickFormatter={formatTimeTick}
                            stroke="#333" 
                            tick={{fontSize: 10, fill: '#444', fontFamily: 'monospace'}} 
                            minTickGap={40}
                            axisLine={false}
                            tickLine={false}
                            // Always show XAxis for the last chart
                        />
                        <Tooltip 
                          active={activeTooltip === 'stoch'}
                          content={<IndicatorTooltip />} 
                          cursor={{ stroke: 'rgba(255,255,255,0.1)' }} 
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperStyle={{
                            zIndex: 9999,
                            maxWidth: 'min(320px, calc(100vw - 16px))',
                            pointerEvents: 'none'
                          }}
                        />
                        <ReferenceLine y={80} stroke="#444" strokeDasharray="3 3" />
                        <ReferenceLine y={20} stroke="#444" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="stochRsi_k" stroke="#84cc16" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                        <Line type="monotone" dataKey="stochRsi_d" stroke="#fff" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                )}
            </div>
        )}
    </div>
  );
};

export const CandleChart = CandleChartComponent;
