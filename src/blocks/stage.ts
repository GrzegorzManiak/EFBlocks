import Konva from "konva";


let stageRect: { x1: number, y1: number, x2: number, y2: number, offset: { x: number, y: number } };
let viewRect: { x1: number, y1: number, x2: number, y2: number };
let gridFullRect: { x1: number, y1: number, x2: number, y2: number };
let gridOffset: { x: number, y: number };
let gridRect: { x1: number, y1: number, x2: number, y2: number };

const stepSize = 40;

function drawLines(stage: Konva.Stage, gridLayer: Konva.Layer) {
	const [width, height] = [window.innerWidth, window.innerHeight];

	gridLayer.clear();
	gridLayer.destroyChildren();
	gridLayer.clipWidth(stage.width());

	stageRect = {
		x1: 0,
		y1: 0,
		x2: stage.width(),
		y2: stage.height(),
		offset: {
			x: unScale(stage.position().x, stage),
			y: unScale(stage.position().y, stage),
		}
	};
	viewRect = {
		x1: -stageRect.offset.x,
		y1: -stageRect.offset.y,
		x2: unScale(width, stage) - stageRect.offset.x,
		y2: unScale(height, stage) - stageRect.offset.y
	};
	gridOffset = {
		x: Math.ceil(unScale(stage.position().x, stage) / stepSize) * stepSize,
		y: Math.ceil(unScale(stage.position().y, stage) / stepSize) * stepSize,
	};
	gridRect = {
		x1: -gridOffset.x,
		y1: -gridOffset.y,
		x2: unScale(width, stage) - gridOffset.x + stepSize,
		y2: unScale(height, stage) - gridOffset.y + stepSize
	};
	gridFullRect = {
		x1: Math.min(stageRect.x1, gridRect.x1),
		y1: Math.min(stageRect.y1, gridRect.y1),
		x2: Math.max(stageRect.x2, gridRect.x2),
		y2: Math.max(stageRect.y2, gridRect.y2)
	};

	drawGrid(stage, gridLayer);
}


function unScale(val: number, stage: Konva.Stage) {
	return (val / stage.scaleX());
}

function scaleOpacity(scale: number, minOpacity = 0, maxOpacity = 0.1) {
	if (scale > 1) return maxOpacity;
	if (scale < 0.5) return minOpacity;
	return (maxOpacity - minOpacity) * (scale - 0.5) / 0.5 + minOpacity;
}


function drawGrid(stage: Konva.Stage, gridLayer: Konva.Layer) {
	if (stage.scaleX() < 0.5) return;

	gridLayer.clip({
		x: viewRect.x1,
		y: viewRect.y1,
		width: viewRect.x2 - viewRect.x1,
		height: viewRect.y2 - viewRect.y1
	});

	let fullRect = gridFullRect;

	const
		xSize = (fullRect.x2 - fullRect.x1),
		ySize = (fullRect.y2 - fullRect.y1),
		xSteps = Math.round(xSize/ stepSize),
		ySteps = Math.round(ySize / stepSize);

	// draw vertical lines
	for (let i = 0; i <= xSteps; i++) {
		gridLayer.add(
			new Konva.Line({
				x: fullRect.x1 + i * stepSize,
				y: fullRect.y1,
				points: [0, 0, 0, ySize],
				stroke: `rgba(0, 0, 0, ${scaleOpacity(stage.scaleX())})`,
				strokeWidth: 1,
			})
		);
	}

	//draw Horizontal lines
	for (let i = 0; i <= ySteps; i++) gridLayer.add(new Konva.Line({
		x: fullRect.x1,
		y: fullRect.y1 + i * stepSize,
		points: [0, 0, xSize, 0],
		stroke: `rgba(0, 0, 0, ${scaleOpacity(stage.scaleX())})`,
		strokeWidth: 1,
	}));

	gridLayer.batchDraw();
	// send to back
	gridLayer.moveToBottom();
}

function createStage(stage: Konva.Stage) {

	const layer = new Konva.Layer();
	stage.add(layer);

	const gridLayer = new Konva.Layer();
	stage.add(gridLayer);

	stage.on('dragmove', () => {
		drawLines(stage, gridLayer);
	});

	drawLines(stage, gridLayer);
	let currentScale = 1;
	const scrollSpeed = 0.05;
	stage.on('wheel', (e) => {
		e.evt.preventDefault();

		const oldScale = stage.scaleX();
		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		};

		const direction = e.evt.deltaY > 0 ? -1 : 1;
		currentScale = Math.max(0.1, currentScale + direction * scrollSpeed);
		currentScale = Math.min(1.5, currentScale);
		stage.scale({ x: currentScale, y: currentScale });

		const newPos = {
			x: pointer.x - mousePointTo.x * currentScale,
			y: pointer.y - mousePointTo.y * currentScale,
		};

		stage.position(newPos);
		drawLines(stage, gridLayer);
		stage.batchDraw();
	});

	return { stage, layer, gridLayer };
}

export {
	createStage
}