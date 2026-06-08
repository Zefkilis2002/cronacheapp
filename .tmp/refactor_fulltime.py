import re

with open('f:/cronacheapp/src/FullTimeEditor/FullTimeEditor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import React, { useState, useRef } from 'react';",
    "import React, { useRef } from 'react';\nimport { useFullTimeState } from '../hooks/useFullTimeState';"
)

# 2. State replacements
state_start_idx = content.find('  const [selectedTabellino')
state_end_idx = content.find('  const stageRef = useRef(null);')

new_state = '''  const state = useFullTimeState();

'''

if state_start_idx != -1 and state_end_idx != -1:
    content = content[:state_start_idx] + new_state + content[state_end_idx:]

# 3. Delete old handlers
handler_start = content.find('  const handleDragEnd = (e) =>')
handler_end = content.find('  return (')

if handler_start != -1 and handler_end != -1:
    content = content[:handler_start] + content[handler_end:]

# 4. Replace props in Canva
content = content.replace(
    'selectedTabellino={selectedTabellino}', 'selectedTabellino={state.selectedTabellino}'
).replace(
    'userImage={userImage}', 'userImage={state.userImage}'
).replace(
    'instagramImage={instagramImage}', 'instagramImage={state.instagramImage}'
).replace(
    'imagePosition={imagePosition}', 'imagePosition={state.imagePosition}'
).replace(
    'setImagePosition={setImagePosition}', 'setImagePosition={state.setImagePosition}'
).replace(
    'imageScale={imageScale}', 'imageScale={state.imageScale}'
).replace(
    'setImageScale={setImageScale}', 'setImageScale={state.setImageScale}'
).replace(
    'handleDragEnd={handleDragEnd}', 'handleDragEnd={state.handleDragEnd}'
).replace(
    'handleTransform={handleTransform}', 'handleTransform={state.handleTransform}'
).replace(
    'selectedLogo1={selectedLogo1}', 'selectedLogo1={state.selectedLogo1}'
).replace(
    'selectedLogo2={selectedLogo2}', 'selectedLogo2={state.selectedLogo2}'
).replace(
    'uploadedLogo1={uploadedLogo1}', 'uploadedLogo1={state.uploadedLogo1}'
).replace(
    'uploadedLogo2={uploadedLogo2}', 'uploadedLogo2={state.uploadedLogo2}'
).replace(
    'logo1Position={logo1Position}', 'logo1Position={state.logo1Position}'
).replace(
    'logo2Position={logo2Position}', 'logo2Position={state.logo2Position}'
).replace(
    'logo1Scale={logo1Scale}', 'logo1Scale={state.logo1Scale}'
).replace(
    'logo2Scale={logo2Scale}', 'logo2Scale={state.logo2Scale}'
).replace(
    'score1={score1}', 'score1={state.score1}'
).replace(
    'score2={score2}', 'score2={state.score2}'
).replace(
    'score1Y={score1Y}', 'score1Y={state.score1Y}'
).replace(
    'score2Y={score2Y}', 'score2Y={state.score2Y}'
).replace(
    'scorersTeam1={scorersTeam1}', 'scorersTeam1={state.scorersTeam1}'
).replace(
    'scorersTeam2={scorersTeam2}', 'scorersTeam2={state.scorersTeam2}'
)

# 5. Replace state usage in other components
content = content.replace('activeTab ===', 'state.activeTab ===')
content = content.replace("setActiveTab('general')", "state.setActiveTab('general')")
content = content.replace("setActiveTab('flashscore')", "state.setActiveTab('flashscore')")
content = content.replace("setActiveTab('team1')", "state.setActiveTab('team1')")
content = content.replace("setActiveTab('team2')", "state.setActiveTab('team2')")

content = content.replace('setSelectedTabellino={setSelectedTabellino}', 'setSelectedTabellino={state.setSelectedTabellino}')
content = content.replace('instagramLink={instagramLink}', 'instagramLink={state.instagramLink}')
content = content.replace('setInstagramLink={setInstagramLink}', 'setInstagramLink={state.setInstagramLink}')
content = content.replace('setInstagramImage={setInstagramImage}', 'setInstagramImage={state.setInstagramImage}')
content = content.replace('setScore1={setScore1}', 'setScore1={state.setScore1}')
content = content.replace('setScore2={setScore2}', 'setScore2={state.setScore2}')
content = content.replace('setUserImage={setUserImage}', 'setUserImage={state.setUserImage}')

content = content.replace('onMatchSelect={handleFlashscoreMatch}', 'onMatchSelect={state.handleFlashscoreMatch}')
content = content.replace('flashscoreData={flashscoreData}', 'flashscoreData={state.flashscoreData}')
content = content.replace('setFlashscoreData={setFlashscoreData}', 'setFlashscoreData={state.setFlashscoreData}')

content = content.replace('setSelectedLogo1={setSelectedLogo1}', 'setSelectedLogo1={state.setSelectedLogo1}')
content = content.replace('setUploadedLogo1={setUploadedLogo1}', 'setUploadedLogo1={state.setUploadedLogo1}')
content = content.replace('setScorersTeam1={setScorersTeam1}', 'setScorersTeam1={state.setScorersTeam1}')

content = content.replace('setSelectedLogo2={setSelectedLogo2}', 'setSelectedLogo2={state.setSelectedLogo2}')
content = content.replace('setUploadedLogo2={setUploadedLogo2}', 'setUploadedLogo2={state.setUploadedLogo2}')
content = content.replace('setScorersTeam2={setScorersTeam2}', 'setScorersTeam2={state.setScorersTeam2}')

content = content.replace('moveLogo={moveLogo}', 'moveLogo={state.moveLogo}')
content = content.replace('resizeLogo={resizeLogo}', 'resizeLogo={state.resizeLogo}')
content = content.replace('increaseImageSize={increaseImageSize}', 'increaseImageSize={state.increaseImageSize}')
content = content.replace('decreaseImageSize={decreaseImageSize}', 'decreaseImageSize={state.decreaseImageSize}')
content = content.replace('setScore1Y={setScore1Y}', 'setScore1Y={state.setScore1Y}')
content = content.replace('setScore2Y={setScore2Y}', 'setScore2Y={state.setScore2Y}')

with open('f:/cronacheapp/src/FullTimeEditor/FullTimeEditor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
