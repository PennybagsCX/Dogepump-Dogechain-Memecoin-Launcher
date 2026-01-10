
import { PricePoint, Candle, Trade } from '../types';

export const generateCandles = (history: PricePoint[], timeframe: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W'): Candle[] => {
  if (!history || history.length === 0) return [];

  // Determine bucket size in milliseconds
  let bucketSize = 60 * 1000; // Default 1 minute candles
  let limit = 200; // Increased limit to ensure enough data for EMA 200

  switch (timeframe) {
    case '1m':
      bucketSize = 5 * 1000; // 5s buckets for 1m view
      limit = 300; // Show last ~25 minutes of data (enough for Bollinger Bands)
      break;
    case '5m':
      bucketSize = 10 * 1000; // 10s buckets for 5m view
      limit = 250; // Show last ~40 minutes of data (enough for Bollinger Bands)
      break;
    case '15m':
      bucketSize = 30 * 1000; // 30s buckets
      limit = 200; // Show last ~100 minutes of data (enough for Bollinger Bands)
      break;
    case '1H':
      bucketSize = 2 * 60 * 1000; // 2m buckets
      limit = 150; // Show last ~5 hours of data (enough for Bollinger Bands)
      break;
    case '4H':
      bucketSize = 15 * 60 * 1000; // 15m buckets
      limit = 120; // Show last ~30 hours of data (enough for Bollinger Bands)
      break;
    case '1D':
      bucketSize = 60 * 60 * 1000; // 1h buckets
      limit = 150; // Show last ~150 hours of data (enough for Bollinger Bands)
      break;
    case '1W':
      bucketSize = 4 * 60 * 60 * 1000; // 4h buckets for weekly view
      limit = 100; // Show last ~400 hours of data (enough for Bollinger Bands)
      break;
  }

  // Filter history based on timeframe duration plus buffer for indicators
  const startTime = Date.now() - (bucketSize * (limit + 250)); // Buffer for EMA200
  const relevantData = history.filter(p => p.timestamp >= startTime);

  if (relevantData.length === 0) return [];

  const candles: Candle[] = [];
  let currentBucketStart = Math.floor(relevantData[0].timestamp / bucketSize) * bucketSize;
  let bucketPoints: PricePoint[] = [];

  // Sort by timestamp just in case
  relevantData.sort((a, b) => a.timestamp - b.timestamp);

  for (const point of relevantData) {
    const pointBucketStart = Math.floor(point.timestamp / bucketSize) * bucketSize;

    if (pointBucketStart !== currentBucketStart) {
      // Close current bucket
      if (bucketPoints.length > 0) {
        candles.push(createCandle(currentBucketStart, bucketPoints));
      } else if (candles.length > 0) {
        // Fill gap with flat candle (doji) based on prev close
        const prevClose = candles[candles.length - 1].close;
        candles.push({
            time: formatTime(currentBucketStart),
            timestamp: currentBucketStart,
            open: prevClose,
            high: prevClose,
            low: prevClose,
            close: prevClose,
            volume: 0,
            buyVolume: 0,
            sellVolume: 0,
            tradeCount: 0,
            isBuyCandle: false
        });
      }

      // Move cursor
      currentBucketStart = pointBucketStart;
      bucketPoints = [];
    }
    bucketPoints.push(point);
  }

  // Push last bucket
  if (bucketPoints.length > 0) {
    candles.push(createCandle(currentBucketStart, bucketPoints));
  }

  return candles;
};

// Generate candles from trade data - this is the main function we should use
export const generateCandlesFromTrades = (trades: Trade[], timeframe: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W'): Candle[] => {
  if (!trades || trades.length === 0) return [];

  console.log(`generateCandlesFromTrades: Input trades: ${trades.length} for timeframe ${timeframe}`);
  trades.forEach((t, i) => console.log(`  Trade ${i}: ${t.type} ${t.amountDC}DC at ${t.price}, timestamp: ${new Date(t.timestamp).toLocaleTimeString()}`));

  // Determine bucket size in milliseconds
  let bucketSize = 60 * 1000; // Default 1 minute candles
  let limit = 200;

  switch (timeframe) {
    case '1m':
      bucketSize = 5 * 1000; // 5s buckets for 1m view
      limit = 300; // Show last ~25 minutes of data (enough for Bollinger Bands)
      break;
    case '5m':
      bucketSize = 10 * 1000; // 10s buckets for 5m view
      limit = 250; // Show last ~40 minutes of data (enough for Bollinger Bands)
      break;
    case '15m':
      bucketSize = 30 * 1000; // 30s buckets
      limit = 200; // Show last ~100 minutes of data (enough for Bollinger Bands)
      break;
    case '1H':
      bucketSize = 2 * 60 * 1000; // 2m buckets
      limit = 150; // Show last ~5 hours of data (enough for Bollinger Bands)
      break;
    case '4H':
      bucketSize = 15 * 60 * 1000; // 15m buckets
      limit = 120; // Show last ~30 hours of data (enough for Bollinger Bands)
      break;
    case '1D':
      bucketSize = 60 * 60 * 1000; // 1h buckets
      limit = 150; // Show last ~150 hours of data (enough for Bollinger Bands)
      break;
    case '1W':
      bucketSize = 4 * 60 * 60 * 1000; // 4h buckets for weekly view
      limit = 100; // Show last ~400 hours of data (enough for Bollinger Bands)
      break;
  }

  console.log(`Timeframe ${timeframe}: bucketSize=${bucketSize}ms, limit=${limit}`);

  // Filter trades based on timeframe duration
  const startTime = Date.now() - (bucketSize * limit);
  const relevantTrades = trades.filter(t => t.timestamp >= startTime);

  console.log(`Filtered to ${relevantTrades.length} trades in timeframe (since ${new Date(startTime).toLocaleTimeString()})`);

  if (relevantTrades.length === 0) return [];

  // Sort by timestamp
  relevantTrades.sort((a, b) => a.timestamp - b.timestamp);

  const candles: Candle[] = [];
  let currentBucketStart = Math.floor(relevantTrades[0].timestamp / bucketSize) * bucketSize;
  let bucketTrades: Trade[] = [];

  console.log(`Starting bucket processing. First bucket: ${new Date(currentBucketStart).toLocaleTimeString()}`);

  for (const trade of relevantTrades) {
    const tradeBucketStart = Math.floor(trade.timestamp / bucketSize) * bucketSize;

    if (tradeBucketStart !== currentBucketStart) {
      console.log(`Bucket change: ${new Date(currentBucketStart).toLocaleTimeString()} -> ${new Date(tradeBucketStart).toLocaleTimeString()}, bucket has ${bucketTrades.length} trades`);
      // Close current bucket
      if (bucketTrades.length > 0) {
        const candle = createCandleFromTrades(currentBucketStart, bucketTrades);
        console.log(`Created candle:`, candle);
        candles.push(candle);
      }

      // Move cursor
      currentBucketStart = tradeBucketStart;
      bucketTrades = [];
    }
    bucketTrades.push(trade);
  }

  // Push last bucket
  if (bucketTrades.length > 0) {
    console.log(`Final bucket: ${new Date(currentBucketStart).toLocaleTimeString()} has ${bucketTrades.length} trades`);
    const candle = createCandleFromTrades(currentBucketStart, bucketTrades);
    console.log(`Created final candle:`, candle);
    candles.push(candle);
  }

  console.log(`Returning ${candles.length} candles`);
  return candles;
};

const createCandle = (timestamp: number, points: PricePoint[]): Candle => {
  const prices = points.map(p => p.price);
  return {
    time: formatTime(timestamp),
    timestamp,
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    volume: points.reduce((acc, curr) => acc + (curr.volume || 0), 0),
    buyVolume: 0,
    sellVolume: 0,
    tradeCount: 0,
    isBuyCandle: false
  };
};

const createCandleFromTrades = (timestamp: number, trades: Trade[]): Candle => {
  if (trades.length === 0) {
    // Return empty candle if no trades
    return {
      time: formatTime(timestamp),
      timestamp,
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
      tradeCount: 0,
      isBuyCandle: false
    };
  }

  const prices = trades.map(t => t.price);
  const buyTrades = trades.filter(t => t.type === 'buy');
  const sellTrades = trades.filter(t => t.type === 'sell');

  const buyVolume = buyTrades.reduce((acc, t) => acc + t.amountDC, 0);
  const sellVolume = sellTrades.reduce((acc, t) => acc + t.amountDC, 0);
  const totalVolume = buyVolume + sellVolume;

  // Determine if this is predominantly a buy or sell candle
  const isBuyCandle = buyVolume > sellVolume;

  return {
    time: formatTime(timestamp),
    timestamp,
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    volume: totalVolume,
    buyVolume,
    sellVolume,
    tradeCount: trades.length,
    isBuyCandle
  };
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Calculate Simple Moving Average
export const calculateSMA = (data: Candle[], period: number) => {
  return data.map((item, index, arr) => {
    if (index < period - 1) return { ...item, sma: null };
    
    const slice = arr.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    const avg = sum / period;
    
    return { ...item, sma: avg };
  });
};

// Calculate Exponential Moving Average
export const calculateEMA = (data: Candle[], period: number) => {
  const k = 2 / (period + 1);
  let ema = data[0]?.close || 0;
  
  // First calculate initial SMA to start EMA (standard practice)
  // or just use first price if lazy. We'll iterate.
  
  return data.map((item, index) => {
    if (index === 0) {
        ema = item.close;
        return { ...item, [`ema${period}`]: item.close };
    }
    // EMA = Price(t) * k + EMA(y) * (1 – k)
    ema = item.close * k + ema * (1 - k);
    return { ...item, [`ema${period}`]: ema };
  });
};

// Calculate Bollinger Bands
export const calculateBollinger = (data: Candle[], period: number = 20, stdDevMultiplier: number = 2) => {
  return data.map((item, index, arr) => {
    if (index < period - 1) return { ...item, bollinger: null };

    const slice = arr.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    const sma = sum / period;

    const squaredDiffs = slice.map(curr => Math.pow(curr.close - sma, 2));
    const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      ...item,
      bollinger: {
        upper: sma + (stdDev * stdDevMultiplier),
        middle: sma,
        lower: sma - (stdDev * stdDevMultiplier)
      }
    };
  });
};

// Calculate RSI
export const calculateRSI = (data: Candle[], period: number = 14) => {
  if (data.length === 0) {
    console.warn('calculateRSI: Empty data array');
    return [];
  }

  if (data.length < period + 1) {
    console.warn(`calculateRSI: Not enough data points (${data.length}) for RSI period (${period})`);
    // Return data with neutral RSI values instead of empty array
    return data.map((item, index) => ({ ...item, rsi: 50 }));
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    if (i >= data.length) break;
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  return data.map((item, index) => {
    if (index < period) return { ...item, rsi: 50 }; // Neutral start

    const diff = item.close - data[index - 1].close;
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return { ...item, rsi };
  });
};

// Calculate MACD
export const calculateMACD = (data: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  if (data.length === 0) {
    console.warn('calculateMACD: Empty data array');
    return [];
  }

  if (data.length < slowPeriod) {
    console.warn(`calculateMACD: Not enough data points (${data.length}) for slow period (${slowPeriod})`);
    // Return data with neutral MACD values
    return data.map(item => ({
      ...item,
      macd: { macdLine: 0, signalLine: 0, histogram: 0 }
    }));
  }

  // We need to calculate EMAs specifically for MACD usage
  const kFast = 2 / (fastPeriod + 1);
  const kSlow = 2 / (slowPeriod + 1);
  const kSignal = 2 / (signalPeriod + 1);

  let emaFast = data[0]?.close || 0;
  let emaSlow = data[0]?.close || 0;
  let emaSignal = 0;

  return data.map((item, index) => {
    emaFast = item.close * kFast + emaFast * (1 - kFast);
    emaSlow = item.close * kSlow + emaSlow * (1 - kSlow);
    
    const macdLine = emaFast - emaSlow;
    
    // Initialize signal line
    if (index === 0) emaSignal = macdLine;
    else emaSignal = macdLine * kSignal + emaSignal * (1 - kSignal);

    return {
      ...item,
      macd: {
        macdLine,
        signalLine: emaSignal,
        histogram: macdLine - emaSignal
      }
    };
  });
};

// Calculate Stochastic RSI
export const calculateStochRSI = (data: Candle[], period: number = 14) => {
  if (data.length === 0) {
    console.warn('calculateStochRSI: Empty data array');
    return [];
  }

  if (data.length < period * 2) {
    console.warn(`calculateStochRSI: Not enough data points (${data.length}) for period (${period})`);
    // Return data with neutral StochRSI values
    return data.map(item => ({
      ...item,
      stochRsi: { k: 50, d: 50 }
    }));
  }

  // First ensure RSI exists
  const rsiData = calculateRSI(data, period);
  
  return rsiData.map((item, index, arr) => {
    if (index < period * 2) return { ...item, stochRsi: { k: 50, d: 50 } }; // Neutral start

    // Get slice of last 'period' RSIs
    const slice = arr.slice(index - period + 1, index + 1);
    const rsiValues = slice.map(d => d.rsi || 50);
    
    const minRSI = Math.min(...rsiValues);
    const maxRSI = Math.max(...rsiValues);
    
    let stoch = 0;
    if (maxRSI - minRSI !== 0) {
       stoch = ( (item.rsi || 50) - minRSI ) / (maxRSI - minRSI);
    }
    
    // Smooth K and D (usually simple moving average of 3)
    // Simplified for demo: return raw Stoch as K, and previous as D
    return { 
        ...item, 
        stochRsi: { k: stoch * 100, d: stoch * 100 } // Need proper smoothing for real K/D, simplified here
    };
  });
};
