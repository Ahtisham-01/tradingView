import React, { useEffect, useRef } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, SeriesDataItemTypeMap, Time } from "lightweight-charts";

interface CandlestickChartProps {
    lastMessage: MessageEvent<any> | null;
  }

const CandlestickChart: React.FC<CandlestickChartProps> = ({ lastMessage }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const candlesRef = useRef<SeriesDataItemTypeMap["Candlestick"][]>([]);

  useEffect(() => {
    if (containerRef.current) {
      chartRef.current = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: "rgba(197, 203, 206, 0.8)",
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        layout: {
          background: "#1a1d29" as any,
          textColor: "rgba(255, 255, 255, 0.9)",
        },
        grid: {
          vertLines: {
            color: "rgba(42, 46, 57, 0)",
          },
          horzLines: {
            color: "rgba(42, 46, 57, 0.6)",
          },
        },
        rightPriceScale: {
          borderColor: "rgba(197, 203, 206, 0.8)",
        },
      });

      candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
        priceFormat: {
          type: "custom",
          formatter: (price:any) => price.toFixed(0),
        },
      });

      chartRef.current.timeScale().applyOptions({
        barSpacing: 15,
      });
    }

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, 400);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!lastMessage?.data) return;
  
    const data = JSON.parse(lastMessage.data);
    if (!data || !data.data) return;
  
    const [timeStr, openStr, highStr, lowStr, closeStr] = data.data[0];
    const newCandle = {
      time: Math.floor(parseInt(timeStr, 10) / 1000) as unknown as Time, // Convert to Time type
      open: parseFloat(openStr),
      high: parseFloat(highStr),
      low: parseFloat(lowStr),
      close: parseFloat(closeStr),
    };
  
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const tenMinutesAgo = currentTime - 600; // Time 10 minutes ago in seconds
  
    const updatedCandles = candlesRef.current.filter(
      (c) => (c.time as unknown as number) > tenMinutesAgo // Compare times as numbers
    );
    const existingCandleIndex = updatedCandles.findIndex(
      (c) => (c.time as unknown as number) === (newCandle.time as unknown as number)
    );
    if (existingCandleIndex >= 0) {
      updatedCandles[existingCandleIndex] = newCandle;
    } else {
      updatedCandles.push(newCandle);
    }
  
    candlesRef.current = updatedCandles;
  
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(updatedCandles);
    }
  }, [lastMessage?.data]);
  
  return <div className="chart-container" ref={containerRef}></div>;
};

export default CandlestickChart;