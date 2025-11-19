import { Image, Card } from "react-bootstrap";

export default function ImagePreview({
	src,
	title,
	maxWidth = "100%",
	maxHeight = "400px",
	showSize = false,
	width,
	height,
}) { 
	if (!src) return null;

	return (
		<div className="mb-4">
			{title && <h5 className="mb-3">{title}</h5>}
			<Image
				src={src}
				thumbnail
				style={{
					maxWidth,
					maxHeight,
					display: "block",
					margin: "0 auto",
				}}
			/>
			{showSize && width && height && (
				<p className="mt-2 text-muted">
					Size: {width} × {height} px
				</p>
			)}
		</div>
	);
}
