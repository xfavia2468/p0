import { HashRouter, Route, Routes } from "react-router";
import "./App.css";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import BatchProcessor from "./pages/BatchProcessor";
import Resize from "./pages/Resize";
import Crop from "./pages/Crop";
import Rotate from "./pages/Rotate";
import Filters from "./pages/Filters";
import Convert from "./pages/Convert";
import Compress from "./pages/Compress";
import Flip from "./pages/Flip";
import Grayscale from "./pages/Grayscale";
import Blur from "./pages/Blur";
import Pixelate from "./pages/Pixelate";
import Watermark from "./pages/Watermark";

function App() {
	return (
		<HashRouter>
			<div className="app-container">
				<Navigation />
				<div className="main-content">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/batch" element={<BatchProcessor />} />
						<Route path="/resize" element={<Resize />} />
						<Route path="/crop" element={<Crop />} />
						<Route path="/rotate" element={<Rotate />} />
						<Route path="/filters" element={<Filters />} />
						<Route path="/convert" element={<Convert />} />
						<Route path="/compress" element={<Compress />} />
						<Route path="/flip" element={<Flip />} />
						<Route path="/grayscale" element={<Grayscale />} />
						<Route path="/blur" element={<Blur />} />
						<Route path="/pixelate" element={<Pixelate />} />
						<Route path="/watermark" element={<Watermark />} />
					</Routes>
				</div>
			</div>
		</HashRouter>
	);
}

export default App;
