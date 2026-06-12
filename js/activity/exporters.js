// Copyright (c) 2014-22 Walter Bender
// Copyright (c) Yash Khandelwal, GSoC'15
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global DOMParser, XMLSerializer, SPECIALINPUTS, _, INLINECOLLAPSIBLES, EXPANDBUTTON, COLLAPSEBUTTON, TURTLESVG, FILLCOLORS, STROKECOLORS */
/* exported extractSVGInner, printBlockSVG, printBlockPNG */

window.extractSVGInner = svgString => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return "";

    // Remove drop shadow filters safely
    svgEl.querySelectorAll("[filter]").forEach(el => {
        el.removeAttribute("filter");
    });

    return svgEl.innerHTML;
};

window.printBlockSVG = activity => {
    activity.blocks.activeBlock = null;
    let startCounter = 0;
    const svgParts = [];
    let xMax = 0;
    let yMax = 0;
    let parts;
    for (let i = 0; i < activity.blocks.blockList.length; i++) {
        if (!activity.blocks.blockList[i] || activity.blocks.blockList[i].ignore()) {
            continue;
        }

        if (activity.blocks.blockList[i].container.x + activity.blocks.blockList[i].width > xMax) {
            xMax = activity.blocks.blockList[i].container.x + activity.blocks.blockList[i].width;
        }

        if (activity.blocks.blockList[i].container.y + activity.blocks.blockList[i].height > yMax) {
            yMax = activity.blocks.blockList[i].container.y + activity.blocks.blockList[i].height;
        }

        const rawSVG = activity.blocks.blockList[i].collapsed
            ? activity.blocks.blockCollapseArt[i]
            : activity.blocks.blockArt[i];

        if (!rawSVG) {
            continue;
        }

        if (activity.blocks.blockList[i].isCollapsible()) {
            svgParts.push("<g>");
        }

        svgParts.push(
            '<g transform="translate(' +
                activity.blocks.blockList[i].container.x +
                ", " +
                activity.blocks.blockList[i].container.y +
                ')">'
        );

        if (!SPECIALINPUTS.includes(activity.blocks.blockList[i].name)) {
            svgParts.push(window.extractSVGInner(rawSVG));
        } else {
            // Safer SVG manipulation using DOM instead of string splitting
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawSVG, "image/svg+xml");

            // remove dropshadow filter if present
            const filtered = doc.querySelector('[style*="filter:url(#dropshadow)"]');
            if (filtered) {
                filtered.style.filter = "";
            }

            // Find correct tspan to inject value (matches previous behaviour)
            let target = null;

            // 1) Prefer empty tspan (most block SVGs reserve this for value)
            target = Array.from(doc.querySelectorAll("text tspan")).find(
                t => !t.textContent || t.textContent.trim() === ""
            );

            // 2) Otherwise fallback to last tspan
            if (!target) {
                const tspans = doc.querySelectorAll("text tspan");
                if (tspans.length) target = tspans[tspans.length - 1];
            }

            // 3) Final fallback to text node
            if (!target) {
                target = doc.querySelector("text");
            }

            if (target) {
                const val = activity.blocks.blockList[i].value;
                target.textContent = typeof val === "string" ? _(val) : val;
            }

            // serialize without outer <svg> wrapper (matches previous behavior)
            let serialized = new XMLSerializer().serializeToString(doc.documentElement);

            // remove outer svg tags because original code skipped them
            serialized = serialized.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

            svgParts.push(serialized);
        }

        svgParts.push("</g>");

        if (activity.blocks.blockList[i].isCollapsible()) {
            let y;
            if (INLINECOLLAPSIBLES.includes(activity.blocks.blockList[i].name)) {
                y = activity.blocks.blockList[i].container.y + 4;
            } else {
                y = activity.blocks.blockList[i].container.y + 12;
            }

            svgParts.push(
                '<g transform="translate(' +
                    activity.blocks.blockList[i].container.x +
                    ", " +
                    y +
                    ') scale(0.5 0.5)">'
            );
            if (activity.blocks.blockList[i].collapsed) {
                parts = EXPANDBUTTON.split("><");
            } else {
                parts = COLLAPSEBUTTON.split("><");
            }

            for (let p = 2; p < parts.length - 1; p++) {
                svgParts.push("<" + parts[p] + ">");
            }

            svgParts.push("</g>");
        }

        if (activity.blocks.blockList[i].name === "start") {
            const x = activity.blocks.blockList[i].container.x + 110;
            const y = activity.blocks.blockList[i].container.y + 12;
            svgParts.push('<g transform="translate(' + x + ", " + y + ') scale(0.4 0.4)">');

            parts = TURTLESVG.replace(/fill_color/g, FILLCOLORS[startCounter])
                .replace(/stroke_color/g, STROKECOLORS[startCounter])
                .split("><");

            startCounter += 1;
            if (startCounter > 9) {
                startCounter = 0;
            }

            for (let p = 2; p < parts.length - 1; p++) {
                svgParts.push("<" + parts[p] + ">");
            }

            svgParts.push("</g>");
        }

        if (activity.blocks.blockList[i].isCollapsible()) {
            svgParts.push("</g>");
        }
    }

    svgParts.push("</svg>");

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        xMax +
        '" height="' +
        yMax +
        '">' +
        encodeURIComponent(svgParts.join(""))
    );
};

window.printBlockPNG = async activity => {
    const svgContent = window.printBlockSVG(activity);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(decodeURIComponent(svgContent), "image/svg+xml");
    const svgElement = svgDoc.documentElement;
    const width = parseInt(svgElement.getAttribute("width"), 10);
    const height = parseInt(svgElement.getAttribute("height"), 10);
    canvas.width = width;
    canvas.height = height;
    const img = new Image();
    const svgBlob = new Blob([decodeURIComponent(svgContent)], {
        type: "image/svg+xml;charset=utf-8"
    });
    const url = URL.createObjectURL(svgBlob);
    return new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const pngDataUrl = canvas.toDataURL("image/png");
            resolve(pngDataUrl);
        };
        img.onerror = err => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        extractSVGInner: window.extractSVGInner,
        printBlockSVG: window.printBlockSVG,
        printBlockPNG: window.printBlockPNG
    };
}
