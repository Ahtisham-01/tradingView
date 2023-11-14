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
      time: Math.floor(parseInt(timeStr, 10) / 1000) as unknown as Time,
      open: parseFloat(openStr),
      high: parseFloat(highStr),
      low: parseFloat(lowStr),
      close: parseFloat(closeStr),
    };
  
    const existingCandleIndex = candlesRef.current.findIndex(
      (c) => (c.time as unknown as number) === (newCandle.time as unknown as number)
    );
    if (existingCandleIndex >= 0) {
      candlesRef.current[existingCandleIndex] = newCandle;
    } else {
      candlesRef.current.push(newCandle);
    }
  
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(candlesRef.current);
    }
  }, [lastMessage?.data]);

  
  return <div className="chart-container" ref={containerRef}></div>;
};

export default CandlestickChart;