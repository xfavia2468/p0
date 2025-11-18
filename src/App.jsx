import { HashRouter, Route, Routes } from 'react-router'
import './App.css'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import AboutMe from './pages/AboutMe'
import Resize from './pages/Resize'
import Crop from './pages/Crop'
import Rotate from './pages/Rotate'
import Filters from './pages/Filters'
import Convert from './pages/Convert'
import Compress from './pages/Compress'

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <Navigation />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutMe />} />
            <Route path="/resize" element={<Resize />} />
            <Route path="/crop" element={<Crop />} />
            <Route path="/rotate" element={<Rotate />} />
            <Route path="/filters" element={<Filters />} />
            <Route path="/convert" element={<Convert />} />
            <Route path="/compress" element={<Compress />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}

export default App
