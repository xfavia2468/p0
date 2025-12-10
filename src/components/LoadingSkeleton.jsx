import React from "react";
import { Placeholder, Card } from "react-bootstrap";

export function ImageSkeleton({ height = 400 }) {
	return (
		<Card style={{ height: `${height}px` }}>
			<Card.Body className="d-flex align-items-center justify-content-center">
				<Placeholder animation="glow" className="w-100 h-100">
					<Placeholder xs={12} style={{ height: "100%" }} />
				</Placeholder>
			</Card.Body>
		</Card>
	);
}

export function FormSkeleton() {
	return (
		<div className="space-y-3">
			<Placeholder animation="glow">
				<Placeholder xs={12} className="mb-3" />
			</Placeholder>
			<Placeholder animation="glow">
				<Placeholder xs={12} className="mb-3" />
			</Placeholder>
			<Placeholder animation="glow">
				<Placeholder xs={8} />
			</Placeholder>
		</div>
	);
}

export function ButtonSkeleton() {
	return (
		<Placeholder animation="glow">
			<Placeholder xs={12} style={{ height: "40px" }} />
		</Placeholder>
	);
}
