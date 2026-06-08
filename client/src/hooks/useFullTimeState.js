import { useState, useCallback } from 'react';
import { TEAM_LOGOS } from '../utils/LogoConstants';

export function useFullTimeState() {
  const [selectedTabellino, setSelectedTabellino] = useState('superleague.png');
  const [userImage, setUserImage] = useState(null);
  const [instagramImage, setInstagramImage] = useState(null);
  const [instagramLink, setInstagramLink] = useState('');

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [scorersTeam1, setScorersTeam1] = useState(Array(7).fill(''));
  const [scorersTeam2, setScorersTeam2] = useState(Array(7).fill(''));

  const [selectedLogo1, setSelectedLogo1] = useState(TEAM_LOGOS.PANATHINAIKOS);
  const [selectedLogo2, setSelectedLogo2] = useState(TEAM_LOGOS.OLYMPIAKOS);
  const [uploadedLogo1, setUploadedLogo1] = useState(null);
  const [uploadedLogo2, setUploadedLogo2] = useState(null);

  const [logo1Position, setLogo1Position] = useState({ x: 215, y: 1270 });
  const [logo2Position, setLogo2Position] = useState({ x: 1052, y: 1274 });
  const [logo1Scale, setLogo1Scale] = useState({ scaleX: 0.90, scaleY: 0.90 });
  const [logo2Scale, setLogo2Scale] = useState({ scaleX: 0.90, scaleY: 0.90 });

  const [score1Y, setScore1Y] = useState(1282);
  const [score2Y, setScore2Y] = useState(1282);

  const [imagePosition, setImagePosition] = useState({ x: 100, y: 100 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });

  const [activeTab, setActiveTab] = useState('general');
  const [flashscoreData, setFlashscoreData] = useState({
    matches: [],
    selectedComp: 0,
    selectedMatchId: null
  });

  const handleDragEnd = useCallback((e) => {
    setImagePosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  const handleTransform = useCallback((e) => {
    setImageScale({ scaleX: e.target.scaleX(), scaleY: e.target.scaleY() });
  }, []);

  const moveLogo = useCallback((logo, direction) => {
    const setter = logo === 1 ? setLogo1Position : setLogo2Position;
    setter(prev => ({
      x: direction === 'left' ? prev.x - 4 : direction === 'right' ? prev.x + 4 : prev.x,
      y: direction === 'up' ? prev.y - 4 : direction === 'down' ? prev.y + 4 : prev.y,
    }));
  }, []);

  const resizeLogo = useCallback((logo, type) => {
    const setter = logo === 1 ? setLogo1Scale : setLogo2Scale;
    setter(prev => ({
      scaleX: type === 'increase' ? prev.scaleX + 0.1 : Math.max(0.1, prev.scaleX - 0.1),
      scaleY: type === 'increase' ? prev.scaleY + 0.1 : Math.max(0.1, prev.scaleY - 0.1),
    }));
  }, []);

  const increaseImageSize = useCallback(() => {
    setImageScale(prev => ({ scaleX: prev.scaleX + 0.1, scaleY: prev.scaleY + 0.1 }));
  }, []);

  const decreaseImageSize = useCallback(() => {
    setImageScale(prev => ({
      scaleX: Math.max(0.1, prev.scaleX - 0.1),
      scaleY: Math.max(0.1, prev.scaleY - 0.1),
    }));
  }, []);

  const handleFlashscoreMatch = useCallback((matchData) => {
    setScore1(matchData.homeScore);
    setScore2(matchData.awayScore);

    if (matchData.tabellino) {
      setSelectedTabellino(matchData.tabellino);
    }

    if (matchData.homeLogo) {
      setSelectedLogo1(matchData.homeLogo);
      setUploadedLogo1(null);
    }

    if (matchData.awayLogo) {
      setSelectedLogo2(matchData.awayLogo);
      setUploadedLogo2(null);
    }

    const homePadded = [...(matchData.homeScorers || []), ...Array(7).fill('')].slice(0, 7);
    setScorersTeam1(homePadded);

    const awayPadded = [...(matchData.awayScorers || []), ...Array(7).fill('')].slice(0, 7);
    setScorersTeam2(awayPadded);
  }, []);

  return {
    selectedTabellino, setSelectedTabellino,
    userImage, setUserImage,
    instagramImage, setInstagramImage,
    instagramLink, setInstagramLink,
    score1, setScore1,
    score2, setScore2,
    scorersTeam1, setScorersTeam1,
    scorersTeam2, setScorersTeam2,
    selectedLogo1, setSelectedLogo1,
    selectedLogo2, setSelectedLogo2,
    uploadedLogo1, setUploadedLogo1,
    uploadedLogo2, setUploadedLogo2,
    logo1Position, setLogo1Position,
    logo2Position, setLogo2Position,
    logo1Scale, setLogo1Scale,
    logo2Scale, setLogo2Scale,
    score1Y, setScore1Y,
    score2Y, setScore2Y,
    imagePosition, setImagePosition,
    imageScale, setImageScale,
    activeTab, setActiveTab,
    flashscoreData, setFlashscoreData,
    handleDragEnd, handleTransform, moveLogo, resizeLogo,
    increaseImageSize, decreaseImageSize, handleFlashscoreMatch
  };
}
