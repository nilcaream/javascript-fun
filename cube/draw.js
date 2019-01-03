class NilCube {

    constructor(type, cubicleSize = 256) {
        this._type = type;
        this._cubicleSize = cubicleSize;

        this._cubiclePadding = this._cubicleSize / 7;
        this._edgeWidth = this._cubicleSize / 5;
        this._radius = this._cubicleSize / 12;
        this._cubeSize = this._type * (this._cubicleSize + this._cubiclePadding);
        this._worldSize = (this._type + 1) * (this._cubicleSize + this._cubiclePadding);

        this._colorsMap = {
            B: "#0000f2",
            O: "#ff8600",
            Y: "#fefe00",
            W: "#ffffff",
            G: "#00f300",
            R: "#fe0000",
            D: "#808080",
            cube: "#000000",
            core: "#303030",
        };

        this._walls = {}
    }

    setColor(id, color) {
        this._colorsMap[id] = color;
    }

    toImage(size, backgroundColor) {
        const nc = this;
        const context = NilCube._createContext(nc._worldSize);
        context.translate(nc._cubicleSize / 2, nc._cubicleSize / 2);

        // U
        context.drawImage(nc._walls.u.canvas, 0, 0);

        // TODO add more walls

        let boundaries = NilCube._findBoundaries(this._context);
        let width = boundaries.width + 1;
        let height = boundaries.height + 1;
        let cropCanvas = NilCube._autoCrop(this._canvas, boundaries);

        if (backgroundColor) {
            const backgroundCanvas = $("<canvas></canvas>").attr("width", Math.ceil(cropCanvas.width * (1 + 1 / 64))).attr("height", Math.ceil(cropCanvas.height * (1 + 1 / 64)))[0];
            const backgroundContext = backgroundCanvas.getContext("2d");
            backgroundContext.fillStyle = backgroundColor;
            backgroundContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            backgroundContext.drawImage(cropCanvas, Math.ceil(cropCanvas.width * 1 / 128), Math.ceil(cropCanvas.height * 1 / 128));
            cropCanvas = backgroundCanvas;
        }
        if (size) {
            const scale = size / Math.max(width, height);
            width = Math.ceil(width * scale);
            height = Math.ceil(height * scale);
            const resizeCanvas = $("<canvas></canvas>").attr("width", width).attr("height", height)[0];
            const resizeContext = resizeCanvas.getContext("2d");
            resizeContext.imageSmoothingQuality = 'high';
            resizeContext.drawImage(cropCanvas, 0, 0, width, height);
            return resizeCanvas.toDataURL("image/png");
        } else {
            return cropCanvas.toDataURL("image/png");
        }
    }

    static _autoCrop(context, boundaries = NilCube._findBoundaries(context)) {
        const cropContext = NilCube._createContext(boundaries.width, boundaries.height);
        cropContext.imageSmoothingQuality = 'low';
        cropContext.drawImage(context.canvas, -boundaries.xMin, -boundaries.yMin);
        return cropContext;
    }

    static _createContext(width, height) {
        return $("<canvas></canvas>").attr("width", width).attr("height", height || width)[0].getContext("2d");
    }

    static _findBoundaries(context) {
        const canvas = context.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const data = context.getImageData(0, 0, width, height).data;

        let xMin = width;
        let xMax = 0;
        let yMin = height;
        let yMax = 0;

        let x, y, i;

        for (i = 0, x = 0, y = 0; i < data.length; i += 4) {
            if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0 || data[i + 3] > 0) {
                x = (i >> 2) % width;
                y = Math.floor(i / (4 * width));
                xMin = Math.min(xMin, x);
                xMax = Math.max(xMax, x);
                yMin = Math.min(yMin, y);
                yMax = Math.max(yMax, y);
            }
        }
        const results = {xMin: xMin, xMax: xMax + 1, yMin: yMin, yMax: yMax + 1, width: xMax - xMin + 1, height: yMax - yMin + 1};
        console.log("bounds x:" + results.xMin + ":" + results.xMax + " y:" + results.yMin + ":" + results.yMax + " w:" + results.width + " h:" + results.height);
        return results;
    }

    // ["Y11:11,02,012","B","R00:22]
    u(elements) {
        const nc = this;
        const size = Math.round(nc._cubicleSize * (nc._type + 1 / 2));
        const context = NilCube._createContext(size, size);

        context.translate(Math.round(nc._cubicleSize / 4), Math.round(nc._cubicleSize / 4));

        // core
        context.fillStyle = nc._colorsMap.core;
        context.fillRect(nc._cubicleSize / 2, nc._cubicleSize / 2, (nc._cubicleSize + nc._cubiclePadding) * (nc._type - 1), (nc._cubicleSize + nc._cubiclePadding) * (nc._type - 1));

        elements = elements.slice(0, nc._type * nc._type);
        elements.forEach(function (element, index) {
            const mainSplit = element.split(":");

            const color = mainSplit[0][0];
            const options = mainSplit[1] || "";
            const midDeltaX = mainSplit[0][1] || 1;
            const midDeltaY = mainSplit[0][2] || 1;

            const col = index % nc._type;
            const row = Math.floor(index / nc._type);
            const size = nc._cubicleSize;

            const x = nc._origin + col * (nc._cubicleSize + nc._cubiclePadding);
            const y = nc._origin + row * (nc._cubicleSize + nc._cubiclePadding);

            const rMultiplier = 3;
            const r = [nc._radius, nc._radius, nc._radius, nc._radius];

            // corner cutting improvements
            if (col === 0 && row === 0) {
                // corners
                r[2] *= nc._type === 2 ? rMultiplier : 1;
            } else if (col === nc._type - 1 && row === 0) {
                r[3] *= nc._type === 2 ? rMultiplier : 1;
            } else if (col === 0 && row === nc._type - 1) {
                r[1] *= nc._type === 2 ? rMultiplier : 1;
            } else if (col === nc._type - 1 && row === nc._type - 1) {
                r[0] *= nc._type === 2 ? rMultiplier : 1;
                // edges
            } else if (row === 0) {
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
            } else {
                // middle
                r[0] *= rMultiplier;
                r[1] *= rMultiplier;
                r[2] *= rMultiplier;
                r[3] *= rMultiplier;
            }

            console.log("U" + row + col + " " + color + " o=(" + x.toFixed(2) + "," + y.toFixed(2) + ") r=(" + r[0].toFixed(2) + "," + r[1].toFixed(2) + "," + r[2].toFixed(2) + "," + r[3].toFixed(2) + ")");

            // cubicle
            context.fillStyle = nc._colorsMap[color];
            context.strokeStyle = nc._colorsMap.cube;
            context.lineWidth = nc._edgeWidth;
            NilCube._roundPoly(context, [[x, y, r[0]], [x + size, y, r[1]], [x + size, y + size, r[2]], [x, y + size, r[3]]]);
            context.stroke();
            context.fill();

            // TODO
            /*
            // arrows
            nc._context.lineWidth = nc._cubicleSize / 16;
            nc._context.fillStyle = "black";

            var midX = x + nc._cubicleSize / 2 + (midDeltaX - 1) * nc._cubicleSize / 4;
            var midY = y + nc._cubicleSize / 2 + (midDeltaY - 1) * nc._cubicleSize / 4;

            options.split(",").filter(function (element) {
                return element;
            }).forEach(function (element) {
                var split = element.split("");
                var sx = (split[0] - 1) * nc._cubicleSize / (split[2] || 2);
                var sy = (split[1] - 1) * nc._cubicleSize / (split[2] || 2);
                nc._context.moveTo(midX, midY);
                nc._context.lineTo(midX + sx, midY + sy);
                nc._context.stroke();
                // center dot
                nc._context.fillRect(midX - nc._cubicleSize / 64, midY - nc._cubicleSize / 64, nc._cubicleSize / 32, nc._cubicleSize / 32);
            });
            */
        });

        nc._walls.u = context;
        return context;
    }

    // https://stackoverflow.com/a/7838871
    static _roundRect(context, x, y, w, h, r) {
        context.beginPath();
        context.moveTo(x + r, y); // 0
        context.arcTo(x + w, y, x + w, y + h, r); // 1-2
        context.arcTo(x + w, y + h, x, y + h, r); // 2-3
        context.arcTo(x, y + h, x, y, r); // 3-0
        context.arcTo(x, y, x + w, y, r); // 0-1
        context.closePath();
    }

    // context, [[1,2,5],[2,3,6],[x,y,r]]
    static _roundPoly(context, points) {
        context.beginPath();
        context.moveTo(points[0][0] + points[0][2], points[0][1]);
        for (var i = 0, i1 = 1, i2 = 2; i < points.length; i++, i1 = (i1 + 1) % points.length, i2 = (i2 + 1) % points.length) {
            context.arcTo(points[i1][0], points[i1][1], points[i2][0], points[i2][1], points[i1][2]);
        }
        context.closePath();
    }

    // TODO
    /*
    // ["Y","B","G"]
    f:

    function(colorsArray) {
        var canvas = this._side(colorsArray);
        this._context.drawImage(canvas, this._origin - this._cubicleSize * 3 / 64, this._origin - this._cubicleSize / 8 + this._type * this._cubicleSize * 17 / 16 + this._cubicleSize * 9 / 64);
    }

,
    // ["Y","B","G"]
    b:

    function(colorsArray) {
        var canvas = this._rotate(this._side(colorsArray), 1);
        this._context.drawImage(canvas, this._origin - this._cubicleSize * 3 / 64, this._origin - canvas.height - this._cubicleSize * 5 / 64);
    }

,
    // ["Y","B","G"]
    r:

    function(colorsArray) {
        var canvas = this._rotate(this._side(colorsArray), -0.5);
        this._context.drawImage(canvas, this._origin - this._cubicleSize * 7 / 64 + this._cubicleSize / 8 + this._type * this._cubicleSize * 17 / 16, this._origin - canvas.height - this._cubicleSize / 8 + this._type * this._cubicleSize * 17 / 16 + this._cubicleSize * 7 / 64);
    }

,
    // ["Y","B","G"]
    l:

    function(colorsArray) {
        var canvas = this._rotate(this._side(colorsArray), 0.5);
        this._context.drawImage(canvas, this._origin - this._cubicleSize * 5 / 64 - canvas.width, this._origin - canvas.height - this._cubicleSize / 8 + this._type * this._cubicleSize * 17 / 16 + this._cubicleSize * 7 / 64);
    }

    */

    static _rotate(context, factor) {
        const canvas = context.canvas;
        const size = Math.max(canvas.width, canvas.height) + 32;
        const halfSize = Math.round(size / 2);
        const rotateContext = NilCube._createContext(size, size);

        rotateContext.translate(halfSize, halfSize);
        rotateContext.rotate(Math.PI * factor);
        rotateContext.translate(-halfSize, -halfSize);
        rotateContext.drawImage(canvas, 16, 16);

        return NilCube._autoCrop(rotateContext.canvas);
    }

    // TODO

    /*
,
    // ["Y","B","G"]
    _side:

    function(colorsArray) {
        var tga = 4.1;
        var nc = this;
        var canvas = $("<canvas></canvas>").attr("width", 2 * this._origin + this._type * (this._cubicleSize * 17 / 16)).attr("height", 2 * this._origin + this._cubicleSize)[0];
        var context = canvas.getContext("2d");

        context.lineWidth = nc._cubicleSize / 16;
        context.strokeStyle = nc.colorsMap.black;

        var totalHeight = 0;
        for (var i = 0; i < Math.min(colorsArray.length, this._type * this._type); i += nc._type) {
            context.fillStyle = nc.colorsMap[colorsArray[i]];
            var depth = Math.floor(i / nc._type);

            var edgeOffset = depth * this._cubicleSize / 13;

            var height = (this._cubicleSize - edgeOffset) / 4;
            var width = this._cubicleSize - edgeOffset;

            var top = (width * tga - height) / tga;

            var x = nc._cubicleSize / 8 + edgeOffset;
            var y = nc._cubicleSize / 8 + totalHeight;

            var r = nc._cubicleSize / 64;

            console.log("first" + depth + " " + colorsArray[i]);
            context.beginPath();
            context.moveTo(x + r, y);
            context.arcTo(x + width, y, x + width, y + height, r);
            context.arcTo(x + width, y + height, x + width - top, y + height, r);
            context.arcTo(x + width - top, y + height, x, y, r);
            context.arcTo(x, y, x + width, y, r);
            context.closePath();
            context.fill();
            context.stroke();

            for (var j = i + 1; j < i + nc._type - 1; j++) {
                context.fillStyle = nc.colorsMap[colorsArray[j]];
                console.log("mid" + depth + " " + colorsArray[j]);
                x = nc._cubicleSize / 8 + (j % nc._type) * (nc._cubicleSize * 17 / 16) + (nc._cubicleSize * 1 / 64);
                NilCube._roundRect(context, x, y, this._cubicleSize * 63 / 64, height, r);
                context.fill();
                context.stroke();
            }

            context.fillStyle = nc.colorsMap[colorsArray[i + nc._type - 1]];
            console.log("last" + depth + " " + colorsArray[i + nc._type - 1]);
            context.beginPath();
            x = nc._cubicleSize / 8 + (j % nc._type) * (nc._cubicleSize * 34 / 32) + (nc._cubicleSize * 1 / 64);
            context.moveTo(x + r, y);
            context.arcTo(x + width, y, x + top, y + height, r);
            context.arcTo(x + top, y + height, x, y + height, r);
            context.arcTo(x, y + height, x, y, r);
            context.arcTo(x, y, x + width, y, r);
            context.closePath();
            context.fill();
            context.stroke();

            totalHeight += height + nc._cubicleSize * 5 / 64;
        }

        return this._autoCrop(canvas, NilCube._findBoundaries(context));
    }
    
    */
}
