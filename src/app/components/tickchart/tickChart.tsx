import React, { useEffect, useRef } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, DeepPartial, ChartOptions, AreaSeriesPartialOptions, Time } from "lightweight-charts";
import useWebSocket from "react-use-websocket";

interface TickChartProps {
  tickerChannel?: string;
  tickerInstId?: string;
}

const TickChart: React.FC<TickChartProps> = ({
  tickerChannel = "index-tickers",
  tickerInstId = "BTC-USDT",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const markersRef = useRef<Array<any>>([]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const SOCKET_URL = "wss://wspap.okx.com:8443/ws/v5/public";
  const { sendMessage, lastMessage } = useWebSocket(SOCKET_URL, {
    onOpen: () => console.log("WebSocket Connected"),
    shouldReconnect: (closeEvent) => true,
  });

  useEffect(() => {
    const message = {
      op: "subscribe",
      args: [
        {
          channel: tickerChannel,
          instId: tickerInstId,
        },
      ],
    };
    sendMessage(JSON.stringify(message));
  }, [tickerInstId, sendMessage, tickerChannel]);

  useEffect(() => {
    if (!containerRef.current) return;
    
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      containerRef.current.appendChild(tooltip);
      tooltipRef.current = tooltip;

      const chartOptions: DeepPartial<ChartOptions> = {
        width: containerRef.current.clientWidth,
        height: 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
          borderColor: "rgba(197, 203, 206, 0.8)",
          
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        layout: {
            background: "#000000" as any, // Using 'any' to bypass type checking
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
      };

      const areaSeriesOptions: DeepPartial<AreaSeriesPartialOptions> = {
        topColor: "rgba(67, 83, 254, 0.7)",
        bottomColor: "rgba(67, 83, 254, 0.3)",
        lineColor: "rgba(67, 83, 254, 1)",
        lineWidth: 2,
        priceFormat: {
          type: "custom",
          formatter: (price: number) => price.toFixed(0),
        },
      };

      chartRef.current = createChart(containerRef.current, chartOptions);
      areaSeriesRef.current = chartRef.current.addAreaSeries(areaSeriesOptions);

      chartRef.current.subscribeCrosshairMove(function (param) {
        const time = param.time as number;
      
        if (time === undefined || param.point === undefined || !tooltipRef.current || !areaSeriesRef.current) {
            if (tooltipRef.current) {
                tooltipRef.current.style.display = "none";
              }
          return;
        }
      
        const seriesData = param.seriesData.get(areaSeriesRef.current);
      
        // Check if seriesData has a 'value' property
        if (seriesData && 'value' in seriesData && tooltipRef.current) {
          tooltipRef.current.innerHTML = `Time: ${new Date(
            time * 1000
          ).toLocaleString()}<br>Value: ${seriesData.value}`;
          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left = `${param.point.x + 20}px`;
          tooltipRef.current.style.top = `${param.point.y}px`;
        } else if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      });
      
      

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
        if (tooltipRef.current) {
          containerRef.current?.removeChild(tooltipRef.current);
        }
      };
  
  }, []);

  useEffect(() => {
    if (!lastMessage?.data) return;
  
    const data = JSON.parse(lastMessage.data);
    if (!data || !data.data || !areaSeriesRef.current) return;
  
    // Convert the timestamp to seconds (UNIX timestamp)
    const time = Math.floor(parseFloat(data.data[0].ts) / 1000);
    const value = parseFloat(data.data[0].idxPx);
  
    // Create the new point with the correct time format
    const newPoint = { time: time as unknown as Time, value: value };
    areaSeriesRef.current.update(newPoint);
  
    markersRef.current = [{
      time: time as unknown as Time,
      position: "inBar",
      color: "blue",
      shape: "circle",
      id: `marker-${time}`,
    }];
  
    areaSeriesRef.current.setMarkers(markersRef.current);
  }, [lastMessage?.data]);
  
  
  return (
    <div className="chart-container relative z-0" ref={containerRef}></div>
  );
};

export default TickChart;
