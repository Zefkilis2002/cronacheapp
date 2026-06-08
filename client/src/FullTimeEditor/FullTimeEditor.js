import React, { useRef } from 'react';
import { useFullTimeState } from '../hooks/useFullTimeState';
import TabellinoControls from '../components/FullTimeComp/TabellinoControls/TabellinoControls';
import SetTeamOne from '../components/FullTimeComp/SetTeam/SetTeamOne';
import SetTeamTwo from '../components/FullTimeComp/SetTeam/SetTeamTwo';
import Toolbar from '../components/FullTimeComp/ToolBar/ToolBar';
import Canva from '../components/FullTimeComp/Canva/Canva';
import FlashscoreImport from '../components/FullTimeComp/FlashscoreImport/FlashscoreImport';
import './FullTimeEditor.css';
import { TEAM_LOGOS } from '../utils/LogoConstants';

const FullTimeEditor = () => {
  const state = useFullTimeState();

  const stageRef = useRef(null);
  const borderRef = useRef(null);

  return (
    <div className="App">
      <h1 className="page-title">FULL TIME CREATOR</h1>

      <Canva
        stageRef={stageRef}
        borderRef={borderRef}
        selectedTabellino={state.selectedTabellino}
        userImage={state.userImage}
        instagramImage={state.instagramImage}
        imagePosition={state.imagePosition}
        setImagePosition={state.setImagePosition}
        imageScale={state.imageScale}
        setImageScale={state.setImageScale} // Passato per pinch zoom
        handleDragEnd={state.handleDragEnd}
        handleTransform={state.handleTransform}
        selectedLogo1={state.selectedLogo1}
        selectedLogo2={state.selectedLogo2}
        uploadedLogo1={state.uploadedLogo1}
        uploadedLogo2={state.uploadedLogo2}
        logo1Position={state.logo1Position}
        logo2Position={state.logo2Position}
        logo1Scale={state.logo1Scale}
        logo2Scale={state.logo2Scale}
        score1={state.score1}
        score2={state.score2}
        score1Y={state.score1Y}
        score2Y={state.score2Y}
        scorersTeam1={state.scorersTeam1}
        scorersTeam2={state.scorersTeam2}
      />

      <div className="tab-header">
        <button
          className={`tab-button ${state.activeTab === 'general' ? 'active' : ''}`}
          onClick={() => state.setActiveTab('general')}
        >
          Generale
        </button>
        <button
          className={`tab-button ${state.activeTab === 'flashscore' ? 'active' : ''}`}
          onClick={() => state.setActiveTab('flashscore')}
        >
          ⚡ Flashscore
        </button>
        <button
          className={`tab-button ${state.activeTab === 'team1' ? 'active' : ''}`}
          onClick={() => state.setActiveTab('team1')}
        >
          Squadra 1
        </button>
        <button
          className={`tab-button ${state.activeTab === 'team2' ? 'active' : ''}`}
          onClick={() => state.setActiveTab('team2')}
        >
          Squadra 2
        </button>
      </div>

      <div className="tab-content">
        {state.activeTab === 'general' && (
          <TabellinoControls
            stageRef={stageRef}
            borderRef={borderRef}
            selectedTabellino={state.selectedTabellino}
            setSelectedTabellino={state.setSelectedTabellino}
            instagramLink={state.instagramLink}
            setInstagramLink={state.setInstagramLink}
            setInstagramImage={state.setInstagramImage}
            score1={state.score1}
            setScore1={state.setScore1}
            score2={state.score2}
            setScore2={state.setScore2}
            setUserImage={state.setUserImage}
          />
        )}

        {state.activeTab === 'flashscore' && (
          <FlashscoreImport
            onMatchSelect={state.handleFlashscoreMatch}
            flashscoreData={state.flashscoreData}
            setFlashscoreData={state.setFlashscoreData}
          />
        )}

        {state.activeTab === 'team1' && (
          <SetTeamOne
            selectedLogo1={state.selectedLogo1}
            setSelectedLogo1={state.setSelectedLogo1}
            uploadedLogo1={state.uploadedLogo1}
            setUploadedLogo1={state.setUploadedLogo1}
            scorersTeam1={state.scorersTeam1}
            setScorersTeam1={state.setScorersTeam1}
          />
        )}

        {state.activeTab === 'team2' && (
          <SetTeamTwo
            selectedLogo2={state.selectedLogo2}
            setSelectedLogo2={state.setSelectedLogo2}
            uploadedLogo2={state.uploadedLogo2}
            setUploadedLogo2={state.setUploadedLogo2}
            scorersTeam2={state.scorersTeam2}
            setScorersTeam2={state.setScorersTeam2}
          />
        )}
      </div>

      <Toolbar
        moveLogo={state.moveLogo}
        resizeLogo={state.resizeLogo}
        increaseImageSize={state.increaseImageSize}
        decreaseImageSize={state.decreaseImageSize}
        setScore1Y={state.setScore1Y}
        setScore2Y={state.setScore2Y}
      />
    </div>
  );
};

export default FullTimeEditor;