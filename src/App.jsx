import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Painter from './Painter';
import Crop from './Crop';

const Main = () => {
    return (
        <Router>
          <Routes>
            {/* <Route path="/" element={<Crop />} /> */}
            <Route path="/" element={<Painter />} />
          </Routes>
        </Router>
      );
};

export default Main;