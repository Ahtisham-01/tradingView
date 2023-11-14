"use client";
import React, { useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import ToggleTabs from "./components/tabComponent";
import TickChart from "./components/tickchart/tickChart";
import CandlestickChart from "./components/candleStickChart";

interface Tab {
  id: number;
  title: string;
}

interface DataChannels {
  title: string;
  value: string;
}

const tabArray: Tab[] = [
  {
    id: 0,
    title: "Candlestick",
  },
  {
    id: 1,
    title: "Tick",
  }
];

const DataChannels: DataChannels[] = [
  { title: "1 Minute Candle", value: "index-candle1m" },
  { title: "3 Months Candle", value: "index-candle3M" },
  { title: "1 Month Candle", value: "index-candle1M" },
  { title: "1 Week Candle", value: "index-candle1W" },
  { title: "1 Day Candle", value: "index-candle1D" },
  { title: "2 Days Candle", value: "index-candle2D" },
  { title: "3 Days Candle", value: "index-candle3D" },
  { title: "5 Days Candle", value: "index-candle5D" },
  { title: "12 Hours Candle", value: "index-candle12H" },
  { title: "6 Hours Candle", value: "index-candle6H" },
  { title: "4 Hours Candle", value: "index-candle4H" },
  { title: "2 Hours Candle", value: "index-candle2H" },
  { title: "1 Hour Candle", value: "index-candle1H" },
  { title: "30 Minutes Candle", value: "index-candle30m" },
  { title: "15 Minutes Candle", value: "index-candle15m" },
  { title: "5 Minutes Candle", value: "index-candle5m" },
  { title: "3 Minutes Candle", value: "index-candle3m" },
  { title: "3 Months Candle UTC", value: "index-candle3Mutc" },
  { title: "1 Month Candle UTC", value: "index-candle1Mutc" },
  { title: "1 Week Candle UTC", value: "index-candle1Wutc" },
  { title: "1 Day Candle UTC", value: "index-candle1Dutc" },
  { title: "2 Days Candle UTC", value: "index-candle2Dutc" },
  { title: "3 Days Candle UTC", value: "index-candle3Dutc" },
  { title: "5 Days Candle UTC", value: "index-candle5Dutc" },
  { title: "12 Hours Candle UTC", value: "index-candle12Hutc" },
  { title: "6 Hours Candle UTC", value: "index-candle6Hutc" }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const selectedChannelRef = useRef<string>(DataChannels[0].value);

  const socketUrl = "wss://wspap.okx.com:8443/ws/v5/business?brokerId=9999";
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (readyState === 1 && selectedChannelRef.current) {
      sendMessage(
        JSON.stringify({
          op: "subscribe",
          args: [{ instId: "BTC-USD", channel: selectedChannelRef && selectedChannelRef.current }],
        })
      );
    }
  }, [readyState, sendMessage, selectedChannelRef.current]);

  // const handleChannelSelect = (newChannel: string) => {
  //   selectedChannelRef.current = newChannel;

  //   if (readyState === 1 && newChannel) {
  //     sendMessage(
  //       JSON.stringify({
  //         op: "subscribe",
  //         args: [{ instId: "BTC-USD", channel: newChannel }],
  //       })
  //     );
  //   }
  // };

  const handleChannelSelect = (newChannel: string) => {
    // Unsubscribe from the previous channel
    if (readyState === 1 && selectedChannelRef.current) {
      sendMessage(
        JSON.stringify({
          op: "unsubscribe",
          args: [{ instId: "BTC-USD", channel: selectedChannelRef.current }],
        })
      );
    }

    // Update the selected channel
    selectedChannelRef.current = newChannel;

    // Subscribe to the new channel
    if (readyState === 1 && newChannel) {
      sendMessage(
        JSON.stringify({
          op: "subscribe",
          args: [{ instId: "BTC-USD", channel: newChannel }],
        })
      );
    }
  };

  console.log({ selectedChannel: selectedChannelRef.current });

  const parsedMessage = lastMessage ? JSON.parse(lastMessage.data) : null;
  function renderingTheSteps(step: number) {
    switch (step) {
      case 0:
        return (
          <div className="w-full flex flex-col gap-3  shadow-md border border-zinc-700 bg-black rounded-md p-5">
            <span className="text-lg md:text-3xl text-white font-bold">
              Chart {selectedChannelRef && selectedChannelRef.current.split("-")[1]}
            </span>
            <div className="mt-4 w-1/5">
              <select
                id="channel-select"
                onChange={(e) => handleChannelSelect(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 border border-gray-700 w-full p-2.5"
              >
                {DataChannels.map((_channel, index) => (
                  <option key={index} value={_channel.value} className="bg-gray-800">
                    {_channel.title}
                  </option>
                ))}
              </select>
            </div>
            <CandlestickChart lastMessage={lastMessage} selectedChannel={selectedChannelRef && selectedChannelRef.current} />
          </div>
        );
      case 1:
        return (
          <div className="w-full flex flex-col gap-3  shadow-md border border-zinc-700 bg-black rounded-md p-5">
            <span className="text-lg md:text-3xl text-white font-bold">Tick</span>
            <TickChart />
          </div>
        );

    }
  }
  return (
    <React.Fragment>
      <div className="w-full h-screen  p-8">
        <div className="flex flex-col md:flex-row  justify-between  rounded-lg shadow  border-zinc-700 border bg-black items-center w-full container mx-auto">
          <div className="flex gap-2 w-full items-center">
            <img
              src="/app-mobile-logo.png"
              alt="btc logo"
              className=" w-24 h-24 rounded-full"
            />
            <p className=" text-base 2xl:text-5xl text-center py-4  text-white font-bold">
              MT TRADING
            </p>
          </div>
          <div className="relative md:m-8  bg-black rounded-lg shadow md:w-62 w-full p-2">
            <img
              src="https://img.clankapp.com/symbol/btc.svg"
              alt="btc logo"
              className="absolute w-24 h-24 rounded-full opacity-50 -top-6 -right-6 md:-right-4"
            />
            <div className="px-4 py-5 sm:p-6 border border-zinc-700 bg-black rounded-md">
              <dl>
                <div className="flex gap-4">
                  <div className="text-sm font-medium leading-5 text-green-500 truncate">
                    {parsedMessage?.data != undefined &&
                      `High: ${parsedMessage?.data[0][2]}`}
                  </div>
                </div>
                <div className="mt-1 text-3xl font-semibold leading-9 text-gray-400">
                  ${" "}
                  {parsedMessage?.data != undefined &&
                    parsedMessage?.data[0][4]}
                </div>
                <div className="font-semibold text-white">
                  <div className="text-sm font-medium leading-5 text-red-500 truncate">
                    {parsedMessage?.data != undefined &&
                      `low: ${parsedMessage?.data[0][3]}`}
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <div className="flex flex-col mx-auto gap-2 pb-8 container">
          <ToggleTabs
            tabArray={tabArray}
            // renderTabContent={renderTabContent}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          >
            {renderingTheSteps(activeTab)}
          </ToggleTabs>
        </div>
      </div>
    </React.Fragment>
  );
}
