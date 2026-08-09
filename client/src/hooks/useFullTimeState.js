import { useState, useCallback } from 'react';
import { TEAM_LOGOS } from '../utils/LogoConstants';
import { FULLTIME_LAYOUT } from '../config/layoutConstants';

export function useFullTimeState() {
  const [selectedTabellino, setSelectedTabellino] = useState('superleague.png');
  const [userImage, setUserImage] = useState(null);
  const [instagramImage, setInstagramImage] = useState(null);
  const [instagramLink, setInstagramLink] = useState('');

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [isPenaltyMatch, setIsPenaltyMatch] = useState(false);
  const [penaltiesScore1, setPenaltiesScore1] = useState(3);
  const [penaltiesScore2, setPenaltiesScore2] = useState(4);
  const [scorersTeam1, setScorersTeam1] = useState(Array(7).fill(''));
  const [scorersTeam2, setScorersTeam2] = useState(Array(7).fill(''));

  const [selectedLogo1, setSelectedLogo1] = useState(TEAM_LOGOS.PANATHINAIKOS);
  const [selectedLogo2, setSelectedLogo2] = useState(TEAM_LOGOS.OLYMPIAKOS);
  const [uploadedLogo1, setUploadedLogo1] = useState(null);
  const [uploadedLogo2, setUploadedLogo2] = useState(null);

  const [logo1Position, setLogo1Position] = useState({ x: FULLTIME_LAYOUT.LOGO_1.startX, y: FULLTIME_LAYOUT.LOGO_1.startY });
  const [logo2Position, setLogo2Position] = useState({ x: FULLTIME_LAYOUT.LOGO_2.startX, y: FULLTIME_LAYOUT.LOGO_2.startY });
  const [logo1Scale, setLogo1Scale] = useState({ scaleX: FULLTIME_LAYOUT.LOGO_1.defaultScaleX, scaleY: FULLTIME_LAYOUT.LOGO_1.defaultScaleY });
  const [logo2Scale, setLogo2Scale] = useState({ scaleX: FULLTIME_LAYOUT.LOGO_2.defaultScaleX, scaleY: FULLTIME_LAYOUT.LOGO_2.defaultScaleY });

  // Logo competizione (solo tabellino "general"): posizionato al centro
  const [competitionLogo, setCompetitionLogo] = useState(null);
  const [competitionLogoPosition, setCompetitionLogoPosition] = useState({ x: FULLTIME_LAYOUT.COMPETITION_LOGO.startX, y: FULLTIME_LAYOUT.COMPETITION_LOGO.startY });
  const [competitionLogoScale, setCompetitionLogoScale] = useState({ scaleX: FULLTIME_LAYOUT.COMPETITION_LOGO.defaultScaleX, scaleY: FULLTIME_LAYOUT.COMPETITION_LOGO.defaultScaleY });

  const [score1Y, setScore1Y] = useState(FULLTIME_LAYOUT.SCORE_1.startY);
  const [score2Y, setScore2Y] = useState(FULLTIME_LAYOUT.SCORE_2.startY);

  const [imagePosition, setImagePosition] = useState({ x: FULLTIME_LAYOUT.USER_IMAGE.startX, y: FULLTIME_LAYOUT.USER_IMAGE.startY });
  const [imageScale, setImageScale] = useState({ scaleX: FULLTIME_LAYOUT.USER_IMAGE.defaultScaleX, scaleY: FULLTIME_LAYOUT.USER_IMAGE.defaultScaleY });

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
    const setter = logo === 1 ? setLogo1Position : logo === 2 ? setLogo2Position : setCompetitionLogoPosition;
    setter(prev => ({
      x: direction === 'left' ? prev.x - FULLTIME_LAYOUT.MOVE_STEP : direction === 'right' ? prev.x + FULLTIME_LAYOUT.MOVE_STEP : prev.x,
      y: direction === 'up' ? prev.y - FULLTIME_LAYOUT.MOVE_STEP : direction === 'down' ? prev.y + FULLTIME_LAYOUT.MOVE_STEP : prev.y,
    }));
  }, []);

  const resizeLogo = useCallback((logo, type) => {
    const setter = logo === 1 ? setLogo1Scale : logo === 2 ? setLogo2Scale : setCompetitionLogoScale;
    setter(prev => ({
      scaleX: type === 'increase' ? prev.scaleX + FULLTIME_LAYOUT.SCALE_STEP : Math.max(FULLTIME_LAYOUT.USER_IMAGE.minScale, prev.scaleX - FULLTIME_LAYOUT.SCALE_STEP),
      scaleY: type === 'increase' ? prev.scaleY + FULLTIME_LAYOUT.SCALE_STEP : Math.max(FULLTIME_LAYOUT.USER_IMAGE.minScale, prev.scaleY - FULLTIME_LAYOUT.SCALE_STEP),
    }));
  }, []);

  const handleCompetitionDragEnd = useCallback((e) => {
    setCompetitionLogoPosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  const increaseImageSize = useCallback(() => {
    setImageScale(prev => ({ scaleX: prev.scaleX + FULLTIME_LAYOUT.SCALE_STEP, scaleY: prev.scaleY + FULLTIME_LAYOUT.SCALE_STEP }));
  }, []);

  const decreaseImageSize = useCallback(() => {
    setImageScale(prev => ({
      scaleX: Math.max(FULLTIME_LAYOUT.USER_IMAGE.minScale, prev.scaleX - FULLTIME_LAYOUT.SCALE_STEP),
      scaleY: Math.max(FULLTIME_LAYOUT.USER_IMAGE.minScale, prev.scaleY - FULLTIME_LAYOUT.SCALE_STEP),
    }));
  }, []);

  const handleFlashscoreMatch = useCallback((matchData) => {
    setScore1(matchData.homeScore);
    setScore2(matchData.awayScore);

    if (matchData.tabellino) {
      setSelectedTabellino(matchData.tabellino);
    }

    // I loghi esterni (URL web dalla ricerca, via proxy) vanno in uploadedLogo,
    // quelli locali (path /loghi/...) in selectedLogo: il canvas li tratta
    // diversamente (uploadedLogo || origin + selectedLogo).
    const applyLogo = (logo, setSelected, setUploaded) => {
      if (!logo) return;
      if (/^(https?:|data:)/.test(logo)) {
        setUploaded(logo);
      } else {
        setSelected(logo);
        setUploaded(null);
      }
    };

    applyLogo(matchData.homeLogo, setSelectedLogo1, setUploadedLogo1);
    applyLogo(matchData.awayLogo, setSelectedLogo2, setUploadedLogo2);

    const homePadded = [...(matchData.homeScorers || []), ...Array(7).fill('')].slice(0, 7);
    setScorersTeam1(homePadded);

    const awayPadded = [...(matchData.awayScorers || []), ...Array(7).fill('')].slice(0, 7);
    setScorersTeam2(awayPadded);

    if (matchData.isPenaltyMatch !== undefined) {
      setIsPenaltyMatch(matchData.isPenaltyMatch);
    }
    if (matchData.penaltiesScore1 !== undefined && matchData.penaltiesScore2 !== undefined) {
      setPenaltiesScore1(matchData.penaltiesScore1);
      setPenaltiesScore2(matchData.penaltiesScore2);
    } else if (matchData.penaltiesScore) {
      const parts = String(matchData.penaltiesScore).replace(/[[\]]/g, '').split('-');
      if (parts.length === 2) {
        setPenaltiesScore1(Number(parts[0]) || 0);
        setPenaltiesScore2(Number(parts[1]) || 0);
      }
    }
  }, []);

  return {
    selectedTabellino, setSelectedTabellino,
    userImage, setUserImage,
    instagramImage, setInstagramImage,
    instagramLink, setInstagramLink,
    score1, setScore1,
    score2, setScore2,
    isPenaltyMatch, setIsPenaltyMatch,
    penaltiesScore1, setPenaltiesScore1,
    penaltiesScore2, setPenaltiesScore2,
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
    competitionLogo, setCompetitionLogo,
    competitionLogoPosition, setCompetitionLogoPosition,
    competitionLogoScale, setCompetitionLogoScale,
    score1Y, setScore1Y,
    score2Y, setScore2Y,
    imagePosition, setImagePosition,
    imageScale, setImageScale,
    activeTab, setActiveTab,
    flashscoreData, setFlashscoreData,
    handleDragEnd, handleTransform, moveLogo, resizeLogo,
    handleCompetitionDragEnd,
    increaseImageSize, decreaseImageSize, handleFlashscoreMatch
  };
}
