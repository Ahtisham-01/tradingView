import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
  AreaSeriesPartialOptions,
  Time,
  LastPriceAnimationMode,
} from "lightweight-charts";
import useWebSocket from "react-use-websocket";
import html2canvas from "html2canvas";
import { fullscreen, snapshot } from "../../utils/svgData";
interface TickChartProps {
  tickerChannel?: string;
  tickerInstId?: string;
}
// Example static data for bets
const staticBets = [
  { time: 1651017600, value: 50000, bet: 100 }, // Example bet data
  // Add more bet data here
];

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

  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const SOCKET_URL = "wss://wspap.okx.com:8443/ws/v5/public?brokerId=9999";
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
      // topColor: "rgba(67, 83, 254, 0.7)",
      // bottomColor: "rgba(67, 83, 254, 0.3)",
      // lineColor: "rgba(67, 83, 254, 1)",
      topColor: 'rgba(251, 192, 45, 0.56)',
      bottomColor: 'rgba(251, 192, 45, 0.04)',
      lineColor: 'rgba(251, 192, 45, 1)',
      lineWidth: 2,
      lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => price.toFixed(0),
      },
    };

    chartRef.current = createChart(containerRef.current, chartOptions);
    areaSeriesRef.current = chartRef.current.addAreaSeries(areaSeriesOptions);

    
    chartRef.current.subscribeCrosshairMove(function (param) {
      const time = param.time as number;

      if (
        time === undefined ||
        param.point === undefined ||
        !tooltipRef.current ||
        !areaSeriesRef.current
      ) {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
        return;
      }

      const seriesData = param.seriesData.get(areaSeriesRef.current);

      // Check if seriesData has a 'value' property
      if (seriesData && "value" in seriesData && tooltipRef.current) {
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
  }, [lastMessage?.data]);

  const takeSnapshot = () => {
    const chartContainer = containerRef.current;
  
    if (chartContainer) {
      // Explicitly set the canvas width to match the container's width
      const canvasOptions = {
        useCORS: true,
        width: chartContainer.offsetWidth, // Set the canvas width
      };
  
      html2canvas(chartContainer, canvasOptions)
        .then((canvas) => {
          console.log("Canvas Size:", canvas.width, "x", canvas.height);
          console.log("Canvas Content:", canvas.toDataURL("image/png"));
  
          const imageSrc = canvas.toDataURL("image/png");
  
          if (imageSrc) {
            const downloadLink = document.createElement("a");
            downloadLink.href = imageSrc;
            downloadLink.download = "full-chart-snapshot.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } else {
            console.error("Generated image source is empty.");
          }
        })
        .catch((err) => {
          console.error("Error taking snapshot:", err);
        });
    } else {
      console.error("Chart container is not available.");
    }
  };
  
  


 // Fullscreen toggle handler
 const toggleFullScreen = useCallback(() => {
  if (containerRef.current) {
    const handleFullScreenChange = () => {
      if(  chartRef.current==null) return
      if (document.fullscreenElement === containerRef.current) {
        chartRef.current.applyOptions({ height: window.innerHeight });
      } else {
        chartRef.current.applyOptions({ height: 400 });
      }
    };

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        document.addEventListener('fullscreenchange', handleFullScreenChange);
      });
    } else {
      document.exitFullscreen().then(() => {
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
      });
    }
  }
}, []);
useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && chartRef.current) {
        chartRef.current.applyOptions({ height: 400 });
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);
  
  return (
    <React.Fragment>
      <div className="w-full justify-end flex gap-2 pb-4">
        <button className=" text-white" onClick={takeSnapshot}>
          {snapshot}
        </button>
        <button className="text-white" onClick={toggleFullScreen}>
          {fullscreen}
        </button>
      </div>   
      <div className="chart-container relative z-0" ref={containerRef}>
  
      </div>
    </React.Fragment>
  );
};

export default TickChart;
