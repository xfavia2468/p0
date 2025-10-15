import { useState, useRef } from "react";
import { Container, Form, Button, Image, Spinner } from "react-bootstrap";

function Resize() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [keepAspect, setKeepAspect] = useState(true);
	const [loading, setLoading] = useState(false);

	const widthRef = useRef(null);
	const heightRef = useRef(null);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		setSelectedFile(file);
		setPreviewUrl(file ? URL.createObjectURL(file) : null);
		setEditedUrl(null);
	};

	const handleSubmit = async () => {
		const width = widthRef.current.value;
		const height = heightRef.current.value;

		if (!selectedFile || (!width && !height)) {
			alert("Please select an image and provide at least width or height.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			if (width) formData.append("width", width);
			if (height) formData.append("height", height);
			formData.append("keep_aspect_ratio", keepAspect ? "true" : "false");

			const response = await fetch("https://oyyi.xyz/api/image/resize", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

			const blob = await response.blob();
			const imageUrl = URL.createObjectURL(blob);
			setEditedUrl(imageUrl);
		} catch (error) {
			console.error("Image resize failed:", error);
			alert("Image resize failed. Check console for details.");
		} finally {
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = "resized_image.png";
		link.click();
	};

	const handleReset = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setEditedUrl(null);
		setKeepAspect(true);
		if (widthRef.current) widthRef.current.value = "";
		if (heightRef.current) heightRef.current.value = "";
	};

	return (
		<Container className="py-5 text-center">
			<h2 className="mb-4">Image Resizer</h2>

			<Form.Group className="mb-3">
				<Form.Control
					type="file"
					accept="image/*"
					onChange={handleFileChange}
				/>
			</Form.Group>

			<Form.Group className="mb-3 d-flex justify-content-center gap-2">
				<Form.Control
					ref={widthRef}
					type="number"
					placeholder="Width (px)"
					style={{ maxWidth: "150px" }}
				/>
				<Form.Control
					ref={heightRef}
					type="number"
					placeholder="Height (px)"
					style={{ maxWidth: "150px" }}
				/>
			</Form.Group>

			<Form.Group className="mb-3 d-flex justify-content-center">
				<Form.Check
					type="checkbox"
					label="Keep Aspect Ratio"
					checked={keepAspect}
					onChange={(e) => setKeepAspect(e.target.checked)}
				/>
			</Form.Group>

			{previewUrl && (
				<>
					<h5>Preview:</h5>
					<Image
						src={previewUrl}
						thumbnail
						style={{ maxWidth: "300px", marginBottom: "20px" }}
					/>
				</>
			)}

			<div className="mb-3 d-flex justify-content-center gap-2">
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={!selectedFile || loading}
				>
					{loading ? <Spinner animation="border" size="sm" /> : "Resize Image"}
				</Button>
				<Button variant="secondary" onClick={handleReset}>
					Reset
				</Button>
			</div>

			{editedUrl && (
				<div>
					<h5>Resized Image:</h5>
					<Image
						src={editedUrl}
						thumbnail
						style={{ maxWidth: "300px", marginBottom: "20px" }}
					/>
					<br />
					<Button variant="success" onClick={handleDownload}>
						Download
					</Button>
				</div>
			)}
		</Container>
	);
}

export default Resize;
