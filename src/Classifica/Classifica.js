import React from 'react';
import './Classifica.css';
import ClassificaComp from '../components/ClassificaComp/ClassificaComp';

const Classifica = () => {
  return (
    <div className="classifica-container">
      <h1>Gestione Classifica</h1>
      <ClassificaComp />
    </div>
  );
};

export default Classifica;
