import React, { createContext, useContext, useState, useCallback } from "react";

const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
	const [image, setImage] = useState(null);
	const [batchImages, setBatchImages] = useState([]);

	const addBatchImage = useCallback((file, url) => {
		setBatchImages((prev) => [...prev, { id: Date.now(), file, url }]);
	}, []);

	const removeBatchImage = useCallback((id) => {
		setBatchImages((prev) => prev.filter((img) => img.id !== id));
	}, []);

	const clearBatchImages = useCallback(() => {
		setBatchImages([]);
	}, []);

	return (
		<ImageContext.Provider
			value={{
				image,
				setImage,
				batchImages,
				addBatchImage,
				removeBatchImage,
				clearBatchImages,
			}}
		>
			{children}
		</ImageContext.Provider>
	);
};

export const useImage = () => useContext(ImageContext);
