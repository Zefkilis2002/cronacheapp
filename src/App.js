import React from 'react';
import NavBar from './components/NavBar/NavBar'; 
import TabellinoControls from './components/TabellinoControls/TabellinoControls';
import Canva from './components/Canva/Canva';

import Toolbar from './components/ToolBar/ToolBar';
import FullTimeEditor from './FullTimeEditor/FullTimeEditor';


function App() {
  return (
    <div className="App">
      <NavBar />
      <FullTimeEditor />

    </div>
  );
}

export default App;
