/**
 * @file This contains the starter code and API for the JavaScript Editor Widget.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
*/

const JS_API =
`/*
============================================================
       API
============================================================
   CREATE NEW MOUSE:
   -----------------
   new Mouse(async mouse => {
       await mouse.func(...);

       // also can be inside conditionals and loops
       // e.g.
       if (cond ..) {
           await mouse.func(...);
           ...
       } else {
           await mouse.func(...);
           ...
       }
   });

   CREATE NEW ACTION:
   ------------------
   let action_name = async mouse => {
       await mouse.func(...);
       ...
       return mouse.ENDFLOW;
   };

   CALL A CLAMP BLOCK FUNCTION:
   ----------------------------
   ...
   await mouse.func(async () => {
       await mouse.func(...);  // non clamp block function
       ...
       return mouse.ENDFLOW;
   });

   RUN ALL MICE:
   -------------
   MusicBlocks.run();


   FLOW BLOCK FUNCTIONS:
   ----------------------
   forward                     : goForward(steps)
   backward                    : goBackward(steps)
   right                       : turnRight(degrees)
   left                        : turnLeft(degrees)
   set x, y coordinates        : setXY(x_coord, y_coord)
   set mouse head angle        : setHeading(degrees)
   draw pivoted arc            : drawArc(degrees, radius)
   draw bezier curve           : drawBezier(dest_x, dest_y)
   set bezier control point 1  : setBezierControlPoint1(x_coord, y_coord)
   set bezier control point 2  : setBezierControlPoint2(x_coord, y_coord)
   clear screen                : clear()
   scroll canvas to x, y       : scrollXY(x_coord, y_coord)
   set pen color               : setColor(hue_value_in_0_to_100)
   set pen saturation          : setGrey(value_in_0_to_100)
   set pen lightness           : setShade(value_in_0_to_100)
   set pen hue                 : setHue(value_in_0_to_100)
   set pen opacity             : setTranslucency(value_in_0_to_100)
   set pen thickness           : setPensize(value_in_0_to_100)
   pen up                      : penUp()
   pen down                    : penDown()
   fill background             : fillBackground()
   set font name               : setFont(fontname)

   VALUE BLOCK GETTERS:
   --------------------
   mouse X coordinate          : X
   mouse Y coordinate          : Y
   mouse head angle            : HEADING
   pen size                    : PENSIZE
   pen color                   : COLOR
   pen lightness               : SHADE
   pen saturation              : GREY

   CLAMP BLOCK FUNCTIONS:
   ----------------------
   draw filled polygon         : fillShape(async () => {...})
   draw hollow lines           : hollowLine(async () => {...})
*/`;

const JS_STARTER =
`let rightSqr = async mouse => {
    await mouse.hollowLine(async () => {
        for (let i = 0; i < 4; i++) {
            await mouse.goForward(100);
            await mouse.turnRight(90);
        }
        return mouse.ENDFLOW;
    });
    return mouse.ENDFLOW;
};

let leftSqr = async mouse => {
    await mouse.hollowLine(async () => {
        for (let i = 0; i < 4; i++) {
            await mouse.goForward(100);
            await mouse.turnLeft(90);
        }
        return mouse.ENDFLOW;
    });
    return mouse.ENDFLOW;
};

new Mouse(async mouse => {
    for (let i = 0; i < 12; i++) {
        await mouse.goForward(100);
        if (i < 6) {
            await mouse.turnRight(60);
        } else {
            await mouse.turnLeft(60);
        }
    }
    await mouse.clear();
    await rightSqr(mouse);
});

new Mouse(async mouse => {
    for (let i = 0; i < 12; i++) {
        await mouse.goForward(150);
        if (i < 6) {
            await mouse.turnLeft(60);
        } else {
            await mouse.turnRight(60);
        }
    }
    await mouse.clear();
    await leftSqr(mouse);
});

MusicBlocks.run();
`;

const SAMPLE_1 =
`new Mouse(async mouse => {
    await mouse.playPitch("sol", 4);
    for (let i = 0; i < 7; i++) {
        await mouse.playNote(1/4, async () => {
            await mouse.stepPitch(1);
            return mouse.ENDFLOW;
        });
    }
    for (let i = 0; i < 7; i++) {
        await mouse.playNote(1/4, async () => {
            await mouse.stepPitch(-1);
            return mouse.ENDFLOW;
        });
    }
    return mouse.ENDMOUSE;
});

MusicBlocks.run();
`;

const SAMPLE_2 =
`new Mouse(async mouse => {
    await mouse.playNote(1/4, async () => {
        await mouse.playPitch("sol", 4);
        await mouse.playPitch("do", 4);
        return mouse.ENDFLOW;
    });
    await mouse.playNote(1/1, async () => {
        await mouse.playPitch("re", 4);
        return mouse.ENDFLOW;
    });
    await mouse.playNote(1/4, async () => {
        await mouse.playPitch("mi", 4);
        return mouse.ENDFLOW;
    });
    await mouse.playNote(1/4, async () => {
        await mouse.playPitch("fa", 4);
        await mouse.playNote(1/2, async () => {
            await mouse.playPitch("mi", 4);
            return mouse.ENDFLOW;
        });
        return mouse.ENDFLOW;
    });
    return mouse.ENDMOUSE;
});

new Mouse(async mouse => {
    await mouse.playPitch("re", 5);
    return mouse.ENDMOUSE;
});

MusicBlocks.run();
`;
