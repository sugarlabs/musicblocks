// jest.setup.js
HTMLCanvasElement.prototype.getContext = () => {
    return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x, y, w, h) => ({ data: new Array(w * h * 4).fill(0) }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rotate: () => {},
        translate: () => {},
        scale: () => {},
        arc: () => {},
        fillText: () => {},
        strokeText: () => {},
        setLineDash: () => {},
        getLineDash: () => [],
        lineDashOffset: 0,
        strokeStyle: "",
        fillStyle: "",
        lineWidth: 0
    };
};
