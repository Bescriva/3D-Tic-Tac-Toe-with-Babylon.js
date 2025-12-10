class TicTacToeGame {
	static #WIN_COMBOS = [
		[0,1,2],[3,4,5],[6,7,8],
		[0,3,6],[1,4,7],[2,5,8],
		[0,4,8],[2,4,6]
	];
	static #POSITIONS = [
		[-1, -1], [0, -1], [1, -1],
		[-1, 0], [0, 0], [1, 0],
		[-1, 1], [0, 1], [1, 1],
	];

	#engine;
	#scene;
	#board = Array(9).fill(null);
	#boxes = [];
	#labels = [];
	#materials;
	#playerTurn = 0;
	#isGameOver = 0;

	constructor(canvas) {
		BABYLON.Logger.LogLevels = BABYLON.Logger.NONE;
		this.#engine = new BABYLON.Engine(canvas, true);
		this.#scene = new BABYLON.Scene(this.#engine);
		this.#materials = this.#setMaterials();
		this.#initScene(canvas);
		this.#createBoard();
		this.#startRenderLoop();
	}

	#setMaterials() {
		const mats = {};

		mats.whiteBox = new BABYLON.StandardMaterial("whiteBox", this.#scene);
		mats.whiteBox.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);

		mats.redBox = new BABYLON.StandardMaterial("redBox", this.#scene);
		mats.redBox.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5);

		mats.blueBox = new BABYLON.StandardMaterial("blueBox", this.#scene);
		mats.blueBox.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);

		mats.xLabel = new BABYLON.StandardMaterial("xLabel", this.#scene);
		mats.xLabel.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);

		mats.oLabel = new BABYLON.StandardMaterial("oLabel", this.#scene);
		mats.oLabel.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1);

		mats.msg = new BABYLON.StandardMaterial("msg", this.#scene);
		mats.msg.emissiveColor = new BABYLON.Color3(0, 0, 0);
		mats.msg.specularColor = new BABYLON.Color3(0, 0, 0);

		return mats;
	}

	#initScene(canvas) {
		const camera = new BABYLON.ArcRotateCamera(
			"camera",
			0,
			0,
			8,
			BABYLON.Vector3.Zero(),
			this.#scene
		);
		camera.attachControl(canvas, true);

		const light = new BABYLON.HemisphericLight(
			"light",
			new BABYLON.Vector3(1, 2, -1),
			this.#scene
		);
		light.intensity = 1;
	}

	#createBoard() {
		TicTacToeGame.#POSITIONS.forEach((pos, i) => {
			const box = BABYLON.MeshBuilder.CreateBox(`box${i}`, { size: 0.9 }, this.#scene);

			box.position = new BABYLON.Vector3(pos[0], 0, pos[1]);
			box.material = this.#materials.whiteBox;
			this.#boxes[i] = box;

			box.actionManager = new BABYLON.ActionManager(this.#scene);
			box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
				BABYLON.ActionManager.OnPickTrigger, () => this.handleMove(i)
			));

			box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
				BABYLON.ActionManager.OnPointerOverTrigger, () => {
					if (this.#board[i] === null && !this.#isGameOver) {
						this.#boxes[i].material = this.#playerTurn === 0
							? this.#materials.redBox
							: this.#materials.blueBox;
					}
				}
			));

			box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
				BABYLON.ActionManager.OnPointerOutTrigger, () => {
					if (this.#board[i] === null && !this.#isGameOver)
						this.#boxes[i].material = this.#materials.whiteBox;
				}
			));
		});
	}

	#startRenderLoop() {
		this.#engine.runRenderLoop(() => {
			this.#scene.render();
		});
	}

	handleMove(index) {
		if (this.#board[index] !== null || this.#isGameOver)
			return;

		const symbol = this.#playerTurn === 0 ? "X" : "O";

		if (symbol === "X") {
			this.#boxes[index].material = this.#materials.redBox
			this.#labels[index] = this.#createXMesh(this.#boxes[index].position);
		} else {
			this.#boxes[index].material = this.#materials.blueBox;
			this.#labels[index] = this.#createOMesh(this.#boxes[index].position);
		}

		const didWin = this.#checkWin(symbol);
		const didDraw = this.#board.every(c => c !== null)

		if (didDraw || didWin) {
			this.#isGameOver = 1;
			setTimeout(() => {
				const msg = didWin
					? `Player ${symbol} Wins!`
					: "It's a Tie!";

				const color = didWin
					? symbol === "X" ? "red" : "blue"
					: "white";

				this.#show3DMessage(msg, color);
				setTimeout(() => this.resetGame(), 2000);
			}, 100);
			return;
		}

		this.#playerTurn = 1 - this.#playerTurn;
	}

	#checkWin(symbol) {
		return TicTacToeGame.#WIN_COMBOS.some(([a, b, c]) =>
			this.#board[a] === symbol &&
			this.#board[b] === symbol &&
			this.#board[c] === symbol
		);
	}

	resetGame() {
		this.#boxes.forEach(b => b.dispose());
		this.#labels.forEach(l => l.dispose());
		this.#board = Array(9).fill(null);
		this.#boxes = [];
		this.#labels = [];
		this.#playerTurn = 0;
		this.#isGameOver = 0;
		this.#createBoard();
	}

	#createXMesh(position) {
		const group = new BABYLON.TransformNode("X", this.#scene);

		const [bar1, bar2] = ["bar1", "bar2"].map(name =>
			BABYLON.MeshBuilder.CreateBox(name, {
				height: 0.2,
				width: 0.8,
				depth: 0.2
			}, this.#scene)
		);

		[bar1, bar2].forEach((bar, i) => {
			bar.rotate(BABYLON.Axis.Y, Math.PI / 4 * ((i == 0) ? 1 : -1), BABYLON.Space.LOCAL);
			bar.material = this.#materials.xLabel;
			bar.parent = group;
		});

		group.position = new BABYLON.Vector3(position.x, position.y + 0.6, position.z);
		group.freezeWorldMatrix();
		return group;
	}

	#createOMesh(position) {
		const torus = BABYLON.MeshBuilder.CreateTorus("O", {
			diameter: 0.65,
			thickness: 0.2,
			tessellation: 32
		}, this.#scene);

		torus.material = this.#materials.oLabel;
		torus.position = new BABYLON.Vector3(position.x, position.y + 0.6, position.z);
		torus.freezeWorldMatrix();
		return torus;
	}

	#show3DMessage(message, color = "yellow") {
		const plane = BABYLON.MeshBuilder.CreatePlane("msg", {width: 3, height: 1}, this.#scene);
		plane.position = new BABYLON.Vector3(0, 1.5, 0);
		plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

		const dt = new BABYLON.DynamicTexture("msgDt", {width:750, height:375}, this.#scene, false);
		dt.hasAlpha = true;
		dt.drawText(message, null, 180, "bold 100px Arial", color, "transparent");

		plane.material = this.#materials.msg;
		plane.material.diffuseTexture = dt;

		plane.scaling = new BABYLON.Vector3(0,0,0);
		const anim = new BABYLON.Animation("scaleAnim", "scaling", 60,
			BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
			BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		const keys = [
			{frame: 0, value: new BABYLON.Vector3(0,0,0)},
			{frame: 10, value: new BABYLON.Vector3(1.2,1.2,1.2)},
			{frame: 20, value: new BABYLON.Vector3(1,1,1)}
		];
		anim.setKeys(keys);
		plane.animations.push(anim);
		this.#scene.beginAnimation(plane, 0, 20, false);

		setTimeout(() => {
			dt.dispose();
			plane.dispose()
		}, 2000);
	}
}

const game = new TicTacToeGame(document.getElementById("canvas"));
