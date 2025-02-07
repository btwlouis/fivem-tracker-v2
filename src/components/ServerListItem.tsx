import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faUser, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { IServerView } from "@/utils/types";
import Image from "next/image";
import { CircleFlagLanguage } from 'react-circle-flags'
import { useState } from "react";

interface ServerListItemProps {
  server: IServerView;
}

const ServerListItem: React.FC<ServerListItemProps> = ({ server }) => {
    const [imageSrc, setImageSrc] = useState(`https://servers-frontend.fivem.net/api/servers/icon/${server.id}/${server.iconVersion}.png`);

    const handleError = () => {
      console.log("handle error for server icon", server.projectName);
      setImageSrc(`https://placehold.co/96x96?text=${server.projectName}`);
    };

    return (
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg shadow-md">
            {/* Left: Server Icon & Info */}
            <div className="flex items-center space-x-3">
                <Image 
                  src={imageSrc}
                  onError={handleError}  
                  width={64} 
                  height={64} 
                  className="rounded-lg" 
                  alt={server.projectName} />
                <div>
                    <div className="flex items-center space-x-2">
                      <CircleFlagLanguage languageCode={server.locale} height="24" width="24" />
                      <h3 className="text-white font-bold">{server.projectName}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{server.projectDescription}</p>
                </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-700 px-3 py-1 rounded-lg text-white">
                    <FontAwesomeIcon icon={faStar} className="mr-1 text-yellow-400" />
                    <span>{1 || "N/A"}</span>
                </div>
                <div className="flex items-center bg-gray-700 px-3 py-1 rounded-lg text-white">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    <span>{server.playersCurrent?.toLocaleString() || "0"}</span>
                </div>
                <div className="flex items-center bg-gray-700 px-3 py-1 rounded-lg text-white">
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1 text-green-400" />
                    <span>{server.upvotePower?.toLocaleString() || "0"}</span>
                </div>
            </div>
        </div>
    );
};

export default ServerListItem;
