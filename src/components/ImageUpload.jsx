import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';

export default function ImageUpload({ onFileSelect, accept = 'image/*' }) {
	const [previewUrl, setPreviewUrl] = useState(null);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select a valid image file.');
			return;
		}

		// Create preview URL
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);

		// Call parent callback
		if (onFileSelect) {
			onFileSelect(file, url);
		}
	};

	// Cleanup object URL on unmount
	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	return (
		<Form.Group className="mb-3">
			<Form.Control
				type="file"
				accept={accept}
				onChange={handleFileChange}
			/>
		</Form.Group>
	);
}

