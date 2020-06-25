async function runScript() {
    console.clear();
    let mb = new MusicBlocks();

    // await mb.doForward(100);
    // await mb.doRight(90);
    // console.log("1st");
    // await mb.doForward(100);
    // await mb.doRight(90);
    // console.log("2nd");
    // await mb.doForward(100);
    // await mb.doRight(90);
    // console.log("3rd");
    // await mb.doForward(100);
    // await mb.doRight(90);
    // console.log("4th");

    await mb.goForward(100);
    await mb.goBackward(200);
    await mb.turnLeft(90);
    await mb.turnRight(90);
    await mb.setHeading(45);
    await mb.drawArc(45, 100);
    mb.setBezierControlPoint1(0, 0);
    mb.setBezierControlPoint2(100, 100);
    await mb.drawBezier(200, 200);
    await mb.scrollXY(100, 100);
    await mb.setXY(100, 100);
    console.log("X = " + mb.X);
    console.log("Y = " + mb.Y);
    console.log("HEADING = " + mb.HEADING);
    await mb.clear();

    for (let i = 0; i < 12; i++) {
        await mb.goForward(100);
        if (i < 6) {
            await mb.turnRight(60);
        } else {
            await mb.turnLeft(60);
        }
    }
}
