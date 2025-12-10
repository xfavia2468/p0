import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import { ImageProvider } from "./ImageContext";
import { ToastProvider } from "./contexts/ToastContext";

createRoot(document.getElementById("root")).render(
	<ImageProvider>
		<ToastProvider>
			<App />
		</ToastProvider>
	</ImageProvider>
);
