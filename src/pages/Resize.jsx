import { useState, useRef, useEffect, useMemo } from "react";
import { Container, Form, Button, Image, Spinner } from "react-bootstrap";

function Resize() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [editedUrl, setEditedUrl] = useState(null);
	const [keepAspect, setKeepAspect] = useState(true);
	const [loading, setLoading] = useState(false);
	const [format, setFormat] = useState("image/png"); // PNG by default

	const widthRef = useRef(null);
	const heightRef = useRef(null);
	const canvasRef = useRef(null);

	// 🧹 Cleanup created object URLs to avoid memory leaks
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			if (editedUrl) URL.revokeObjectURL(editedUrl);
		};
	}, [previewUrl, editedUrl]);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
		setEditedUrl(null);
	};

	// 🖼️ Helper: load image as a Promise
	const loadImage = (file) =>
		new Promise((resolve, reject) => {
			const img = new window.Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = URL.createObjectURL(file);
		});

	const handleResize = async () => {
		if (!selectedFile) {
			alert("Please select an image first.");
			return;
		}

		let width = parseInt(widthRef.current.value);
		let height = parseInt(heightRef.current.value);
		if (!width && !height) {
			alert("Please specify at least a width or height.");
			return;
		}

		setLoading(true);
		setEditedUrl(null);

		try {
			const img = await loadImage(selectedFile);
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");

			let targetWidth = width || img.width;
			let targetHeight = height || img.height;

			if (keepAspect) {
				const aspect = img.width / img.height;
				if (width && !height) targetHeight = Math.round(width / aspect);
				else if (!width && height) targetWidth = Math.round(height * aspect);
				else if (width && height) {
					const ratio = Math.min(width / img.width, height / img.height);
					targetWidth = Math.round(img.width * ratio);
					targetHeight = Math.round(img.height * ratio);
				}
			}

			canvas.width = targetWidth;
			canvas.height = targetHeight;
			ctx.clearRect(0, 0, targetWidth, targetHeight);
			ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

			canvas.toBlob(
				(blob) => {
					if (!blob) {
						alert("Failed to process image.");
						setLoading(false);
						return;
					}
					const url = URL.createObjectURL(blob);
					setEditedUrl(url);
					setLoading(false);
				},
				format,
				format === "image/jpeg" ? 0.9 : 1.0 // optional quality control
			);
		} catch (err) {
			console.error(err);
			alert("Failed to load or resize image.");
			setLoading(false);
		}
	};

	const handleDownload = () => {
		if (!editedUrl) return;
		const ext =
			format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
		const link = document.createElement("a");
		link.href = editedUrl;
		link.download = `resized_image.${ext}`;
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

	// 🔢 Optional: live preview of target dimensions
	const targetDimensions = useMemo(() => {
		if (!selectedFile) return null;
		const width = parseInt(widthRef.current?.value);
		const height = parseInt(heightRef.current?.value);
		if (!width && !height) return null;
		return { width, height };
	}, [selectedFile, keepAspect]);

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
					min="1"
					max="4000"
					step="any"
					onInput={(e) => {
						let val = parseFloat(e.target.value);
						if (isNaN(val)) return;
						val = Math.floor(val);
						val = Math.min(4000, Math.max(1, val));
						e.target.value = val;
					}}
					onKeyDown={(e) => {
						if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
					}}
				/>

				<Form.Control
					ref={heightRef}
					type="number"
					placeholder="Height (px)"
					style={{ maxWidth: "150px" }}
					min="1"
					max="4000"
					step="any"
					onInput={(e) => {
						let val = parseFloat(e.target.value);
						if (isNaN(val)) return;
						val = Math.floor(val);
						val = Math.min(4000, Math.max(1, val));
						e.target.value = val;
					}}
					onKeyDown={(e) => {
						if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
					}}
				/>
			</Form.Group>

			<Form.Group className="mb-3 d-flex justify-content-center gap-3">
				<Form.Check
					type="checkbox"
					label="Keep Aspect Ratio"
					checked={keepAspect}
					onChange={(e) => setKeepAspect(e.target.checked)}
				/>

				<Form.Select
					value={format}
					onChange={(e) => setFormat(e.target.value)}
					style={{ maxWidth: "180px" }}
				>
					<option value="image/png">PNG</option>
					<option value="image/jpeg">JPEG</option>
					<option value="image/webp">WEBP</option>
				</Form.Select>
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
					onClick={handleResize}
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
						style={{ maxWidth: "300px", marginBottom: "10px" }}
					/>
					<p>
						Size: {canvasRef.current?.width} × {canvasRef.current?.height} px
					</p>
					<Button variant="success" onClick={handleDownload}>
						Download
					</Button>
				</div>
			)}

			<canvas ref={canvasRef} style={{ display: "none" }} />
		</Container>
	);
}

export default Resize;
