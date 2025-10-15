import { HashRouter, Route, Routes } from 'react-router'
import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import AboutMe from './pages/AboutMe'
import Resize from './pages/Resize'

function App() {
  return <HashRouter>
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/about" element={<AboutMe />}></Route>
      <Route path="/resize" element={<Resize />}></Route>
    </Routes>
  </HashRouter>
}

export default App
