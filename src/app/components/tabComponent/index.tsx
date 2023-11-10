import React, { useEffect, useRef, useState, ReactNode } from "react";

interface ToggleTabsProps {
  children: ReactNode;
  tabArray: { title: string }[];
  setActiveTab: (index: number) => void;
  activeTab: number;
}

const ToggleTabs: React.FC<ToggleTabsProps> = ({ children, tabArray = [], setActiveTab, activeTab }) => {
    const [tabUnderlineWidth, setTabUnderlineWidth] = useState<number>(0);
    const [tabUnderlineLeft, setTabUnderlineLeft] = useState<number>(0);
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        function setTabPosition() {
            const currentTab = tabsRef.current[activeTab];
            if (currentTab) {
                setTabUnderlineLeft(currentTab.offsetLeft);
                setTabUnderlineWidth(currentTab.clientWidth);
            }
        }
        setTabPosition();
        window.addEventListener("resize", setTabPosition);

        return () => window.removeEventListener("resize", setTabPosition);
    }, [activeTab]);

    return (
        <div className='w-full container mx-auto'>
            <div className='flex flex-col gap-[46px] py-8'>
                <div>
                    <div className="relative">
                        <div className="w-full border-b flex gap-4 md:gap-12 border-zinc-700">
                            {tabArray.map((tab, idx) => (
                                <button
                                    key={idx}
                                    ref={(el) => (tabsRef.current[idx] = el)}
                                    className={`px-[10px] py-3 text-sm md:text-base 2xl:text-2xl text-zinc-400 !leading-none font-[600]`}
                                    onClick={() => setActiveTab(idx)}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </div>
                        <span
                            className="absolute bottom-0 block h-1 bg-white rounded-tl-lg rounded-tr-lg transition-all duration-300"
                            style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
                        />
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}

export default ToggleTabs;
