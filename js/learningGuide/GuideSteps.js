window.GuideSteps = [

{ id:"intro", text:"🎵 Welcome! Music Blocks lets you build songs using blocks. I'll guide you step by step.", action:null },

{ id:"canvas", text:"This white area is your workspace where music is built.", target:"#myCanvas", action:null },

{ id:"rhythm_open", text:"Open the Rhythm palette from the left.", palette:"rhythm", action:"palette" },

{ id:"note_drag", text:"Scroll inside Rhythm and drag a Note block onto the canvas.", block:"newnote", action:"block" },

{ id:"pitch_open", text:"Now open the Pitch palette.", palette:"pitch", action:"palette" },

{ id:"pitch_drag", text:"Drag a Pitch block inside your Note.", block:"pitch", action:"pitch_inside" },

{ id:"octave", text:"Change the octave number, Click on the pink number inside ANY pitch block. Change the octave value using the popup. When the number changes, this step will complete.. Higher = sharper sound.", action:"octave_change" },

{ id:"connect_start", text:"Drag a Note block and attach it to the Start block. You must make or change the connection to continue.", action:"connect" },

{ id:"play", text:"Press ▶️ Play to hear your music. Please let the song finish playing, or press ⏹️ Stop to continue.", action:"play" },

{ id:"melody", text:"Add 3 more Note blocks to extend your melody.", action:"melody" },

{ id:"tone", text:"Open Tone palette and wrap your notes with Set Instrument. Add a NEW Set Instrument block and choose a different instrument.", action:"tone_block" },

{ id:"flow", text:"Open Flow palette and add Repeat around your melody.", palette:"flow", action:"flow_block" },

{ id:"graphics", text:"Open Graphics palette and add Forward inside your first Note.", palette:"graphics", action:"graphics_block" },

{ id:"save", text:"Click the Save icon 💾 to store your project.", action:"save" },

{ id:"end", text:"🎉 You now understand Music Blocks: Notes, Pitch, Rhythm, Instruments, Loops & Graphics!", action:null }

];