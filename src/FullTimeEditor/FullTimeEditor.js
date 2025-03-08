// FullTimeEditor.js
import React, { useState, useRef, useEffect } from 'react';
import TabellinoControls from '../components/TabellinoControls/TabellinoControls';
import SetTeamOne from '../components/SetTeam/SetTeamOne';
import SetTeamTwo from '../components/SetTeam/SetTeamTwo';  
import Toolbar from '../components/ToolBar/ToolBar';
import Canva from '../components/Canva/Canva';
import './FullTimeEditor.css';


const FullTimeEditor = () => {
  // Stato condiviso per il tabellino, immagini e punteggi
  const [selectedTabellino, setSelectedTabellino] = useState('superleague.png');
  const [userImage, setUserImage] = useState(null);
  const [instagramImage, setInstagramImage] = useState(null);
  const [instagramLink, setInstagramLink] = useState('');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [scorersTeam1, setScorersTeam1] = useState(Array(5).fill(''));
  const [scorersTeam2, setScorersTeam2] = useState(Array(5).fill(''));

  // Stato per loghi e loro posizioni (se intendi renderli parte del canvas)
  const [selectedLogo1, setSelectedLogo1] = useState('/loghi/panathinaikos.png');
  const [selectedLogo2, setSelectedLogo2] = useState('/loghi/olympiakos.png');
  const [uploadedLogo1, setUploadedLogo1] = useState(null);
  const [uploadedLogo2, setUploadedLogo2] = useState(null);
  const [logo1Position, setLogo1Position] = useState({ x: 65, y: 1260 });
  const [logo2Position, setLogo2Position] = useState({ x: 1175, y: 1260 });
  const [logo1Scale, setLogo1Scale] = useState({ scaleX: 1, scaleY: 1 });
  const [logo2Scale, setLogo2Scale] = useState({ scaleX: 1, scaleY: 1 });

  // Riferimento al canvas (Stage)
  const stageRef = useRef(null);

  // Stato e funzioni per gestire l'immagine principale (da file o Instagram)
  const [imagePosition, setImagePosition] = useState({ x: 100, y: 100 });
  const [imageScale, setImageScale] = useState({ scaleX: 1, scaleY: 1 });
  
  

  // Funzioni condivise
  const handleDragEnd = (e) => {
    setImagePosition({ x: e.target.x(), y: e.target.y() });
  };

  const handleTransform = (e) => {
    setImageScale({ scaleX: e.target.scaleX(), scaleY: e.target.scaleY() });
  };

  // Funzioni per la Toolbar
  const moveLogo = (logo, direction) => {
    if (logo === 1) {
      setLogo1Position(prev => ({
        x: direction === 'left' ? prev.x - 10 : direction === 'right' ? prev.x + 10 : prev.x,
        y: direction === 'up' ? prev.y - 10 : direction === 'down' ? prev.y + 10 : prev.y
      }));
    } else {
      setLogo2Position(prev => ({
        x: direction === 'left' ? prev.x - 10 : direction === 'right' ? prev.x + 10 : prev.x,
        y: direction === 'up' ? prev.y - 10 : direction === 'down' ? prev.y + 10 : prev.y
      }));
    }
  };

  const resizeLogo = (logo, type) => {
    const setter = logo === 1 ? setLogo1Scale : setLogo2Scale;
    setter(prev => ({
      scaleX: type === 'increase' ? prev.scaleX + 0.1 : Math.max(0.1, prev.scaleX - 0.1),
      scaleY: type === 'increase' ? prev.scaleY + 0.1 : Math.max(0.1, prev.scaleY - 0.1)
    }));
  };

  const increaseImageSize = () => setImageScale(prev => ({ scaleX: prev.scaleX + 0.1, scaleY: prev.scaleY + 0.1 }));
  const decreaseImageSize = () => setImageScale(prev => ({
    scaleX: Math.max(0.1, prev.scaleX - 0.1),
    scaleY: Math.max(0.1, prev.scaleY - 0.1)
  }));

  // Funzione per il download: ora stageRef è gestito in questo componente e passato a Canva
  const downloadImage = () => {
    if (!stageRef?.current) {
      alert('Stage non disponibile o non passato come prop.');
      return;
    }
    const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = 'full_time_result.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // (Opzionale) Effettua eventuali aggiornamenti del canvas al resize
  useEffect(() => {
    const scaleCanvas = () => {
      const stage = stageRef.current;
      if (stage) {
        const containerWidth = window.innerWidth * 0.8;
        const containerHeight = window.innerHeight * 0.8;
        const scale = Math.min(containerWidth / 1440, containerHeight / 1800);
        stage.width(1440 * scale);
        stage.height(1800 * scale);
        stage.scale({ x: scale, y: scale });
      }
    };
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);
    return () => window.removeEventListener('resize', scaleCanvas);
  }, []);

  return (
    <div className="App">
      <h1>CRONACHE ELLENICHE FULL TIME</h1>
      {/* Passa gli stati e funzioni ai componenti */}
      <TabellinoControls
        selectedTabellino={selectedTabellino}
        setSelectedTabellino={setSelectedTabellino}
        setUserImage={setUserImage}
        instagramLink={instagramLink}
        setInstagramLink={setInstagramLink}
        setInstagramImage={setInstagramImage}
        score1={score1}
        setScore1={setScore1}
        score2={score2}
        setScore2={setScore2}
        downloadImage={downloadImage}
        stageRef={stageRef}
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
        score1Y={1255}  // oppure uno stato se vuoi modificarlo dinamicamente
        score2Y={1255}
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
        setScore1Y={setScore1} // oppure crea funzioni separate per spostare i testi
        setScore2Y={setScore2}
      />
    </div>
  );
};

export default FullTimeEditor;
