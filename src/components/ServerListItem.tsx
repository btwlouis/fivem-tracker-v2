'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faUser, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { CircleFlagLanguage } from 'react-circle-flags'
import { useState, JSX } from "react";

// extend the interface to include rank
interface ServerListItemProps {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  server: any;
}

const colorMap: Record<string, string> = {
  '^0': '#FFFFF0', // White
  '^1': '#F44336', // Red
  '^2': '#4CAF50', // Green
  '^3': '#FFEB3B', // Yellow
  '^4': '#42A5F5', // Blue
  '^5': '#03A9F4', // Light blue
  '^6': '#9C27B0', // Purple
  '^7': '#FFFFF0', // White
  '^8': '#FF5722', // Orange
  '^9': '#9E9E9E', // Grey
};

const parseColoredText = (text: string) => {
  // Split text by color codes
  const parts = text.split(/(\^\d)/g).filter(Boolean);

  let currentColor = colorMap['^0']; // Default to white
  const elements: JSX.Element[] = [];

  parts.forEach((part, index) => {
    // Check if the part is a color code
    if (colorMap[part]) {
      currentColor = colorMap[part];
    } else {
      elements.push(
        <span key={index} style={{ color: currentColor }}>
          {part}
        </span>
      );
    }
  });

  return <>{elements}</>;
};
  
const ServerListItem: React.FC<ServerListItemProps> = ({ server }) => {
    const [imageSrc, setImageSrc] = useState(`https://servers-frontend.fivem.net/api/servers/icon/${server.id}/${server.iconVersion}.png`);

    const handleError = () => {
      console.log("handle error for server icon", server.projectName);
      setImageSrc(`https://placehold.co/96x96?text=${server.projectName}`);
    };

    return (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg shadow-md mt-1">
            {/* Left: Server Icon & Info */}
            <div className="flex items-center space-x-3">
                <Image 
                  src={imageSrc}
                  onError={handleError}  
                  width={32} 
                  height={32} 
                  className="rounded-lg" 
                  alt={server.projectName} />
                <CircleFlagLanguage languageCode={server.localeCountry} height="24" width="24" />
                <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-md font-bold">{parseColoredText(server.projectName)}</h3>
                      </div>
                    <p className="text-gray-400 text-sm">{server.projectDescription}</p>
                </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center space-x-2">
                <div className="flex items-center bg-gray-700 px-3 py-1 rounded-lg text-white">
                    <FontAwesomeIcon icon={faStar} className="mr-1 text-yellow-400" />
                    <span className="text-sm">{server?.rank || "N/A"}</span>
                </div>
                
                <div className="flex items-center bg-gray-700 px-3 py-1 rounded-lg text-white">
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1 text-green-400" />
                    <span className="text-sm">{server.upvotePower?.toLocaleString() || "0"}</span>
                </div>

                <div className="flex items-center bg-gray-700 px-3 py-1 rounded-lg text-white w-30">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    <span className="text-sm">{server.playersCurrent || "0"}/{server.playersMax || "0"}</span>
                </div>
            </div>
        </div>
    );
};

export default ServerListItem;
