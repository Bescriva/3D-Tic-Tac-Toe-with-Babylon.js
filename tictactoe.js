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
    #playerTurn = 0;
    #isGameOver = 0;

    constructor(canvas) {
        BABYLON.Logger.LogLevels = BABYLON.Logger.NONE;
        this.#engine = new BABYLON.Engine(canvas, true);
        this.#scene = new BABYLON.Scene(this.#engine);
        this.#initScene(canvas);
        this.#createBoard();
        this.#startRenderLoop();
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

    #startRenderLoop() {
        this.#engine.runRenderLoop(() => {
            this.#scene.render();
        });
    }

    #show3DMessage(message, color = "yellow") {
        const plane = BABYLON.MeshBuilder.CreatePlane("msg", { width: 3, height: 1 }, this.#scene);
        plane.position = new BABYLON.Vector3(0, 1.5, 0);
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        const dt = new BABYLON.DynamicTexture("msgDt", {width:750, height:375}, this.#scene, false);
        dt.hasAlpha = true;
        dt.drawText(message, null, 180, "bold 100px Arial", color, "transparent");

        const mat = new BABYLON.StandardMaterial("msgMat", this.#scene);
        mat.diffuseTexture = dt;
        mat.specularColor = new BABYLON.Color3(0, 0, 0);
        mat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        plane.material = mat;

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

        setTimeout(() => plane.dispose(), 2000);
    }

    #createXMesh(position) {
        const group = new BABYLON.TransformNode("X", this.#scene);

        const bar1 = BABYLON.MeshBuilder.CreateBox("bar1", {height: 0.2, width: 0.8, depth: 0.2}, this.#scene);
        const bar2 = BABYLON.MeshBuilder.CreateBox("bar2", {height: 0.2, width: 0.8, depth: 0.2}, this.#scene);

        bar1.rotate(BABYLON.Axis.Y, Math.PI / 4, BABYLON.Space.LOCAL);
        bar2.rotate(BABYLON.Axis.Y, -Math.PI / 4, BABYLON.Space.LOCAL);

        bar1.material = new BABYLON.StandardMaterial("xMat", this.#scene);
        bar2.material = bar1.material;
        bar1.material.diffuseColor = new BABYLON.Color3(1, 0, 0);

        bar1.parent = group;
        bar2.parent = group;

        group.position = new BABYLON.Vector3(position.x, position.y + 0.6, position.z);
        return group;
    }

    #createOMesh(position) {
        const torus = BABYLON.MeshBuilder.CreateTorus("O", {
            diameter: 0.65,
            thickness: 0.2,
            tessellation: 32
        }, this.#scene);

        torus.material = new BABYLON.StandardMaterial("oMat", this.#scene);
        torus.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1);

        torus.position = new BABYLON.Vector3(position.x, position.y + 0.6, position.z);
        return torus;
    }

    #checkWin(symbol) {
        return TicTacToeGame.#WIN_COMBOS.some(([a, b, c]) =>
            this.#board[a] === symbol &&
            this.#board[b] === symbol &&
            this.#board[c] === symbol
        );
    }

    handleMove(index) {
        if (this.#board[index] !== null || this.#isGameOver)
            return;

        const symbol = this.#playerTurn === 0 ? "X" : "O";

        this.#board[index] = symbol;
        this.#boxes[index].material.diffuseColor = symbol === "X"
            ? new BABYLON.Color3(1, 0.5, 0.5)
            : new BABYLON.Color3(0.5, 0.5, 1);

        if (symbol === "X")
            this.#labels[index] = this.#createXMesh(this.#boxes[index].position);
        else
            this.#labels[index] = this.#createOMesh(this.#boxes[index].position);

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

    #createBoard() {
        TicTacToeGame.#POSITIONS.forEach((pos, i) => {
            const box = BABYLON.MeshBuilder.CreateBox(`box${i}`, { size: 0.9 }, this.#scene);
            box.position = new BABYLON.Vector3(pos[0], 0, pos[1]);

            const mat = new BABYLON.StandardMaterial(`mat${i}`, this.#scene);
            mat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
            box.material = mat;

            box.actionManager = new BABYLON.ActionManager(this.#scene);
            box.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                    this.handleMove(i);
                })
            );

            this.#boxes[i] = box;
        });
    }
}

const game = new TicTacToeGame(document.getElementById("canvas"));
