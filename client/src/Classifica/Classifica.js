import React from 'react';
import './Classifica.css';
import ClassificaComp from '../components/ClassificaComp/ClassificaComp';

const Classifica = () => {
  return (
    <div className="classifica-container">
      <h1 className="page-title">CLASSIFICA CREATOR</h1>
      <ClassificaComp />
    </div>
  );
};

export default Classifica;
