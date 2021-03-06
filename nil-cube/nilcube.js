class NilCube {

    constructor(type, cubicleSize = 256) {
        this._type = type;
        this._cubicleSize = cubicleSize;

        this._lineWidth = this._cubicleSize / (10 - type / 3);
        this._radius = this._cubicleSize / 7;
        this._cubeSize = this._cubicleSize * (this._type === 1 ? 2 + Math.tan(Math.PI * 15 / 180) : this._type);

        this._colorsMap = {
            B: "#0000f2",
            O: "#ff8600",
            Y: "#fefe00",
            W: "#ffffff",
            G: "#00f300",
            R: "#fe0000",
            D: "#505050",
            cube: "#000000",
            core: "#101010",
            arrow0u: "#888",
            arrow1u: "#000",
            arrow0d: "#888",
            arrow1d: "#fff"
        };

        this._walls = {}
    }

    setColor(key, color) {
        this._colorsMap[key] = color;
    }

    // s:256+c:white+t:3+u:UUUU+f:FF+r:RR+b:BB+l:LL+m:0MM+a:aaaaaaaaa,aaaaaaaaa
    // size:256+color:white+type:3+u:UUUU+f:FF+r:RR+b:BB+l:LL+m:0MM+a:aaaaaaaaa,aaaaaaaaa
    // size:256 color:white type:3 u:UUUU f:FF r:RR b:BB l:LL m:0MM a:aaaaaaaaa,aaaaaaaaa
    static resolve(string) {
        const time = new Date().getTime();
        const parameters = {};
        const formatted = string.replace(/%20/g, " ").replace(/[^A-Za-z0-9:+ ,]/g, "").trim().replace(/[ +]+/g, "+");

        formatted.split("+").forEach(entry => {
            const entrySplit = entry.split(":");
            parameters[entrySplit[0]] = entrySplit[1];
        });

        parameters.type = parseInt(parameters.type || parameters.t);
        parameters.size = parameters.size || parameters.s;
        parameters.cubicle = parseInt(parameters.cubicle || parameters.cs) || 256;
        parameters.color = parameters.color || parameters.c;
        parameters.a = (parameters.a || "").split(",");

        parameters.t = undefined;
        parameters.s = undefined;
        parameters.c = undefined;
        parameters.cs = undefined;

        // check 1-element blank-string array
        if (!parameters.a || !parameters.a.toString()) {
            parameters.a = undefined;
        }

        const image = this.asImage(parameters.size, parameters.color, parameters);
        NilCube.info("Resolved '" + formatted + "' as " + JSON.stringify(parameters) + " in " + (new Date().getTime() - time) + "ms");
        return image;
    }

    static asImage(size, backgroundColor, parameters) {
        const nc = new NilCube(parameters.type, parameters.cubicle);
        if (parameters.cube) {
            nc.setColor("cube", parameters.cube);
        }
        if (parameters.core) {
            nc.setColor("core", parameters.core);
        }

        if (parameters.u) {
            nc.u(parameters.u);
        }
        if (parameters.f) {
            nc.f(parameters.f);
        }
        if (parameters.b) {
            nc.b(parameters.b);
        }
        if (parameters.l) {
            nc.l(parameters.l);
        }
        if (parameters.r) {
            nc.r(parameters.r);
        }
        if (parameters.m) {
            nc.m(parameters.m);
        }

        // check 1-element blank-string array
        if (parameters.a && parameters.a.toString()) {
            nc.a(parameters.a);
        }

        return nc.toImage(size, backgroundColor);
    }

    static toCanvas(context) {
        return context ? context.canvas : undefined;
    }

    toImage(size, backgroundColor) {
        if (this._type === 1) {
            return this._toImageSq1(size, backgroundColor);
        } else {
            return this._toImageStandard(size, backgroundColor);
        }
    }

    _toImageSq1(size, backgroundColor) {
        const nc = this;
        const u = nc._walls.u;
        const uCanvas = (u || {}).canvas || {};
        const m = nc._walls.m;
        const mCanvas = (m || {}).canvas || {};

        const pad = 0.8 * nc._lineWidth;

        const width = uCanvas.width || mCanvas.width;
        const height = uCanvas.height || mCanvas.width;

        let context = NilCube.createContext(width, height);

        if (backgroundColor) {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, width, height);
        }

        context.fillStyle = nc._colorsMap.core;

        // M
        if (m) {
            context.drawImage(mCanvas, 0, 0);
        }

        if (u) {
            // F
            if (nc._walls.f) {
                context.fillRect(width / 4, height - height / 16, width / 2, -height / 8);
                context.drawImage(nc._walls.f.canvas, 0, height - nc._walls.f.canvas.height - pad);
            }
            // R
            if (nc._walls.r) {
                context.fillRect(width - width / 16, height / 4, -width / 8, height / 2);
                context.drawImage(nc._walls.r.canvas, width - nc._walls.r.canvas.width - pad, 0);
            }
            // B
            if (nc._walls.b) {
                context.fillRect(width / 4, height / 16, width / 2, height / 8);
                context.drawImage(nc._walls.b.canvas, 0, pad);
            }
            // L
            if (nc._walls.l) {
                context.fillRect(width / 16, height / 4, width / 8, height / 2);
                context.drawImage(nc._walls.l.canvas, pad, 0);
            }

            // U
            context.drawImage(uCanvas, 0, 0);
            // Ua
            if (nc._walls.ua) {
                context.drawImage(nc._walls.ua.canvas, 0, 0);
            }
        }

        if (size) {
            const scale = size / Math.max(width, height);
            const newWidth = Math.round(width * scale);
            const newHeight = Math.round(height * scale);

            const resizeContext = NilCube.createContext(newWidth, newHeight);
            resizeContext.imageSmoothingQuality = 'high';
            resizeContext.drawImage(context.canvas, 0, 0, newWidth, newHeight);
            context = resizeContext;
        }

        return context.canvas.toDataURL("image/png");
    }

    _toImageStandard(size, backgroundColor) {
        const nc = this;
        const pad = 0.4 * nc._lineWidth;
        const toWidth = (wall) => ((wall || {}).canvas || {}).width || 0;
        const toHeight = (wall) => ((wall || {}).canvas || {}).height || 0;
        const toPad = (wall) => wall ? pad : 0;

        let width = toWidth(nc._walls.l) + toWidth(nc._walls.u) + toWidth(nc._walls.r) - toPad(nc._walls.l) - toPad(nc._walls.r);
        let height = toHeight(nc._walls.b) + toHeight(nc._walls.u) + toHeight(nc._walls.f) - toPad(nc._walls.b) - toPad(nc._walls.f);
        let context = NilCube.createContext(width, height);

        if (backgroundColor) {
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, width, height);
        }

        context.fillStyle = nc._colorsMap.core;
        context.translate(-toPad(nc._walls.l), -toPad(nc._walls.b));

        // F
        let wall = nc._walls.f;
        if (wall) {
            context.fillRect(
                toWidth(nc._walls.l) + nc._cubicleSize / 2,
                height - toHeight(nc._walls.f) - nc._cubicleSize / 4,
                nc._cubicleSize * (nc._type - 1),
                nc._cubicleSize / 2);
            context.drawImage(wall.canvas, toWidth(nc._walls.l), height - toHeight(wall) + (nc._walls.b ? pad : 0));
        }
        // B
        wall = nc._walls.b;
        if (wall) {
            context.fillRect(
                toWidth(nc._walls.l) + nc._cubicleSize / 2,
                toHeight(nc._walls.b) - nc._cubicleSize / 4,
                nc._cubicleSize * (nc._type - 1),
                nc._cubicleSize / 2);
            context.drawImage(wall.canvas, toWidth(nc._walls.l), pad);
        }
        // L
        wall = nc._walls.l;
        if (wall) {
            context.fillRect(
                toWidth(nc._walls.l) + nc._cubicleSize / 4,
                toHeight(nc._walls.b) + nc._cubicleSize / 2,
                -nc._cubicleSize / 2,
                nc._cubicleSize * (nc._type - 1));
            context.drawImage(wall.canvas, pad, toHeight(nc._walls.b));
        }
        // R
        wall = nc._walls.r;
        if (wall) {
            context.fillRect(
                width - toWidth(nc._walls.r) - nc._cubicleSize / 4,
                toHeight(nc._walls.b) + nc._cubicleSize / 2,
                nc._cubicleSize / 2,
                nc._cubicleSize * (nc._type - 1));
            context.drawImage(wall.canvas, width - toWidth(wall) + (nc._walls.l ? pad : 0), toHeight(nc._walls.b));
        }

        // U
        context.drawImage(nc._walls.u.canvas, toWidth(nc._walls.l), toHeight(nc._walls.b));

        // Ua
        wall = nc._walls.ua;
        if (wall) {
            context.drawImage(wall.canvas, toWidth(nc._walls.l), toHeight(nc._walls.b));
        }

        if (size) {
            const scale = size / Math.max(width, height);
            const newWidth = Math.round(width * scale);
            const newHeight = Math.round(height * scale);

            const resizeContext = NilCube.createContext(newWidth, newHeight);
            resizeContext.imageSmoothingQuality = 'high';
            resizeContext.drawImage(context.canvas, 0, 0, newWidth, newHeight);
            context = resizeContext;
        }

        return context.canvas.toDataURL("image/png");
    }

    static autoCrop(context, boundaries = NilCube.findBoundaries(context)) {
        const canvas = context.canvas;
        const cropContext = NilCube.createContext(boundaries.width, boundaries.height);
        cropContext.imageSmoothingQuality = 'low';
        cropContext.drawImage(canvas, -boundaries.xMin, -boundaries.yMin);
        NilCube.debug("Crop (" + canvas.width.toFixed(2) + "," + canvas.height.toFixed(2) + ") (" + boundaries.width.toFixed(2) + "," + boundaries.height.toFixed(2) + ")");
        return cropContext;
    }

    static createContext(width, height) {
        return $("<canvas></canvas>").attr("width", width).attr("height", height || width)[0].getContext("2d");
    }

    static findBoundaries(context) {
        const canvas = context.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const data = context.getImageData(0, 0, width, height).data;

        let xMin = width;
        let xMax = 0;
        let yMin = height;
        let yMax = 0;

        for (let i = 0, x = 0, y = 0; i < data.length; i += 4) {
            if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0 || data[i + 3] > 0) {
                x = (i >> 2) % width;
                y = Math.floor(i / (4 * width));
                if (x < xMin) {
                    xMin = x;
                } else if (x > xMax) {
                    xMax = x;
                }
                if (y < yMin) {
                    yMin = y;
                } else if (y > yMax) {
                    yMax = y;
                }
            }
        }

        const results = {xMin: xMin, xMax: xMax + 1, yMin: yMin, yMax: yMax + 1, width: xMax - xMin + 1, height: yMax - yMin + 1};
        NilCube.debug("Boundaries x:" + results.xMin + ":" + results.xMax + " y:" + results.yMin + ":" + results.yMax + " w:" + results.width + " h:" + results.height);
        return results;
    }

    // ["2000u2200", "2022d2222", "xyxyuXYXY"]
    // ["001u061", "111d011", "anRxanR"]
    a(elements) {
        if (this._type === 1) {
            return this._aSq1(elements);
        } else {
            return this._aStandard(elements)
        }
    }

    // ["2000u2200", "2022d2222", "xyxyuXYXY"]
    _aStandard(elements) {
        const nc = this;
        const context = NilCube.createContext(nc._cubeSize, nc._cubeSize);

        context.lineCap = "round";
        context.translate(nc._cubicleSize / 2, nc._cubicleSize / 2);

        const draw = (element, type, lineWidth, colorPrefix) => {
            const x0 = (element[0] - (1 - element[2]) / 6) * nc._cubicleSize;
            const y0 = (element[1] - (1 - element[3]) / 6) * nc._cubicleSize;
            const x1 = (element[5] - (1 - element[7]) / 6) * nc._cubicleSize;
            const y1 = (element[6] - (1 - element[8]) / 6) * nc._cubicleSize;

            if (type.toLowerCase() === "x") {
                context.strokeStyle = nc._createGradientX(context, colorPrefix, x0, y0, x1, y1);
            } else {
                context.strokeStyle = nc._colorsMap[colorPrefix + type.toLowerCase()];
            }

            context.lineWidth = lineWidth;
            context.fillStyle = context.strokeStyle;

            if (type.toUpperCase() === type) {
                context.beginPath();
                context.arc(x0, y0, lineWidth, 0, 2 * Math.PI);
                context.fill();
            }

            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            NilCube.debug("A " + element + " " + context.lineWidth.toFixed(2) + "px " + context.strokeStyle + " (" + x0.toFixed(2) + "," + y0.toFixed(2) + ") (" + x1.toFixed(2) + "," + y1.toFixed(2) + ")");
            context.stroke();
        };

        elements.forEach((element) => {
            let type = element[4];
            draw(element, type, nc._lineWidth / 2, "arrow0");
            draw(element, type, nc._lineWidth / 2.5, "arrow1");
        });

        NilCube.debug("A " + elements.toString() + " " + context.canvas.width + "x" + context.canvas.height);
        nc._walls.ua = context;

        return context;
    }

    // ["001u061", "111d011", "anRxanR"]
    _aSq1(elements) {
        const nc = this;

        const a15 = Math.PI * 15 / 180;
        const a = nc._cubicleSize;
        const x = a * Math.tan(a15);
        const r = a / Math.cos(a15);
        const R = Math.sqrt(2) * a;

        const initAngle = 0;
        const context = NilCube.createContext(2 * R + nc._lineWidth / 2, 2 * R + nc._lineWidth / 2);

        context.translate(R + nc._lineWidth / 4, R + nc._lineWidth / 4);
        context.strokeStyle = nc._colorsMap.cube;
        context.lineCap = "round";
        context.rotate(Math.PI * (180 + initAngle) / 180);

        const draw = (element, type, lineWidth, colorPrefix) => {
            const angle0 = -parseInt(element.substring(0, 2)) * Math.PI * 15 / 180;
            const r0 = R * parseInt(element[2]) / 8;
            const angle1 = -parseInt(element.substring(4, 6)) * Math.PI * 15 / 180;
            const r1 = R * parseInt(element[6]) / 8;

            const x0 = r0 * Math.sin(angle0);
            const y0 = r0 * Math.cos(angle0);
            const x1 = r1 * Math.sin(angle1);
            const y1 = r1 * Math.cos(angle1);

            if (type.toLowerCase() === "x") {
                context.strokeStyle = nc._createGradientX(context, colorPrefix, x0, y0, x1, y1);
            } else {
                context.strokeStyle = nc._colorsMap[colorPrefix + type.toLowerCase()];
            }

            context.lineWidth = lineWidth;
            context.fillStyle = context.strokeStyle;

            if (type.toUpperCase() === type) {
                context.beginPath();
                context.arc(x0, y0, lineWidth, 0, 2 * Math.PI);
                context.fill();
            }

            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            NilCube.debug("A1 " + element + " " + context.lineWidth.toFixed(2) + "px " + context.strokeStyle + " (" + x0.toFixed(2) + "," + y0.toFixed(2) + ") (" + x1.toFixed(2) + "," + y1.toFixed(2) + ")");
            context.stroke();
        };

        elements.forEach((element) => {
            let type = element[3];
            draw(element, type, nc._lineWidth / 2, "arrow0");
            draw(element, type, nc._lineWidth / 2.5, "arrow1");
        });

        NilCube.debug("A1 " + elements.toString() + " " + context.canvas.width + "x" + context.canvas.height);
        nc._walls.ua = context;

        return context;
    }

    _createGradientX(context, colorPrefix, x0, y0, x1, y1) {
        const gradient = context.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, this._colorsMap[colorPrefix + "u"]);
        gradient.addColorStop(0.3, this._colorsMap[colorPrefix + "u"]);
        gradient.addColorStop(0.7, this._colorsMap[colorPrefix + "d"]);
        gradient.addColorStop(1, this._colorsMap[colorPrefix + "d"]);
        return gradient;
    }

    // "YYYYBYYYY"
    // "00YyYyYyYy"
    u(colors) {
        if (this._type === 1) {
            return this._uSq1(colors);
        } else {
            return this._uStandard(colors);
        }
    }

    // "YYYYBYYYY"
    _uStandard(colors) {
        const nc = this;
        const context = nc._wall(colors);
        const canvas = context.canvas;

        NilCube.debug("U " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.u = context;

        return context;
    }

    // "00YyYyYyYy"
    _uSq1(colors) {
        colors = colors.trim().substring(0, 2) + colors.replace(/[^A-Za-z]/g, "");
        const nc = this;

        const a15 = Math.PI * 15 / 180;
        const a = nc._cubicleSize;
        const x = a * Math.tan(a15);
        const R = Math.sqrt(2) * a;

        const initAngle = colors[2] === colors[2].toUpperCase() ? 45 : 60;
        const context = NilCube.createContext(2 * R + nc._lineWidth / 2, 2 * R + nc._lineWidth / 2);
        const canvas = context.canvas;

        context.lineWidth = nc._lineWidth / 2;
        context.translate(canvas.width / 2, canvas.height / 2);

        // core
        context.beginPath();
        context.arc(0, 0, a / 4, 0, 2 * Math.PI);
        context.fillStyle = nc._colorsMap.core;
        context.fill();

        context.strokeStyle = nc._colorsMap.cube;

        let angle = 0;
        context.rotate(Math.PI * (180 + parseInt(colors.substring(0, 2)) * 15 + initAngle) / 180);

        colors.substring(2).split("").forEach((color, index) => {
            context.rotate(angle);
            if (color.toUpperCase() === color) {
                NilCube.roundPoly(context, [[x, a], [a, a], [a, x], [0, 0]], nc._radius / 2);
                angle = 4 * a15;
            } else {
                context.rotate(-4 * a15);
                NilCube.roundPoly(context, [[0, a], [x, a], [0, 0], [-x, a]], nc._radius / 2);
                context.rotate(4 * a15);
                angle = 2 * a15;
            }

            context.fillStyle = nc._colorsMap[color.toUpperCase()];
            context.fill();
            context.stroke();

            NilCube.debug("U1 " + index + " " + color + " " + (angle * 180 / Math.PI).toFixed(0) + "deg");
        });

        NilCube.debug("U1 " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.u = context;

        return context;
    }

    // "1WD"
    m(colors = "0WW") {
        const nc = this;

        const a15 = Math.PI * 15 / 180;
        const a = nc._cubicleSize;
        const x = a * Math.tan(a15);
        const R = Math.sqrt(2) * a;

        const context = NilCube.createContext(2 * R + nc._lineWidth / 2, 2 * R + nc._lineWidth / 2);
        const canvas = context.canvas;

        context.lineWidth = nc._lineWidth / 2;
        context.translate(R + nc._lineWidth / 4, R + nc._lineWidth / 4);
        context.strokeStyle = nc._colorsMap.cube;

        if (colors[0] === "1") {
            NilCube.roundPoly(context, [[-a, -a], [x, -a], [-x, a], [-a, a]], nc._radius / 2);
            context.rotate((180 + 30) * Math.PI / 180);
            context.fillStyle = nc._colorsMap[colors[1]];
            context.fill();
            context.stroke();
            NilCube.roundPoly(context, [[-a, -a], [-x, -a], [x, a], [-a, a]], nc._radius / 2);
            context.fillStyle = nc._colorsMap[colors[2]];
            context.fill();
            context.stroke();
        } else {
            NilCube.roundPoly(context, [[-a, -a], [x, -a], [-x, a], [-a, a]], nc._radius / 2);
            context.rotate(Math.PI);
            context.fillStyle = nc._colorsMap[colors[1]];
            context.fill();
            context.stroke();
            NilCube.roundPoly(context, [[-a, -a], [x, -a], [-x, a], [-a, a]], nc._radius / 2);
            context.fillStyle = nc._colorsMap[colors[2]];
            context.fill();
            context.stroke();
        }

        NilCube.debug("M1 " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.m = context;

        return context;
    }

    // "YYYYBYYYY"
    f(colors) {
        const nc = this;
        const context = nc._side(colors);
        const canvas = context.canvas;

        NilCube.debug("F " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.f = context;

        return context;
    }

    // "YYYYBYYYY"
    b(colors) {
        const nc = this;
        const context = NilCube.rotate(nc._side(colors), 180);
        const canvas = context.canvas;

        NilCube.debug("B " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.b = context;

        return context;
    }

    // "YYYYBYYYY"
    l(colors) {
        const nc = this;
        const context = NilCube.rotate(nc._side(colors), 90);
        const canvas = context.canvas;

        NilCube.debug("L " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.l = context;

        return context;
    }

    // "YYYYBYYYY"
    r(colors) {
        const nc = this;
        const context = NilCube.rotate(nc._side(colors), 270);
        const canvas = context.canvas;

        NilCube.debug("R " + colors + " " + canvas.width + "x" + canvas.height);
        nc._walls.r = context;

        return context;
    }

    _side(colors, cutCorners = false) {
        const nc = this;
        const context = nc._wall(colors, {baseHeight: 0.5, height: 1, baseLineWidth: 0.8, lineWidth: 1}, cutCorners);
        return NilCube.fakePerspective(context, 0.04 * this._cubicleSize);
    }

    _wall(colors, shrink = {baseHeight: 1, height: 1, baseLineWidth: 1, lineWidth: 1}, cutCorners = true) {
        colors = colors.replace(/[^A-Za-z]/g, "");
        const nc = this;

        const sq1x = Math.ceil(nc._cubicleSize * Math.tan(Math.PI * 15 / 180));
        const R = Math.sqrt(2) * nc._cubicleSize;

        const hFactor = row => (1 - Math.pow(shrink.height, row)) / (1 - shrink.height);

        const rowsCount = nc._type === 1 ? 1 : Math.ceil(colors.length / nc._type);
        const imageHeight = shrink.baseHeight * nc._cubicleSize * (shrink.height === 1 ? rowsCount : hFactor(rowsCount));
        const imageWidth = nc._type === 1 ? 2 * R + nc._lineWidth / 2 : nc._cubicleSize * nc._type;

        const context = NilCube.createContext(imageWidth, imageHeight);

        let getCol;
        let getRow;
        let getX;
        let getY;
        let getWidth;

        if (nc._type === 1) {
            getCol = index => index;
            getRow = () => 0;
            getX = col => [0, nc._cubicleSize - sq1x, nc._cubicleSize + sq1x][col];
            getY = () => 0;
            getWidth = col => [nc._cubicleSize - sq1x, 2 * sq1x][col % 2];

            context.translate(R + nc._lineWidth / 4 - nc._cubicleSize, 0);
        } else {
            getCol = index => index % nc._type;
            getRow = index => Math.floor(index / nc._type);
            getX = col => col * nc._cubicleSize;
            getY = row => Math.floor(shrink.baseHeight * nc._cubicleSize * (shrink.height === 1 ? row : hFactor(row)));
            getWidth = () => nc._cubicleSize;
        }

        // core
        context.fillStyle = nc._colorsMap.core;
        context.fillRect(nc._cubicleSize / 2, shrink.baseHeight * nc._cubicleSize / 2, nc._cubicleSize * (nc._type - 1), imageHeight - shrink.baseHeight * nc._cubicleSize / 2 - shrink.baseHeight * nc._cubicleSize * Math.pow(shrink.height, rowsCount - 1) / 2);

        colors.split("").forEach((color, index) => {
            const col = getCol(index);
            const row = getRow(index);

            const x = getX(col);
            const y = getY(row);
            const width = getWidth(col);

            NilCube.debug("W" + index + " " + color + " (" + x.toFixed(2) + "," + y.toFixed(2) + ") " + width.toFixed(2) + "px");

            const cornerCut = cutCorners ? {row: row, col: col} : false;
            const cubicle = nc._cubicle(color, width, Math.ceil(shrink.baseHeight * nc._cubicleSize * Math.pow(shrink.height, row)), nc._lineWidth * shrink.baseLineWidth * Math.pow(shrink.lineWidth, row), nc._radius / 4, cornerCut);
            context.drawImage(cubicle.canvas, x, y);
        });

        return context;
    }

    _cubicle(color, width, height, lineWidth, radius = 0, cornerCut = false) {
        const nc = this;
        const context = NilCube.createContext(width, height);
        const r = [radius, radius, radius, radius];

        context.lineWidth = lineWidth;

        if (cornerCut) {
            const row = cornerCut.row;
            const col = cornerCut.col;
            const rMultiplier = cornerCut.m || 3;

            if (col === 0 && row === 0) { // corners
                r[2] *= nc._type === 2 ? rMultiplier : 1;
            } else if (col === nc._type - 1 && row === 0) {
                r[3] *= nc._type === 2 ? rMultiplier : 1;
            } else if (col === 0 && row === nc._type - 1) {
                r[1] *= nc._type === 2 ? rMultiplier : 1;
            } else if (col === nc._type - 1 && row === nc._type - 1) {
                r[0] *= nc._type === 2 ? rMultiplier : 1;
            } else if (row === 0) { // edges
                r[2] *= rMultiplier;
                r[3] *= rMultiplier;
            } else if (row === nc._type - 1) {
                r[0] *= rMultiplier;
                r[1] *= rMultiplier;
            } else if (col === 0) {
                r[1] *= rMultiplier;
                r[2] *= rMultiplier;
            } else if (col === nc._type - 1) {
                r[0] *= rMultiplier;
                r[3] *= rMultiplier;
            } else { // middle
                r[0] *= rMultiplier;
                r[1] *= rMultiplier;
                r[2] *= rMultiplier;
                r[3] *= rMultiplier;
            }
        }

        // cubicle
        const c = lineWidth / 2;
        context.fillStyle = nc._colorsMap[color];
        context.strokeStyle = nc._colorsMap.cube;
        context.lineCap = "round";
        NilCube.roundPoly(context, [[c, c, r[0]], [0 + width - c, c, r[1]], [0 + width - c, 0 + height - c, r[2]], [c, 0 + height - c, r[3]]]);
        context.stroke();
        context.fill();

        return context;
    }

    // context, [[1,2,5],[2,3,6],[x,y,r]]
    // context, [[1,2],[2,3],[x,y]], r
    // based on https://stackoverflow.com/a/7838871
    static roundPoly(context, points, r) {
        context.beginPath();
        context.moveTo(points[0][0] + (points[0][2] || r), points[0][1]);
        for (var i = 0, i1 = 1, i2 = 2; i < points.length; i++, i1 = (i1 + 1) % points.length, i2 = (i2 + 1) % points.length) {
            context.arcTo(points[i1][0], points[i1][1], points[i2][0], points[i2][1], points[i1][2] || r);
        }
        context.closePath();
    }

    static rotate(context, angle) {
        const canvas = context.canvas;
        let x = 0, y = 0, width = canvas.width, height = canvas.height;

        if (angle === 90) {
            width = canvas.height;
            height = canvas.width;
            x = width;
        } else if (angle === 180) {
            x = width;
            y = height;
        } else if (angle === 270) {
            width = canvas.height;
            height = canvas.width;
            y = height;
        } else if (angle % 360 !== 0) {
            throw "Unsupported rotation angle " + angle;
        }

        const rotateContext = NilCube.createContext(width, height);

        rotateContext.translate(x, y);
        rotateContext.rotate(angle * Math.PI / 180);
        rotateContext.drawImage(canvas, 0, 0);

        return rotateContext;
    }

    static fakePerspective(context, pad) {
        const canvas = context.canvas;
        const width = canvas.width;
        const height = canvas.height;
        let destinationHeight = 0;

        const perspective = NilCube.createContext(width, height);
        perspective.imageSmoothingEnabled = true;
        perspective.imageSmoothingQuality = 'high';

        for (let i = 0, srcY = 0; srcY < height; i++, destinationHeight++, srcY = i + 0.03 * i * i / pad) {
            perspective.drawImage(canvas,
                0, srcY, width, 1,
                pad + i / 4, i, width - 2 * (pad + i / 4), 1);

        }

        const trimmed = this.createContext(width, destinationHeight);
        trimmed.drawImage(perspective.canvas, 0, 0);
        return trimmed;
    }

    static debug(message) {
        if (NilCube.debugEnabled === true) {
            console.log("NilCube.DEBUG " + message);
        }
    }

    static info(message) {
        console.log("NilCube.INFO  " + message);
    }
}

// NilCube.debugEnabled = true;