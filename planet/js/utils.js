function toTitleCase(str) {
    if (typeof str !== "string") return;
    let tempStr = "";
    if (str.length > 1) tempStr = str.substring(1);
    return str.toUpperCase()[0] + tempStr;
}

module.exports = {
    toTitleCase,
};
