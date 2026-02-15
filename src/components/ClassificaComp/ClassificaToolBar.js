import React from 'react';
import '../FullTimeComp/ToolBar/ToolBar.css'; // Reuse existing styles

const ClassificaToolBar = ({
    userImage,
    increaseImageSize,
    decreaseImageSize
}) => {
    return (
        <div className="toolbar">
            <div className="toolbar-row">
                <button onClick={increaseImageSize}>Img+</button>
                <button onClick={decreaseImageSize}>Img−</button>
            </div>
        </div>
    );
};

export default ClassificaToolBar;
