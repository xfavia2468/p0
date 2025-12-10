import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);

	const addToast = useCallback((message, type = "info", duration = 3000) => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);

		if (duration > 0) {
			setTimeout(() => {
				setToasts((prev) => prev.filter((t) => t.id !== id));
			}, duration);
		}

		return id;
	}, []);

	const removeToast = useCallback((id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ addToast, removeToast }}>
			{children}
			<ToastContainer
				position="top-end"
				className="p-3"
				style={{ zIndex: 1050 }}
			>
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						onClose={() => removeToast(toast.id)}
						show={true}
						delay={3000}
						autohide
						bg={
							toast.type === "success"
								? "success"
								: toast.type === "error"
								? "danger"
								: "info"
						}
						style={
							toast.type === "success"
								? { backgroundColor: "#155724", borderColor: "#1e6233" }
								: {}
						}
					>
						<Toast.Body
							className={
								toast.type === "success" || toast.type === "error"
									? "text-white"
									: ""
							}
						>
							{toast.message}
						</Toast.Body>
					</Toast>
				))}
			</ToastContainer>
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return context;
};
