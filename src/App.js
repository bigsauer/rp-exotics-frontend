import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppFlow from './components/AppFlow';
import NewDealEntry from './components/NewDealEntry';
import DealerSearchManagement from './components/DealerSearchManagement';
import BackOfficeDeals from './components/BackOfficeDeals';
import SalesDealTracker from './components/SalesDealTracker';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AppFlow />} />
          <Route path="/new-deal" element={<NewDealEntry />} />
          <Route path="/dealer-management" element={<DealerSearchManagement />} />
          <Route path="/back-office" element={<BackOfficeDeals />} />
          <Route path="/deal-tracker" element={<SalesDealTracker />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
