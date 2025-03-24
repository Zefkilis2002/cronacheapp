import React, { useState, useRef } from 'react';
import TabellinoControls from '../components/TabellinoControls/TabellinoControls';
import SetTeamOne from '../components/SetTeam/SetTeamOne';
import SetTeamTwo from '../components/SetTeam/SetTeamTwo';
import Toolbar from '../components/ToolBar/ToolBar';
import Canva from '../components/Canva/Canva';
import './FullTimeEditor.css';

const FullTimeEditor = () => {
  const [selectedTabellino, setSelectedTabellino] = useState('superleague.png');
  const [userImage, setUserImage] = useState(null);
  const [instagramImage, setInstagramImage] = useState(null);
  const [instagramLink, setInstagramLink] = useState('');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [scorersTeam1, setScorersTeam1] = useState(Array(5).fill(''));
  const [scorersTeam2, setScorersTeam2] = useState(Array(5).fill(''));
  const [selectedLogo1, setSelectedLogo1] = useState('/loghi/panathinaikos.png');
  const [selectedLogo2, setSelectedLogo2] = useState('/loghi/olympiakos.png');
  const [uploadedLogo1, setUploadedLogo1] = useState(null);
  const [uploadedLogo2, setUploadedLogo2] = useState(null);
  const [logo1Position, setLogo1Position] = useState({ x: 65, y: 1260 });
  const [logo2Position, setLogo2Position] = useState({ x: 1175, y: 1260 });
  const [logo1Scale, setLogo1Scale] = useState({ scaleX: 1, scaleY: 1 });
  const [logo2Scale, setLogo2Scale] = useState({ scaleX: 1, scaleY: 1 });
  const [score1Y, setScore1Y] = useState(1255);
  const [score2Y, setScore2Y] = useState(1255);
  const [imagePosition, setImagePosition] = useState({ x: 100, y: 100 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });

  const stageRef = useRef(null);
  const borderRef = useRef(null);

  const handleDragEnd = (e) => setImagePosition({ x: e.target.x(), y: e.target.y() });
  const handleTransform = (e) => setImageScale({ scaleX: e.target.scaleX(), scaleY: e.target.scaleY() });

  const moveLogo = (logo, direction) => {
    const setter = logo === 1 ? setLogo1Position : setLogo2Position;
    setter(prev => ({
      x: direction === 'left' ? prev.x - 10 : direction === 'right' ? prev.x + 10 : prev.x,
      y: direction === 'up' ? prev.y - 10 : direction === 'down' ? prev.y + 10 : prev.y,
    }));
  };

  const resizeLogo = (logo, type) => {
    const setter = logo === 1 ? setLogo1Scale : setLogo2Scale;
    setter(prev => ({
      scaleX: type === 'increase' ? prev.scaleX + 0.1 : Math.max(0.1, prev.scaleX - 0.1),
      scaleY: type === 'increase' ? prev.scaleY + 0.1 : Math.max(0.1, prev.scaleY - 0.1),
    }));
  };

  const increaseImageSize = () => setImageScale(prev => ({ scaleX: prev.scaleX + 0.1, scaleY: prev.scaleY + 0.1 }));
  const decreaseImageSize = () => setImageScale(prev => ({
    scaleX: Math.max(0.1, prev.scaleX - 0.1),
    scaleY: Math.max(0.1, prev.scaleY - 0.1),
  }));

  return (
    <div className="App">
      <h1>CRONACHE ELLENICHE FULL TIME</h1>
      <TabellinoControls
        stageRef={stageRef}
        borderRef={borderRef}
        selectedTabellino={selectedTabellino}
        setSelectedTabellino={setSelectedTabellino}
        instagramLink={instagramLink}
        setInstagramLink={setInstagramLink}
        setInstagramImage={setInstagramImage}
        score1={score1}
        setScore1={setScore1}
        score2={score2}
        setScore2={setScore2}
        setUserImage={setUserImage}
      />
      <SetTeamOne
        selectedLogo1={selectedLogo1}
        setSelectedLogo1={setSelectedLogo1}
        uploadedLogo1={uploadedLogo1}
        setUploadedLogo1={setUploadedLogo1}
        scorersTeam1={scorersTeam1}
        setScorersTeam1={setScorersTeam1}
      />
      <Canva
        stageRef={stageRef}
        borderRef={borderRef}
        selectedTabellino={selectedTabellino}
        userImage={userImage}
        instagramImage={instagramImage}
        imagePosition={imagePosition}
        imageScale={imageScale}
        handleDragEnd={handleDragEnd}
        handleTransform={handleTransform}
        selectedLogo1={selectedLogo1}
        selectedLogo2={selectedLogo2}
        uploadedLogo1={uploadedLogo1}
        uploadedLogo2={uploadedLogo2}
        logo1Position={logo1Position}
        logo2Position={logo2Position}
        logo1Scale={logo1Scale}
        logo2Scale={logo2Scale}
        score1={score1}
        score2={score2}
        score1Y={score1Y}
        score2Y={score2Y}
        scorersTeam1={scorersTeam1}
        scorersTeam2={scorersTeam2}
      />
      <SetTeamTwo
        selectedLogo2={selectedLogo2}
        setSelectedLogo2={setSelectedLogo2}
        uploadedLogo2={uploadedLogo2}
        setUploadedLogo2={setUploadedLogo2}
        scorersTeam2={scorersTeam2}
        setScorersTeam2={setScorersTeam2}
      />
      <Toolbar
        moveLogo={moveLogo}
        resizeLogo={resizeLogo}
        increaseImageSize={increaseImageSize}
        decreaseImageSize={decreaseImageSize}
        setScore1Y={setScore1Y}
        setScore2Y={setScore2Y}
      />
    </div>
  );
};

export default FullTimeEditor;