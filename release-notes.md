:robot: I have created a release *beep* *boop*
---


<details><summary>3.9.0</summary>

## 3.9.0 (2026-10-30)

## What's Changed
* Handle denied microphone permission in Sampler widget by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6856
* feat: announce program run/stop state via aria-live region (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7675
* fix: guard against null popup window in PhraseMaker export by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7721
* fix: handle null turtle in EnsembleBlocks._blockFindTurtle by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7736
* docs: add missing help strings to setxyturtle and turtlenote blocks by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7801
* fix(graphics-blocks): bound-check Arc block's angle argument by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8230
* fix(intervals-actions): bound scalar interval value to prevent unbounded loop by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8248
* fix: modernize plugin management UI and resolve scoping issues by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8291
* fix: validate SkipNotesBlock.flow() inputs and prevent skipFactor cor& by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/8295
* fix: prevent unsettled promises on plugin script loading errors by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8337
* feat(musickeyboard): add Shift + Arrow key shortcuts for live octave navigation by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8375
* fix(rhythm): bound note counts by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8441
* fix(pitchstaircase): validate supported frequency bounds in _dissectStair by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8564
* fix(a11y): add missing accessible names for axe-flagged elements (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8662
* fix(musicutils): parse multi-digit and negative octaves by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8699
* fix: clean up circular canvas pointer event listeners in rhythm ruler by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/8724
* fix(intervals): correct unison and octave interval calculation (#8709) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/8710
* feat: improve theme switcher options UI by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8672
* fix(abc-parser): handle inline accidentals, key root accidentals, and mode mapping by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8734
* fix(aidebugger): preserve zero values in chat exports by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8738
* feat: add undo and redo shortcuts for deleting blocks by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7714
* fix: improve graphics window boundary contrast by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8741
* fix(mxml): normalize part and voice Ids during generation by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8426
* fix(synthutils): restore linting for the second half of the file by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8619
* fix(blockfactory): include the porch in the basicClamp cache key by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8618
* fix(mathutils): guard doPlus against null/undefined operands by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8743
* fix(musicutils): dedupe addTemperamentToList against TEMPERAMENTS by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8731
* fix(abc): write every staged notation marker as valid ABC by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8747
* feat(arpeggio): add keyboard shortcuts for playback toggle and octave navigation (#8644) by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8646
* fix(midi): import notes and tempo at the file's own speed by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8748
* fix(themebox): guard localStorage.getItem in setPreference() by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8736
* fix(reflection): guard AI widget async lifecycle against stale responses by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8593
* fix(blocks): let boolean docks bridge to anyin/anyout like every other type by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8464
* fix(logo): keep receivedArg across WaitFor/Until/While requeues by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8697
* fix(meter): clamp setbpm2 against computed tempo instead of raw bpm arg by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8750
* feat: announce widget open/close to screen readers via aria-live region (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7813
* chore: Temperement visualizer by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/8286
* feat(trash): add interactive lid open and delete glow affordance by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8745
* fix: add missing hidden block to note by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8759
* fix(blocks): guard the empty box slot in add and add-1-to by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/8766
* fix: prevent TypeError on detached blocks in NumberBlocks helpers by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8675
* fix: handle hertz pitches in MusicXML export by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8739
* fix(mxml): export every staged notation marker as valid MusicXML by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8682
* fix(lilypond): group guitar tablature by each turtle's own clef by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8756
* fix: normalize screenshot casing to lowercase by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8757
* fix(midi): import dotted notes and triplets at their own length by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8758
* fix: keep canvas buttons visible after fullscreen resize by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8762
* fix(jseditor): preserve hljs syntax coloring when marking errors by @Sahilbasu5101 in https://github.com/sugarlabs/musicblocks/pull/8740
* refactor: extract camera logic to camera-utils.js by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/8761
* fix: convert remaining execution engine timers to ManagedTimer by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8663
* fix(export): write a pitchless staged note as a rest by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/8768
* fix(widgets): improve widget reinitialization by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8726
* fix(turtle): remove a replaced gif's own _media record, not just its animator entry by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8771
* fix(pitch): clamp calcOctave's next branch to octave 9 by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8774
* fix: allow camera blocks to be moved to trash by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8775
* fix: scope tuplet state per turtle to prevent race condition (Fixes #8657) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/8664
* feat: add Tap Tempo button and rolling average calculation in tempo widget by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/8713
* fix(abc): write exported pitches against the key signature by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8778
* chore: add turtle blocks docs by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8769
* ci: skip the PR dashboard job on forks by @vyagh in https://github.com/sugarlabs/musicblocks/pull/8785
* fix(synth): delegate sampler tuner target frequency calculation to musicutils (#7044) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8634
* test(widgets): expand test suite for aidebugger to 100% line coverage by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8692
* test: add unit tests for circular canvas pointer cleanup in rhythm ruler by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/8753
* fix(legobricks): make the column-spacing + button step by 5px by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8779
* fix(sensors): modernize enter key detection and add null guards (#7021) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8486
* feat(storage): integrate SessionStorageManager for indexeddb backups and recovery by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7678
* fix(mxml): emit divisions per quarter note in measure attributes by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8680
* fix(munsell): let searchColors consider rgba-formatted candidates by @rajanpanth in https://github.com/sugarlabs/musicblocks/pull/8424
* fix(mxml): preserve drum notes in MusicXML export by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8711
* fix: route widget audio-scheduling timers through ManagedTimer by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8787
* fix: correct Turtle Blocks guide link by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8791
* test(e2e): test async stylesheet cascade across themes (#8725) by @dhruv-prajapati-23 in https://github.com/sugarlabs/musicblocks/pull/8728
* fix(mxml): preserve double accidental pitches in MusicXML export by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8688
* fix(logo): show the value of a clicked note counter instead of throwing by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8797
* feat: add Renovate bot for automated dependency management by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/8715
* fix(logo): set up the synth for a turtle added when start is trashed by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8798
* fix(legobricks): keep scanning lines when the grid is redrawn during playback by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8790
* fix(loader): include browser-utils in MYDEFINES and fix widgetWindows (#8727) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/8729
* fix(legobricks): merge a short trailing segment instead of dropping it by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8802
* Fix/sensors blocks keycode by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8807
* Fix/themebox innerhtml refactor by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8806
* fix: migrate keyCode to event.key in search UI (Related to #1234) by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8808
* fix: play temperament octave once during playback by @sahiljadhav7 in https://github.com/sugarlabs/musicblocks/pull/8799
* docs(piemenus): fix stray words in ten pie menu comments by @marekl11 in https://github.com/sugarlabs/musicblocks/pull/8830
* refactor: extract SampleLoader class from Synth by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8793
* fix(jseditor): fix off-by-one error and add bounds checking in debugg& by @Sahilbasu5101 in https://github.com/sugarlabs/musicblocks/pull/8803
* fix(jseditor): remove tooltip DOM elements on close to prevent memory& by @Sahilbasu5101 in https://github.com/sugarlabs/musicblocks/pull/8804
* fix: show widget maximize icon in high contrast by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8814
* fix(synth): strip accidental glyph before parsing sample center note by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8827
* fix: show New Project confirmation in High Contrast mode by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8829
* test(js-export): catch the three ast2blocks copies drifting apart by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8623
* chore: extract plugin and macro subsystems out of utils.js by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/8834
* refactor(midi): extract MidiTranscriber class for cleaner state encapsulation by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8833
* fix: disconnect synths from analysers before disposal in sampler onclose (Fixes #7976) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8812
* fix(rubrics): track articulation end correctly and add regression test by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8832
* fix: guard fnBrowserDetect in toolbar-ui updateRecordButton (Related & by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/8838
* fix(toolbar): prevent tooltips from overlapping dropdowns by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8841
* refactor(blocks): consolidate named block type checks using Set by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8821
* fix(docs): rename Dragon-Curve.tb so it does not clash with dragon-curve.tb by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/8843
* i18n: add Azerbaijani (az) locale by @jamalkamaladdin in https://github.com/sugarlabs/musicblocks/pull/8853
* fix: support Cmd+Z undo on macOS by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8851
* chore: remove debug console statements from turtle-singer.js by @ShivamGupta2003 in https://github.com/sugarlabs/musicblocks/pull/8822
* fix(drum): play the default drum when the drum slot is empty by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8857
* test: add turtle ownership contract coverage by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/8837
* fix: dismiss program stopped notification by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8794
* test: achieve 100% statement, function, and line coverage for aidebugger.js by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8720
* feat: export and import temperament/mode data as Scala (.scl) files by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/8650
* fix: show New Project confirmation in High Contrast mode (Related to & by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/8839
* feat(rhythmruler): add Space shortcut for playback toggle (#8754) by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8760
* docs: add five Reviewers to MAINTAINERS.md by @vyagh in https://github.com/sugarlabs/musicblocks/pull/8862
* chore: remove debug console statements from p5-adapter.js by @ShivamGupta2003 in https://github.com/sugarlabs/musicblocks/pull/8864
* refactor: replace deprecated event.keyCode in block label handling by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8868
* fix(blocks): register NOPTwoArgMathBlock under its own name by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8831
* refactor(ui): replace innerHTML with document.createElement in palette by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8866
* fix: migrate deprecated event.keyCode in rhythmruler.js by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8865
* fix: migrate deprecated event.keyCode in turtles.js, palette.js, context-menu-controller.js by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8863
* fix: align restore controls with toolbar tooltips by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8836
* refactor: extract AbcExporter class from processABCNotes by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8792
* chore(debug): remove leftover console.log debug statements by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8867
* perf: eliminate redundant RAF callback after clean render frames by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8655
* fix: route JS-export execution timers through ManagedTimer by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8845
* perf: migrate Sampler widget timer lifecycle to ManagedTimer by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8722
* fix(synth): guard against null paramsEffects when a filter is set by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8848
* fix: prevent duplicate octave playback in temperament widget (#8795) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/8805
* docs: correct turtle ownership documentation by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/8872
* fix(intervals): stop current interval throwing when clicked outside a note by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8874
* fix(blocks): fall back to default label on empty or invalid loadFile values by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8846
* fix: parse microtonal sample center notes by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8878
* fix(musicutils): remove dead-code duplicate PITCHES lookup in getNote by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8882
* fix: use textContent in _checkWidgets to fix localization bugs by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8885
* fix(phrasemaker): use OR instead of AND for graphics block detection & by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8881
* fix: make tempo widget detection localization-safe by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8883
* fix(ensemble): stop mouse blocks crashing when the name slot is empty by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8875
* fix(release): let release-please bump the VERSION constant it does not know about by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8870
* fix(a11y): stop table semantics from clashing with the palette category tablist roles (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8229
* fix: apply justifyContent to style object in widgetWindows by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8884
* fix(temperament): clear pitch-to-frequency cache when saving a custom temperament by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8752
* fix(tempo): skip missed beats instead of replaying them in a burst by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8810
* fix(blocks): separate runtime updates from undoable value edits by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8886
* perf: migrate TemperamentWidget timer lifecycle to ManagedTimer by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8721
* fix(project-manager): recover session load failures from any chunk by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8856
* fix(sampler): change generic fallback console.log to console.debug by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8891
* docs(readme): point CI badge at ci.yml by @rmz-oz in https://github.com/sugarlabs/musicblocks/pull/8892
* feat(search): keep the dropdown open when no blocks match by @Anusha0501 in https://github.com/sugarlabs/musicblocks/pull/8824
* fix(widgets): prevent per-frame canvas allocation in LegoWidget by @Sahilbasu5101 in https://github.com/sugarlabs/musicblocks/pull/8896
* fix(volume): init synthVolume before push for known voices by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8901
* fix(musickeyboard): play every note of a chord, not just the first four by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8902
* fix(synth): write the kick drum and the bass drum as bd in Lilypond by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/8903
* feat(widgets): add freeze to oscilloscope and fix flat line by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/8782
* fix(abc): correctly place slurs and ties by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8914
* refactor: extract MusicXMLExporter class to encapsulate export state by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8898
* refactor(palette): replace insertAdjacentHTML with document.createEle& by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8918
* fix(musicutils): return a drum's symbol for canonical-name matches by @shiaho777 in https://github.com/sugarlabs/musicblocks/pull/8904
* test(artwork): expand unit tests for palette color tables and SVG templates by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8920
* refactor: remove misleading innerHTML string from toolbar strings array by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8921
* refactor(musicutils): replace deprecated substr with slice by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8922
* fix: stage rest on drum line for noise in lilypond (Fixes #8912) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8925
* fix: prevent turtle from getting stuck enlarged on hover (#8924) by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8926
* fix(js-export): keep Repeat iteration count in for-loop conversion by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8913
* perf: migrate ModeWidget timer lifecycle to ManagedTimer by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8927
* refactor(musicutils): move pure-data constants into their own module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8934
* fix(keyboard): handle macOS undo redo and paste shortcuts by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8941
* feat(tuner): turn the needle green when pitch is in tune by @Anusha0501 in https://github.com/sugarlabs/musicblocks/pull/8938
* refactor(block): remove dead touch long-press listeners (Related to #8932) by @adrish-mage in https://github.com/sugarlabs/musicblocks/pull/8933
* chore: replace remaining substr usages by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8923
* refactor(musicutils): move chord, mode and default tables to constants by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8951
* perf: migrate LegoWidget timer lifecycle to ManagedTimer by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8947
* fix(tuner): improve accessibility of mode toggle buttons by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8890
* chore: reorder widget palette by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8955
* refactor(musicutils): move the translated tables to musicutils-i18n.js by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8956
* fix: preserve 21-EDO mode imports by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8942
* fix(temperament): fix unsafe splice operation in calculateRatios by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8888
* fix(abc): start every K: field on its own line by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/8961
* refactor(musicutils): move temperament state and code to their own module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8964
* fix(OrnamentActions): prevent staccato and slur listener name collision by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/8970
* fix(blocks): add the missing hidden block after a switch on load by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8963
* fix(actions): guard ToneActions against invalid inputs by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/8654
* fix: keep new project dialog visible on narrow screens by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8973
* fix(lilypond): make exported .ly files compile and stop dropping voices and spanners by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8971
* refactor(ui): extract the canvas-only clear confirmation by @Anusha0501 in https://github.com/sugarlabs/musicblocks/pull/8946
* fix(phrasemaker): keep note cells when matrix is block 0 by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/8975
* feat(git): integrate Git backend by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/7745
* fix(saveinterface): add alt attribute to project image for accessibility by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8958
* fix(jseditor): localize hardcoded strings by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8960
* fix(aidebugger): localize hardcoded strings in AI debugger UI by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8957
* refactor(musicutils): move pitch name, number and frequency helpers by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/8987
* fix(musicutils): normalize negative pitch index by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8916
* refactor(musicutils): move drum, voice and interval name lookups by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9000
* refactor(widgets): remove repeated docstring in LegoWidget by @Sahilbasu5101 in https://github.com/sugarlabs/musicblocks/pull/8936
* fix(lilypond): number drum staves by how many there are by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9001
* fix(rubrics): handle custom temperament lookup in getStatsFromNotation by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/8953
* fix(generate-tests): reject fs/child_process via jest.requireActual by @Himanshu2649 in https://github.com/sugarlabs/musicblocks/pull/8995
* fix(generate-tests): resolve module specifiers before trusting them by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/8989
* docs: add three more Reviewers by @vyagh in https://github.com/sugarlabs/musicblocks/pull/9007
* docs: fix typos and broken URL in README.md by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/9009
* fix: return 0 from getSynthVolume instead of undefined by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8993
* fix: report error instead of returning error string in getValue by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8990
* fix: guard against missing turtleDicts[turtle] in SerializeDict by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8991
* fix: report error when setting an unsupported key in SetDictValue by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/8992
* fix(js-export): export the Stop block with the block's own semantics by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8930
* chore(deps-dev): bump js-yaml from 3.14.2 to 3.15.2 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/8613
* fix(js-export): export Int as MathUtility.doInt to match the block by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8895
* fix(abc): give each turtle its own voice by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/8967
* fix: keep palette blocks reachable after browser resize by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9015
* fix: keep floating windows visible after browser resize by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9021
* refactor(musicutils): move fraction, duration and rhythm helpers by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9018
* fix: add type check for drum/voice lookups by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/9026
* fix: add string type check before slicing drum name by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/9025
* fix: scope harmonic notation staging to turtle by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/9024
* fix: return boolean false from isOpen when window is not open by @sreeram5555 in https://github.com/sugarlabs/musicblocks/pull/9023
* refactor(musicutils): move solfege name helpers to their own module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9030
* fix: align movable solfege in widgets and getSolfege (Related to #2050) by @sahiljadhav7 in https://github.com/sugarlabs/musicblocks/pull/9019
* test(musicutils): correct dotted note inputs and assertions in durationToNoteValue by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/8954
* test(basicblocks): expand unit tests for basicblocks.js by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8919
* refactor(musicutils): move mode pie-menu wheel helpers to their own m& by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9031
* fix(mathutils): use symmetric rounding in doInt for negative numbers by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9032
* fix(renovate): move schedule into packageRules to unblock dependency dashboard by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9033
* fix(MeterActions): guard setBPM against NaN, zero, and negative inputs by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9034
* fix(js-export): preserve strict equality semantics by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8950
* fix(arpeggio): reset arpeggio state between runs by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9036
* fix(dict): route turtle names back to the turtle dictionary by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8997
* fix(musickeyboard): guard against undefined block in _removePitchBlock by @ChirayuPoddar in https://github.com/sugarlabs/musicblocks/pull/9037
* docs: fix HTTPS links and update license header template version by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/9042
* fix(pitchdrummatrix): keep rows tied to blocks and fix playback state by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9041
* feat: add JSON and .scl export/import to the temperament widget by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/9029
* fix(js-export): export action names as valid identifiers by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/8979
* test(musicutils): add parseNoteString and stripMicrotonalPrefix test & by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9022
* refactor(musicutils): remove legacy string slicing from parseNoteString by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9045
* fix: preserve text selection in Music Keyboard by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9044
* fix(volume): pop synthVolume stack and restore audio volume on crescendo completion by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9017
* docs: clarify package-lock.json policy (from Discussion #2890) by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/9046
* fix: keep auxiliary menu open when opening plugin dialogs by @sanyamgarg023-dev in https://github.com/sugarlabs/musicblocks/pull/9047
* refactor(musicutils): move mode/chord core to its own module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9048
* fix(phrasemaker): prevent out-of-bounds tuplet rhythm access by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/8937
* fix: sync materialize thumb tooltip on undo in timbre by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/9057
* fix: don't count a replayed tied note twice by @aakarshitv in https://github.com/sugarlabs/musicblocks/pull/9061
* fix(musicutils): guard interval lookup functions against invalid inputs by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9065
* refactor: encapsulate Singer and Painter reset lifecycle in Turtle by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/9066
* docs: add comprehensive Security Policy (.github/SECURITY.md) by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9050
* fix: hide the trash when a block drag ends by @aakarshitv in https://github.com/sugarlabs/musicblocks/pull/9060
* docs: update temperament guide for canvas visualizer by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/9067
* ci(pages): publish master with a -dev+<sha> version by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9052
* fix: new turtles inherit current master volume in prepSynths() by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/9077
* fix(mxml): give unpitched notes a staff position by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9074
* fix(js-import): keep graphics, pen and semitone interval arguments when converting to blocks by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/8977
* fix(js-export): export the do block when it names its action with text by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/8981
* refactor(musicutils): move the pitch/scale cycle to its own module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9051
* fix(git): keep tutorial controls reachable in short viewports by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9063
* fix: reset master volume at the start of each run by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9082
* feat(practice): add a story-driven lesson plan framework by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/7587
* fix(a11y): resolve duplicate DOM ID and add accessible labels in MeterWidget by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/8949
* fix: improve temperament wheel readability and positioning by @WKr1shna in https://github.com/sugarlabs/musicblocks/pull/9081
* fix(widgets): close floating widgets properly when trashed by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9086
* fix(timbre): keep widget previews, Save, Undo and edits in sync with the blocks by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9059
* refactor(musicutils): move the pitch/scale layer above the cycle to its own module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9088
* refactor(musicutils): move getPitchInfo and step-size helpers to final module by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9090
* fix(tuningformats): ignore text after pitch value in .scl import by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8873
* perf: migrate Reflection widget timer lifecycle to ManagedTimer by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/9091
* docs(musicutils): add a file map for the split musicutils-*.js modules by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9092
* fix(planet): load the next page instead of repeating the first by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9071
* refactor(utils): extract generic pie-menu wheel mechanics from modewheel by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9099
* fix(git): save fresh projects before offline tracking by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9070
* fix: route block-level timers through ManagedTimer by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9069
* fix: restore per-drum Rhythm Maker play controls in advanced mode by @h55n in https://github.com/sugarlabs/musicblocks/pull/9097
* refactor(musickeyboard): move note editing to its own module by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9073
* fix: associate publish tags label with generated input by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9087
* test: extend AST pipeline demonstration beyond utils to midi/releaseconfig by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8763
* test: align MIDI duration expectations with dotted notes by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/9156
* test(cypress): add E2E suite for the Mode widget by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9162
* fix(drag): use textContent.trim() for widget title matching by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9103
* refactor(musickeyboard): move keyboard and note table drawing to its own module by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9105
* fix: preserve current project when importing file by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8965
* refactor(rhythmruler): split the Rhythm Maker into six modules by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9139
* feat: add /context command for contributor issue context by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/8999
* fix(project-manager): parse URL query params with URLSearchParams by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9131
* fix: harden audio engine against NaN and Infinity in volume/pitch act& by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9132
* fix: darken tour window title bar to meet AA contrast by @Mrun25 in https://github.com/sugarlabs/musicblocks/pull/9143
* fix: prevent XSS in showQuestNotice via programmatic DOM construction by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/9148
* docs: clarify local setup instructions by @flash-5151 in https://github.com/sugarlabs/musicblocks/pull/9117
* fix(phrasemaker): offer 50 instead of "5n0" in the pen row value menu by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9123
* ci: validate project link for first-time contributors by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9010
* chore: github doesn't like bold fixes#n by @vyagh in https://github.com/sugarlabs/musicblocks/pull/9233
* refactor(utils): make configureWheel's navAngle opt-in, migrate numberWheel by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9129
* fix: normalize custom timbre effect parameters by @WKr1shna in https://github.com/sugarlabs/musicblocks/pull/9056
* fix(js-export): export value blocks as mouse calls and import playNoise by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9165
* fix: keep practice panels readable across themes by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9175
* docs: add Reviewer for Release, Security & Infrastructure by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9176
* fix(logo): whitelist degrees and radians in safePluginExecute and thr& by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9128
* refactor(turtle-singer): drop dead duplicate-factor loops in widget rows by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/8469
* fix: keep toolbar tooltips paired with their controls by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/9184
* chore(widgets): list missing globals in four widget headers by @amanbn8 in https://github.com/sugarlabs/musicblocks/pull/9113
* chore: remove debug console statements from js/turtles.js by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9193
* fix(widgets): clean up resource leaks in legobricks, musickeyboard, phrasemaker by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/9101
* feat(toolbar): modernize navbar layout, grouping, and theming (Related to #9039) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9040
* fix(modals): prevent .modalBox overflow on narrow screens and add backdrop (Fixes #9146) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9147
* fix(midi): write setbpm3 blocks at mid-file tempo changes on import by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9198
* fix(mxml): write the key signature the project is in by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9111
* fix(block): use stable bound handler for pie-menu exit key listener by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9206
* fix: sanitize dynamic content in level menu and level rendering by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/9149
* fix(js-import): convert a pitch read from a box or computed, not just a note name by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/8983
* fix: handle numeric frequency and multi-digit octaves in pitch by @notstanzinn in https://github.com/sugarlabs/musicblocks/pull/9104
* fix(search): show block names, rank matches, keep rows tidy (#9216) by @akkki007 in https://github.com/sugarlabs/musicblocks/pull/9220
* fix(toolbar): move Save project as MIDI next to the other export formats by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9224
* fix: rollup button and close button visibility by @Shafiya07 in https://github.com/sugarlabs/musicblocks/pull/9225
* fix: keep entered values when resetting the meter widget by @adrish-mage in https://github.com/sugarlabs/musicblocks/pull/9235
* fix(block): open a real file picker from the open file block by @netram75 in https://github.com/sugarlabs/musicblocks/pull/9236
* fix(themes): ensure widget titlebar buttons visible in dark mode by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9189
* fix(arpeggio): restore outerDiv size when unmaximizing (Fixes #9202) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9203
* fix: keep practice panels within the viewport by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9179
* fix: clear widget overlays before opening Planet by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9170
* fix(blocks): keep the tempo when the meter beat value changes by @netram75 in https://github.com/sugarlabs/musicblocks/pull/9245
* refactor(utils): make configureWheel's animatetime opt-in too by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9159
* fix: resolve string-typed numbers in calcOctaveInterval by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9192
* fix: provide visible focus indicator on search input (Fixes #9151) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9153
* fix(planet): keep Publisher working when the tag manifest is offline by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9167
* test: cover GlobalPlanet sort selection by @Prithvi-gif in https://github.com/sugarlabs/musicblocks/pull/9218
* fix: preserve resize listeners after initialization by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9145
* fix(planet): paginate owned Planet projects across Load More windows by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9182
* fix(piemenus): persist manual accidentals across pie menu reopens by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9177
* fix(planet): drop synced offline drafts once the commit history is refreshed by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9078
* fix(planet): validate project cache against updatedAt (Fixes #9141) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9144
* fix: preserve offline error after batch download failure by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/9210
* fix(mxml): pick a grid that short notes land on by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9154
* fix: count beats and measures from the latest meter change by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9119
* fix(musicutils): map flat-signature modes to flat keys in modeMapper by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9252
* feat(mxml): extend key signature mode table with pentatonics, blues, and minor variants by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9160
* refactor(legobricks): split the LEGO Bricks widget into eight modules by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9254
* fix(piemenus): let a click on a pie menu's selected item pick it by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9134
* fix(mathutils): keep Random inside min and max for decimal bounds by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9215
* refactor(sampler): split the Sampler widget into eight modules by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9200
* fix: prevent pie menus from overlapping workspace UI by @WKr1shna in https://github.com/sugarlabs/musicblocks/pull/9110
* fix(pitchslider): prevent hijacking arrow keys when unfocused (Fixes #9247) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9248
* feat: notate forever loops as repeats in Lilypond export by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9201
* fix: make auxiliary menu button fully clickable by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9257
* fix(musicutils): use the right accidentals in keys like Bm and Fo major by @netram75 in https://github.com/sugarlabs/musicblocks/pull/9228
* fix(deps): pin compression, proxy-addr, source-map-js to patched versions by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/9275
* feat: add ARIA attributes to widget windows for accessibility by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7780
* fix: restore button row in new project dialog by @vyagh in https://github.com/sugarlabs/musicblocks/pull/9313
* fix(tutorial): scroll Git Tutorial on short viewports (Fixes #9058) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9120
* fix: align plugin dialog action buttons by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9250
* fix(block): defer unique action name validation until committing edit by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9289
* fix: clear media preview when undo restores empty value by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9084
* docs(testing): add regression testing example by @Prithvi-gif in https://github.com/sugarlabs/musicblocks/pull/9229
* fix: blocks disappearing when entering/exiting fullscreen by @Aman1919 in https://github.com/sugarlabs/musicblocks/pull/9237
* fix(modewidget): stop mode name from overwriting the window title by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9204
* fix(aiwidget): resolve InvalidAccessError when opening AI Music widget #6853 by @Bhavesh-More in https://github.com/sugarlabs/musicblocks/pull/9282
* feat: implement ClampBlock math function and UI block by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9089
* refactor: split TemperamentUI from temperament widget (#8815) by @dhruv-prajapati-23 in https://github.com/sugarlabs/musicblocks/pull/8818
* refactor(tuner): move the tuner out of synthutils into tuner.js by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9116
* refactor(turtleactions): harden math inputs against Infinity by repla& by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9277
* fix: improve responsive block positioning during workspace resize by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9284
* fix(piemenus): don't throw on Set Pitch Preview with an empty start block by @aakarshitv in https://github.com/sugarlabs/musicblocks/pull/9260
* fix(aiwidget): store the Groq API key per session, not in localStorage by @shiaho777 in https://github.com/sugarlabs/musicblocks/pull/9269
* fix(reflection): resolve the backend from the host instead of a fixed IP by @shiaho777 in https://github.com/sugarlabs/musicblocks/pull/9264
* fix(help): prevent hijacking arrow keys when unfocused (Fixes #9267) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9268
* fix(cypress): scope mode-widget tests to the wheel div, not the frame title by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9183
* perf: replace unoptimized for...in array loops with Object.keys/for loops by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/9213
* refactor(pitchstaircase): split the Pitch Staircase widget into six modules by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9288
* fix(export): prevent notation output leakage and stale export reuse by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9304
* feat(a11y): add screen reader accessibility for workspace blocks (Par& by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9212
* test: add comprehensive unit tests for dom-helpers.js (66 tests) by @tusharkumar-coder in https://github.com/sugarlabs/musicblocks/pull/9303
* fix: reject non-finite random solfege octaves by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9314
* fix: position search below auxiliary toolbar by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9273
* fix: keep secondary context menu open after long press by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9246
* fix(tempo): change only the tempo of the turtle in the Tempo block by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9320
* ci(auto-rebase): clarify fork PR skipping and maintainer edit scope by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9297
* test(js-export): add round-trip conformance test suite (#9217) by @uvv-01 in https://github.com/sugarlabs/musicblocks/pull/9310
* fix(musicutils): widen a major-based diminished interval by a whole step by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9291
* fix(logo): drop stale temperament when the project no longer sets one by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9283
* fix(tempo): open the Tempo widget at the evaluated BPM by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9295
* feat: notate forever loops as repeats in ABC and MusicXML by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9312
* fix(block): guard null block artwork during stop cleanup by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9208
* fix: restore search input focus indicator by @palakv07 in https://github.com/sugarlabs/musicblocks/pull/9152
* fix(practice): recover safely from corrupt progress storage (Fixes #9239) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9240
* fix(widgets): fix LEGO Bricks key mapping and key leak (Fixes #9241) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9242
* fix(utils): prevent prototype pollution in deepClone by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9255
* fix(planet): handle project fetch errors gracefully and support repo url param by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9319
* feat(mxml): add MusicXML import, part 1 of 4 -- pitch and duration by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9326
* fix(meterwidget): play the beats at the tempo of the turtle that ran it by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9322
* fix: custom pitch pie menu rotation by @vikash2006-dot in https://github.com/sugarlabs/musicblocks/pull/9274
* fix(blocks): keep merged do blocks on their own action by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9316
* test: check the search focus outline from the global rule by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9353
* test: add unit tests for StatusMatrix widget by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/8943
* fix(rhythmruler): honor tap mode in circular view by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9334
* fix(widgets): stop AI Music from leaving the sampler in capture mode by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9335
* fix(i18n): update i18next HTTP backend to 4.0.2 by @Prithvi-gif in https://github.com/sugarlabs/musicblocks/pull/9221
* fix(phrasemaker): draw graphics rows with the turtle that ran the block by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9331
* fix(synthutils): route set panning through the panner by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9301
* test(cypress): add Rhythm Ruler widget open/render/interact/close E2E suite by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9407
* refactor(tempo): split the Tempo widget into seven modules by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9311
* fix(heap): floor fractional index and handle -1 on empty heap by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9317
* test: exclude nested test files from coverage (Fixes #9107) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9114
* fix: stop the save as SVG block from crashing by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9328
* fix: use the block's file name when saving notation by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9351
* test(stryker): expand mutation testing coverage to mathutils.js by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/8852
* fix(logo): let note counters count without side effects by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9363
* fix(musickeyboard): make the (rest) key record a rest on click (#9355) by @akkki007 in https://github.com/sugarlabs/musicblocks/pull/9388
* fix: improve reflection widget chat contrast in dark and high-contrast modes by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9367
* feat(mxml): add MusicXML import, part 2 of 4 -- voices, key, tempo by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9358
* fix(midi): preserve note-off boundaries during polyphonic import by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/9366
* fix(utils): cap exponential backoff delay in retryWithBackoff (Fixes #9342) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9354
* fix(piemenu): keep pitch preview clear of the palette by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9361
* fix(save): guard zero duration and invalid bpm in MIDI export (Fixes #9261) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9262
* fix(blocks): stop trash eviction from breaking play and project loads by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9369
* docs(examples): correct doubled word in the record-player page by @marekl11 in https://github.com/sugarlabs/musicblocks/pull/9393
* refactor(pitchdrummatrix): split the Pitch-Drum Matrix into six modules by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9394
* fix(tuningformats): ignore .scl comment lines anywhere in the file by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9396
* fix(musickeyboard): use the tempo of the turtle that ran the block by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9338
* fix(abc): strip all octave marks and hold accidentals to the bar line by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9373
* fix(OrnamentActions): add NaN guards to Neighbor block inputs by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9276
* fix(musicutils): spell seven-note scales with one letter per degree by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9340
* fix(pen): stop set hue from hanging on -Infinity and huge negative va& by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9409
* fix(project-manager): restore keyboard input after project load by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9344
* fix: add .abc file format support to file chooser dialog by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9365
* fix(aidebugger): replace hardcoded inline colors with design system tokens by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9392
* test(oscilloscope): cover frozen waveform capture in _renderFrame by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9100
* test(cypress): add Phrase Maker widget open/render/interact/close E2E suite by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9411
* test(utils): add missing unit test coverage for edge cases in musicutils-modewheel (#9352) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9362
* ci: add coverage-delta workflow to block coverage regressions by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/8969
* test(search-controller): cover the search drag handle by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8586
* fix(blocks): wait for a project load to finish before saving by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9356
* refactor(timbre): split TimbreWidget into TimbreState, TimbrePanels, TimbreAudio, and TimbreBlocks by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9410
* fix: guard setMasterBPM against NaN, zero, and negative inputs by @notstanzinn in https://github.com/sugarlabs/musicblocks/pull/9348
* test(lilypond): take the staging slot numbers from logoconstants by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9421
* ci: give every workflow job a timeout and every workflow explicit permissions by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/8638
* fix(utils): prevent prototype pollution in prepareMacroExports and add macro-utils unit tests by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9180
* test(utils): add unit tests for normalizeNoteAccidentals (#6909) by @parvarh26 in https://github.com/sugarlabs/musicblocks/pull/9368
* fix(volume): keep the current instrument when setting a synth volume by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9415
* fix(mxml): preserve decimal integer accidentals by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9381
* feat: add a record notation block to record while playing by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9360
* fix(mxml): write the note type each note is written with by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9385
* fix(ui): use MBDialog instead of blocking alert() and prompt() by @shiaho777 in https://github.com/sugarlabs/musicblocks/pull/9265
* fix(widgets): support multi-step undo history in timbre widget by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9185
* fix(planet): stop refetching owned projects on every My Projects load by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9285
* fix(canvas): resize fullscreen and maximized canvas to viewport by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9186
* feat: add og and twitter card metadata by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8376
* fix(sampler): apply and save the cent adjustment of custom samples by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9417
* fix(rhythm): undo each nested multiply note value block by its own factor by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9432
* feat(mxml): add MusicXML import, part 3 of 4 -- repeats, ties, drums by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9419
* fix(turtle): unknown mouse handling in Turtle Index Heap by @feastyr69 in https://github.com/sugarlabs/musicblocks/pull/9429
* test: add unit tests for MeterWidget drum playback and block export by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/8944
* test(utils): cover processPluginData, the untested plugin-loading core by @rupeshkumar92a-arch in https://github.com/sugarlabs/musicblocks/pull/8455
* fix: prevent canvas reset during fullscreen resize by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9305
* fix(musicutils): fix the note value the rhythm widgets display by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9436
* fix(utils): round tiny values and drop the minus from zero in toFixed2 by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9350
* fix(statistics): count tuplets by tuplet factor and round Hz once by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9438
* fix(block): wait for async blockMoved before adjusting docks (#38) by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9444
* perf(ASTutils): replace JSON serialization clone with deepClone by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/9135
* fix(musicutils-pitch): include 'x' textual double-sharp in getNumber by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9448
* fix(graphics): match translucency and clear inside a note, bound headings by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9450
* fix(planet): filter projects using all selected tags (#9378) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9404
* fix: guard turtle container access in sendStackToTrash (Fixes #7906) by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/7907
* fix(autosave): keep the planet copy current so a crash keeps recent edits by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9441
* fix(js-export): negate until condition in do-while export and import by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/8850
* fix(js-export): stop default cases from falling through by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8974
* fix(macros): add the missing hidden block to the scalar transpose help by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9458
* fix(js-export): export if blocks nested in repeat loops (#8558) by @vikash2006-dot in https://github.com/sugarlabs/musicblocks/pull/9397
* fix(turtle-singer): decode arpeggio intervals in widget capture by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9391
* fix(activity): guard requestAnimationFrame in resize handler and test sandbox by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9460
* fix: keep forever with stop mouse unrolled in Lilypond by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9300
* fix(js-export): end the calling loop when an action has a Stop block by @h55n in https://github.com/sugarlabs/musicblocks/pull/9271
* fix(blocks): stop temperament block crashing when its pitch arg is gone by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9168
* fix(blocks): stop delete block and move block crashing on an empty slot by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8796
* fix(rhythm): count "every N beats" from the beats actually played by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9464
* fix(turtleactions): preserve multi-word modes in getCurrentMode by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9473
* docs: explain recording notation from a program in the guide by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9446
* feat(pitchstaircase): render equal width stairs with dynamic wave partitions (#1277) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9477
* feat: bring back the save as notation and artwork blocks by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9387
* fix(pitch): change octave at C in the nth modal pitch block by @shubhamrai9122-creator in https://github.com/sugarlabs/musicblocks/pull/9481
* fix(turtleactions): count scalar pitch steps from previous note by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9471
* fix(musicutils): normalize double accidentals without octave (#9430) by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9431
* fix(musicutils): temper the 1/4-comma meantone fifths by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9443
* fix(musicutils): find accidentals in non-EDO temperament tables by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9452
* fix(lilypond): write a tempo and a pickup Lilypond can read by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9486
* fix(musicutils): keep an off-scale note's spelling unless its enharmonic is in the scale by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9491
* fix: replay each repeated drum's own Rhythm Maker edits by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9492
* feat: keep Rhythm Ruler edits after a page reload by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9493
* refactor(timbre): use docById helper for wrapperFx lookups by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9455
* fix(pitch): give scalar change in pitch its own help text and example by @shubhamrai9122-creator in https://github.com/sugarlabs/musicblocks/pull/9479
* fix(singer): guard null parent and circular connections in hasSetTimbreInSetDrum (Fixes #9383) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9384
* fix(meter): guard setMeter, setPickup, and setMasterBPM against NaN inputs (Fixes #9298) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9299
* perf(pitchdrummatrix): precompute drum names in save and remove dead variables by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9499
* fix(abc): play imported repeats over their own bars only by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9500
* fix(musicutils): correct reverse scale degree accidentals by @uvv-01 in https://github.com/sugarlabs/musicblocks/pull/9371
* fix: unify Return key handling and remove unreachable dead code by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9390
* fix(themes): fix white-on-cyan text contrast (Fixes #9398) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9399
* docs: repair links to moved and missing documentation paths by @marekl11 in https://github.com/sugarlabs/musicblocks/pull/9511
* chore: remove debug console statements from phrasemaker.js by @thadidaniel-ctrl in https://github.com/sugarlabs/musicblocks/pull/9505
* fix(mxml-parser): play a tuplet at its time-modification ratio by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9503
* fix(turtleactions): pass resolved synth in setSynthVolume (Fixes #9514) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9515
* fix(phrasemaker): correct graphics lookup by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9510
* fix(mxml): write the mode a key is in, not just its signature by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9517
* fix(abc, lilypond): write a rest for a pitchless note in a tuplet by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9520
* fix(block): stop collapse crash when a note or interval slot is empty by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9523
* fix(search): add blocks when tapping results on touch screens by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9502
* fix(timbre): stop global is not defined error when the widget loads by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9525
* perf: remove fixed MIDI export delay (Related to #7049) by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/9529
* fix(planet): avoid false offline sync success toast by @whyankush07 in https://github.com/sugarlabs/musicblocks/pull/9470
* fix(planet): remove inline onclick in GlobalCard to prevent DOM XSS by @nicoleadam7890a-code in https://github.com/sugarlabs/musicblocks/pull/9596
* fix: close database after cache init failure by @whyankush07 in https://github.com/sugarlabs/musicblocks/pull/9406
* fix: distinguish missing Planet projects from offline errors by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9336
* feat(planet): add hover interaction to project cards by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9329
* fix: ignore non-finite values in setPanning (Fixes #9472) by @tushaar-05 in https://github.com/sugarlabs/musicblocks/pull/9474
* fix: preserve enclosing clamp suppressions in note counters by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/9528
* fix: theme Play-Only mode controls by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9433
* fix(themes): fix high-contrast tokens and invalid CSS (Fixes #9376) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9377
* fix(help): fall back to the English block image when a translation lacks one by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9513
* fix(mathutils): guard doPlus against null, undefined, and NaN numeric operands (Fixes #9530) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9531
* fix(musicutils): resolve 12-EDO enharmonic positions and pitch numbers by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9548
* fix(project): update project loading to preserve canvas by @feastyr69 in https://github.com/sugarlabs/musicblocks/pull/9549
* feat: keep Phrase Maker selected cells after a page reload by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9551
* fix(arpeggio): keep hover feedback on the grid cell by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9538
* fix(mode): cancel pending animations when clearing notes by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9540
* docs: add @Diwaspant132 as Reviewer for UI/UX & Accessibility by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9098
* fix(utils): prevent infinite loop in nearestBeat (Fixes #9534) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9535
* fix(meter): clear beat indicator when playback stops by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9559
* fix(selection): retain workspace offset when scrolling is disabled by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9560
* fix(modewidget): preserve accidental key signatures by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9583
* fix(help): normalize tour icon opacity and improve dark mode contrast (#9585) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9586
* fix(meter): validate master BPM values by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9584
* fix(mxml): keep the divisions grid bounded and stop _gcd recursing forever by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9489
* fix(widgets): make Share menu toggle on button click by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9496
* fix(selection): duplicate selected stacks regardless of creation order by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9527
* fix: improve icon visibility in dark mode by @Shafiya07 in https://github.com/sugarlabs/musicblocks/pull/9401
* fix: align Cartesian grid after resize by @Shafiya07 in https://github.com/sugarlabs/musicblocks/pull/9595
* fix(midi): write the tempo and time signature into saved MIDI files by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9594
* perf: avoid redundant updateCache on turtle rotation by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9611
* fix(help): make Load this block work for arpeggio, fraction, debugger and input value by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9552
* fix(temperament): validate edit-mode input and fold ratios by powerBase by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9420
* perf(blocks): batch highlight requests without dropping transitions by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/5802
* refactor(pitchdrummatrix): remove dead _scale and redundant assignment (#9457) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9459
* fix: sync widget window visibility so hidden PhraseMaker stops by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/9632
* fix: prevent crash when loading projects with invalid block connections by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9635
* fix(mxml-parser): read a whole-measure rest's length from <duration> by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9617
* fix(mxml-parser): read an additive <beats> as the sum of its parts by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9619
* fix(abc): write bar lines so the tune has measures by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9646
* fix(midi): keep imported tracks in time across long and tied notes by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9623
* fix(blocks): keep unknown blocks when saving and duplicating by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9660
* fix(help): add alt text to the block help image by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9532
* fix(dict): keep reserved names out of Dictionary palette blocks by @aakarshitv in https://github.com/sugarlabs/musicblocks/pull/9680
* fix(abc-parser): read the meters abcjs names instead of numbers by @iamtanishqjain in https://github.com/sugarlabs/musicblocks/pull/9690
* fix(tone): reject harmonic partials above 1222 by @aakarshitv in https://github.com/sugarlabs/musicblocks/pull/9426
* fix(ToneActions): give each Set Instrument block its own cleanup listener by @shubhamrai9122-creator in https://github.com/sugarlabs/musicblocks/pull/9688
* fix(lilypond): support octave 0 and fix low octave marks (Fixes #9698) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9699
* fix(utils): return empty string for undefined in fileExt and fileBasename (Fixes #9703) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9704
* fix(ornaments): reject negative Staccato and Slur values by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9678
* fix(flow): safely handle non-finite Repeat count (#9693) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9694
* fix: remove only the JS editor's own trashsignal listener by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/9712
* fix(save): keep duplicate notes whole when saving while they play by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9679
* test: improve Block coverage by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9700
* feat(musicutils): unify pitchToFrequency with dynamic powerBase by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9717
* fix(darkmode): remove conflicting white background on widget titlebar& by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9347
* fix(ci): update cypress-io action to v7 and bump follow-redirects override by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9742
* perf(platformstyle): replace JSON serialization with deepClone in theme initialization by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/9136
* fix(tuningformats): preserve numeric Scala descriptions by @Eshiv-Pandey in https://github.com/sugarlabs/musicblocks/pull/9723
* fix(blocks): give each nested clamp block its own end listener by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9725
* feat: add CC0 Sonic Pi drum samples (Related to #1473) by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9554
* refactor(palette): optimize showMenu DOM queries and element construction by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9655
* fix(meter): keep chosen strong beats on meter change (Fixes #9669) by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9670
* fix(phrasemaker): preserve distinct octaves when sorting by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9440
* fix: dismiss context wheel after long-press actions by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9543
* fix: parse negative octaves in GetNotesForInterval (Fixes #9681) by @ydvvdinesh in https://github.com/sugarlabs/musicblocks/pull/9682
* fix: keep $ in text intact when saving project as HTML by @Himanshu2649 in https://github.com/sugarlabs/musicblocks/pull/9140
* fix(planet): let search run again after a failed search by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9800
* fix(planet): ignore stale search responses by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9572
* fix(save): encode the SVG data URL so "#" doesn't cut off the file by @netram75 in https://github.com/sugarlabs/musicblocks/pull/9805
* fix(deps): move the body-parser override to 2.4.0 for GHSA-27r3-jxmh-p828 by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9797
* perf(tuner): avoid copying samples during pitch detection by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9721
* fix: resolve operator precedence in KeyboardController modifier check by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9195
* feat(server): allow overriding planet and project API keys via environment variables by @nicoleadam7890a-code in https://github.com/sugarlabs/musicblocks/pull/9659
* fix(practice-validator): align repeat count handling and bound sequence extraction (#9608) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9620
* fix(planet): translate the publish dialog title by @vedant21-oss in https://github.com/sugarlabs/musicblocks/pull/9666
* feat: connect the AI widgets to the Sugar Labs backend by @MostlyKIGuess in https://github.com/sugarlabs/musicblocks/pull/9802
* feat: proportional wheel slices for non-EDO temperaments by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/9332
* fix(meterwidget): hide orange beat indicator on playback stop by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9629
* fix(temperament): sync keyboard previews by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9707
* fix: enable workspace background context menu in beginner mode by @Himani78116 in https://github.com/sugarlabs/musicblocks/pull/9728
* fix(rhythm): restart the Skip notes count for each clamp by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9750
* fix(singer): shift interval and chord notes only once by @netram75 in https://github.com/sugarlabs/musicblocks/pull/9748
* fix(musicutils): fix scale degree undefined suffix (Fixes #9705) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9708
* refactor(graphics): centralize matrix row registration in Phrase Maker by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9577
* fix: reject invalid octave ratios by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9754
* fix(logo): prevent clamp signals double dispatch (Fixes #9756) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9757
* fix(intervals): clean up orphan pitches and restore state in measure interval by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9740
* perf: skip redundant cache redraws when hiding blocks by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/9598
* fix: release temporary Statistics charts by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/9672
* fix(rhythm): reject non-finite dot values by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9727
* fix(musicutils-pitch): support lowercase notes in getNumber (#9790) by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9791
* fix(pitchstaircase): guard save against empty stairs (Fixes #9782) by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9783
* fix(intervals): remove duplicate pitches before building modes by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9780
* fix(musicutils): give every note a solfege in the Pitch Converter by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9778
* fix: scope audio effect cleanup listeners by block id by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9787
* fix(project): refresh tab title after file import by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9718
* fix(musicutils): handle interval aliases like octave (Fixes #9603) by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9604
* fix: add measure bar line support to ABC export by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9631
* fix(planet): prevent stale workspace after project deletion by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9636
* fix: play numbers with accidentals as scale degrees by @abhiraj75 in https://github.com/sugarlabs/musicblocks/pull/9763
* fix(mxml-parser): import drum kits named by other programs as their own drums by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9644
* fix(blocks): resize two-arg blocks for compound inputs (Fixes #9563) by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9587
* fix(help): regenerate empty and cut-off translated help images by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9541
* fix(turtleactions): parse multi-digit and negative octaves in stepPitch by @ydvvdinesh in https://github.com/sugarlabs/musicblocks/pull/9545
* fix(git): retry with a short suffix when a repo name is taken by @vedant21-oss in https://github.com/sugarlabs/musicblocks/pull/9837
* refactor(synth): centralize instrument volume calibration by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9600
* fix(grid): keep staff accidentals aligned with menu by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9582
* fix(journal): reposition Explorer Journal dynamically on toolbar toggle (Fixes #9833) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9835
* fix: resolve lowercase double accidentals by @Shubham-Padkonde in https://github.com/sugarlabs/musicblocks/pull/9840
* fix: prevent overflow when accumulating MusicXML ties by @Shubham-Padkonde in https://github.com/sugarlabs/musicblocks/pull/9850
* fix: cap repeat expansion in practice lesson checks by @akshat-lakhera in https://github.com/sugarlabs/musicblocks/pull/9772
* feat(mxml): wire MusicXML import into the Load menu, part 4 of 4 by @dolliecoder in https://github.com/sugarlabs/musicblocks/pull/9434
* fix: preserve ABC header tempo and beat unit by @Shubham-Padkonde in https://github.com/sugarlabs/musicblocks/pull/9854
* fix(musicutils): keep the octave when B/C accidentals cross over by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/9766
* fix(timbre): preserve filter frequency when switching panels by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9653
* fix(abc): start each voice in its starting key, not the key it ends in by @vidhisingh24 in https://github.com/sugarlabs/musicblocks/pull/9845
* fix(planet): keep report target after viewer switch by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9570
* fix(planet): keep the open project when duplicating another one by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9838
* fix(planet): preserve projects during migration by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9573
* ci(release): keep the release body under GitHub's 125k limit by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9866
* fix(ensemble): rename only the selected mouse in legacy projects by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9870
* fix(musicutils): fall back to computed octave on NaN in calcOctave (Fixes #9576) by @tushaar-05 in https://github.com/sugarlabs/musicblocks/pull/9579
* fix(practice): award Key Namer only when two keys have their own names by @anshuman83-40 in https://github.com/sugarlabs/musicblocks/pull/9771
* fix(tuner): detect low notes and stop reading sharp (Fixes #9855) by @shubhamrai9122-creator in https://github.com/sugarlabs/musicblocks/pull/9856
* fix(musicutils): return null safely for empty and non-string input in getOscillatorTypes by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9881
* perf(utils): remove dead string and cache kana preference in _() by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9803
* fix(widgets): make AI widgets reliable after live testing by @MostlyKIGuess in https://github.com/sugarlabs/musicblocks/pull/9868
* fix: preserve nested volume clamp cleanup ownership by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/9710
* fix(painter): start a new path for each Bezier curve (Fixes #9873) by @netram75 in https://github.com/sugarlabs/musicblocks/pull/9875
* perf: throttle global mousemove and touchmove event listeners with requestAnimationFrame by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/9121
* fix(musicutils): resolve voice name by identifier in getVoiceName by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9753
* feat(chord-builder): add Chord Progression Builder widget and blocks by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9416
* fix: preserve arguments and FIFO queue in step debugger by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9812
* docs: correct keyboard shortcuts table (Related to #9722) by @ryaan2026 in https://github.com/sugarlabs/musicblocks/pull/9724
* fix(musicutils): resolve double accidentals in solfege pitches by @notstanzinn in https://github.com/sugarlabs/musicblocks/pull/9789
* ci: prevent stale PR timer resets by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9083
* fix: prevent invalid note values in getNotesPlayed by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9884
* refactor(singer): isolate note effect resolution from playback by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9874
* fix(widgets): keep maximized windows within responsive layout by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9729
* feat(ui/ux): improve sidebar navigation accessibility while scrolling on larger screens by @JawaharDinakaran in https://github.com/sugarlabs/musicblocks/pull/9685
* fix(musicutils): guard keySignature and mode utilities on non-string inputs by @ydvvdinesh in https://github.com/sugarlabs/musicblocks/pull/9902
* fix(meterblocks): report missing action name in diagnostics by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9903
* fix: make turtle blink cancellation effective by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9427
* fix: preserve ABC tuplet durations by @Shubham-Padkonde in https://github.com/sugarlabs/musicblocks/pull/9852
* fix(git): give non-latin project names their own repo name by @vedant21-oss in https://github.com/sugarlabs/musicblocks/pull/9668
* fix(planet): suggest tags in the publish dialog again by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9801
* fix(exporters): format negative octaves in ABC and LilyPond (Fixes #9815) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9816
* chore(deps): update overrides for security advisories and app-builder-lib by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/9885
* perf: optimize toFraction and rationalToFraction with continued fraction expansion by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9859
* fix(logo): initialize _MAX_ITERATIONS before _iterationBudget by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9904
* fix(singer): restore pen state after counting notes by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/9890
* fix(turtleactions): isolate nested pitch clamp listeners by @aarav-pathak in https://github.com/sugarlabs/musicblocks/pull/9894
* fix: reject unsupported input types in formatSeconds by @ptr25 in https://github.com/sugarlabs/musicblocks/pull/9814
* fix(painter): keep scroll xy inside the scroll buffer (Fixes #9910) by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9911
* fix(status): move Status Matrix data rows into tbody by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9871
* fix(phrasemaker): handle empty clamp in block mapping by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9906
* perf(musicutils): optimize numberToPitchSharp and frequencyToPitch in constant time by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9912
* fix(utils): prevent TypeError on nested missing properties in format by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9883
* feat(examples): add 19-EDO counterpoint and just polyrhythm projects by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9872
* fix: update video capture target on reuse by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9917
* perf: reuse ancestor roots when building the edge-scroll cache by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9893
* fix(status): document noteBeatValue duration fraction and fix test mocks (Related to #9886) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9889
* fix: route setSynthVolume preview to target turtle (Fixes #9683) by @ydvvdinesh in https://github.com/sugarlabs/musicblocks/pull/9684
* fix(blocks): keep merged event and beat blocks on their own action by @chiragmalik3553-tech in https://github.com/sugarlabs/musicblocks/pull/9751
* fix(mxml-parser): import a cue note as a rest by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9642
* test(meter): document default strong beats with on weak beat (#9806) by @Ashu-213 in https://github.com/sugarlabs/musicblocks/pull/9809
* fix: restore saved widget window position instead of centering by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/9738
* feat(docs): sync Guide theme with app theme by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/9860
* fix(intervals): read hertz and cents notes in interval blocks by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9734
* fix(midi): export notes with cents or set in hertz (Fixes #9817) by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9818
* feat(status): show the harmony sounding across mice by @riteshvish02 in https://github.com/sugarlabs/musicblocks/pull/9715
* fix(utils): handle non-finite inputs in mixedNumber() by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9925
* fix(sampler): accept common WAV media types by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9592
* fix(musicutils): guard filter and invert mode lookups (Fixes #9896) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9897
* fix(musicutils): spell pentatonic scales with their key's accidentals by @rupeshkumar92a-arch in https://github.com/sugarlabs/musicblocks/pull/9928
* fix(lilypond): parse signed octaves and select bass_8 for sub-bass notes by @ydvvdinesh in https://github.com/sugarlabs/musicblocks/pull/9923
* fix(musicutils): use the current custom mode pattern in getModePattern by @vedant21-oss in https://github.com/sugarlabs/musicblocks/pull/9648
* fix: halt flow execution on return and standardize calculate return by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/9888
* fix(modewidget): read an imported .scl mode on its own EDO, not the finest that fits by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9615
* fix(painter): keep wrapped forward moves linear and bounded by @aakarshitv in https://github.com/sugarlabs/musicblocks/pull/9862
* test(cypress): add E2E test suite for Timbre widget by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9622
* fix(help): restore tour icon visibility in dark mode by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9951
* perf(blocks): batch workspace display ordering by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9945
* docs(lilypond): fix the image paths in the LilyPond README (Fixes #9946) by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9947
* test: add unit test coverage for isClampBlock and logo critical gaps by @Sumit1080 in https://github.com/sugarlabs/musicblocks/pull/9938
* fix(chordbuilder): export empty beats as rests by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9949
* fix(generate-tests): escape Unicode line terminators in generated test comments by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9863
* fix(blocks): restore vertical centering for block labels on expanded & by @youngoat911 in https://github.com/sugarlabs/musicblocks/pull/9901
* fix(widgets): isolate each Music Keyboard block into its own widget instance by @Bhavesh-More in https://github.com/sugarlabs/musicblocks/pull/9522
* fix(blocks): fall back to default label on empty or invalid audiofile& by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9741
* fix(lilypond): leave out a slur or hairpin that covers a single note by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/9820
* fix: suspended audio context warning when playing a project by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9773
* fix(turtles): reindex companion references after removal by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9952
* fix(pitch): resolve double accidentals in solfege names by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/9779
* chore(deps): bump i18next-http-backend from 4.0.2 to 4.0.4 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/9919
* chore(deps-dev): bump systeminformation from 5.31.17 to 5.33.18 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/9920
* fix(mxml-parser): import a <forward> as a rest of its length by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9697
* fix(musicutils): resolve noise name by display name in getNoiseName by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9834
* fix: save all tempo rows before widget closes by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/9918
* fix(turtle): guard decorationBitmap in resizeDecoration (Fixes #9599) by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/9895
* fix(deps): get CI installing again and patch decode-uri-component by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9956
* fix(flow): return duplicate factor from DuplicateFactorBlock.arg() by @priyanshuuu777 in https://github.com/sugarlabs/musicblocks/pull/9935
* fix(musicutils): store the bebop scale's steps from the tonic up (Fixes #9959) by @shubhamrai9122-creator in https://github.com/sugarlabs/musicblocks/pull/9961
* fix(musickeyboard): keep pitch edits in sync with keys and recordings by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/9325
* fix(abc-parser): import every note of a chord by @Abhist17 in https://github.com/sugarlabs/musicblocks/pull/9799
* fix(widgets): enable Enter and Space activation on window controls by @Diwaspant132 in https://github.com/sugarlabs/musicblocks/pull/9960
* fix(arpeggio): parse negative and multi-digit octaves by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9966
* chore(project): remove stale matrixData export handling by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9963
* fix(toolbar): close help dropdown when selecting a menu option by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9954
* fix(musickeyboard): avoid empty actions at 50-note boundaries by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9968
* fix(meter-actions): handle companion turtle index zero by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9969
* fix(abc): play voices on one staff together by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9610
* fix(mxml): bound decimal tie accumulation by @jaydeep83721-dev in https://github.com/sugarlabs/musicblocks/pull/9898
* fix(pwa): register the service worker in production and load the page network-first by @kunalKumar-13 in https://github.com/sugarlabs/musicblocks/pull/9955
* fix(midi): keep overlapping notes in separate voices by @titanstride in https://github.com/sugarlabs/musicblocks/pull/9625
* fix(js-export): validate floor tom and bass drum by @codedbyanup in https://github.com/sugarlabs/musicblocks/pull/9972
* fix(recorder): recover from startup failures by @severe77 in https://github.com/sugarlabs/musicblocks/pull/9970
* fix(modewidget): enable keyboard activation for mode controls by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9974
* fix(volume): resolve typed synth display names in getSynthVolume by @Pyara-Singh in https://github.com/sugarlabs/musicblocks/pull/9547
* perf(mxml): cache instrument lookups when parsing unpitched notes by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/9973
* perf(logo): eliminate tail recursion and pool interpreter step queue items by @xtroon in https://github.com/sugarlabs/musicblocks/pull/9979
* fix(pitchstaircase): stop playback before removing stairs by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9984
* docs(lilypond): update the README for record notation and current installers (Fixes #9982) by @anugrah55 in https://github.com/sugarlabs/musicblocks/pull/9983
* test(cypress): add E2E test suite for Arpeggio widget by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/9588

## New Contributors
* @Eshiv-Pandey made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8734
* @sahiljadhav7 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8799
* @codedbyanup made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8838
* @jamalkamaladdin made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8853
* @rmz-oz made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8892
* @Anusha0501 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8824
* @shiaho777 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8904
* @adrish-mage made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8933
* @Sumit1080 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8654
* @chiragmalik3553-tech made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8975
* @Himanshu2649 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8995
* @ChirayuPoddar made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9037
* @Abhist17 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8979
* @sanyamgarg023-dev made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9047
* @aakarshitv made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9061
* @h55n made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9097
* @jaydeep83721-dev made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9087
* @Mrun25 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9143
* @flash-5151 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9117
* @amanbn8 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9113
* @abhiraj75 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9193
* @riteshvish02 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9206
* @notstanzinn made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9104
* @Shafiya07 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9225
* @Prithvi-gif made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9218
* @vidhisingh24 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9119
* @aarav-pathak made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9160
* @Bhavesh-More made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9282
* @Ashu-213 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9212
* @tusharkumar-coder made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9303
* @uvv-01 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9310
* @palakv07 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9152
* @vikash2006-dot made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9274
* @anugrah55 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9396
* @parvarh26 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9368
* @feastyr69 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9429
* @priyanshuuu777 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9391
* @shubhamrai9122-creator made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9481
* @thadidaniel-ctrl made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9505
* @titanstride made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9502
* @whyankush07 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9470
* @nicoleadam7890a-code made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9596
* @tushaar-05 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9474
* @ydvvdinesh made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9682
* @vedant21-oss made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9666
* @Shubham-Padkonde made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9840
* @akshat-lakhera made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9772
* @anshuman83-40 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9771
* @ryaan2026 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9724
* @JawaharDinakaran made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9685
* @ptr25 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9814
* @youngoat911 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9901
* @Pyara-Singh made their first contribution in https://github.com/sugarlabs/musicblocks/pull/9547

**Full Changelog**: https://github.com/sugarlabs/musicblocks/compare/v3.8.0...v3.9.0
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).