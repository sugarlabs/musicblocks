:robot: I have created a release *beep* *boop*
---


<details><summary>3.8.0</summary>

## 3.8.0 (2026-08-30)

## What's Changed
* test-suite: renamed actions for clarity by @walterbender in https://github.com/sugarlabs/musicblocks/pull/5747
* test: add unit tests for statistics.js (Resubmission) by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/4972
* Fix unresponsive buttons in pie menus by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5354
* fix(sw): tighten service-worker caching; precache activities.css by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/5744
* fix: Add input validation to BPMFactorBlock setter to prevent crashes by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/5740
* fix: prevent zombie audio by tracking and stopping active voices on halt by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/5742
* Harden JS editor console rendering and modernize Lilypond clipboard copy by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/5731
* chore: remove debug console statements from jseditor widget by @abhnish in https://github.com/sugarlabs/musicblocks/pull/5567
* feat(logic): complete dynamic MakeBlock types for tempo, volume, and instrument by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5721
* refactor(phrasemaker): extract pure utilities into PhraseMakerUtils module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5735
* chore: remove debug console statements from js/EnsembleBlocks.js by @subhraneel2005 in https://github.com/sugarlabs/musicblocks/pull/5748
* added the unit tests for timbre widget by @lakshay776 in https://github.com/sugarlabs/musicblocks/pull/5712
* added the unit test for phasemaker by @lakshay776 in https://github.com/sugarlabs/musicblocks/pull/5709
* test: add extended unit tests for Turtle-Singer class by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5710
* test: add extended unit tests for turtle-painter by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5703
* test: add extended unit tests for Trash class by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5702
* Add unit tests for pitchstaircase widget (#5135) by @lakshay776 in https://github.com/sugarlabs/musicblocks/pull/5705
* Add unit tests for pitchdrummatrix widget (#5135) by @lakshay776 in https://github.com/sugarlabs/musicblocks/pull/5700
* test: add extended unit tests for Boundary class by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5699
* test: add extended unit tests for Turtles class by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5697
* Add unit tests for arpeggio widget (#5135) by @lakshay776 in https://github.com/sugarlabs/musicblocks/pull/5698
* Test: Boost generate.js coverage to ~100% with complex stack scenarios by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/5589
* Fix Turtles Regression and Restore Failing Tests by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5760
* fix: Prevent stop icon listener accumulation in play debounce logic by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5754
* Fix Record canvas only, not entire screen by @Laxmi01345 in https://github.com/sugarlabs/musicblocks/pull/4873
* Phase 2: Extract Grid Logic into PhraseMakerGrid Module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5736
* Extract UI Logic into PhraseMakerUI Module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5737
* test: add extended unit tests for NOTESFLAT and NOTESSHARP by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5684
* test: add unit test coverage for background logic by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5690
* Fix: preserve event listeners when toggling cents slider by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/5569
* Fix infinite loop protection in phrasemaker.js by @Pankajyadav919 in https://github.com/sugarlabs/musicblocks/pull/5728
* revert fa7478914da442e43204ef44972a585e02820266 by @walterbender in https://github.com/sugarlabs/musicblocks/pull/5776
* Fix: npm dev/prod environment handling by @farhan-momin in https://github.com/sugarlabs/musicblocks/pull/5696
* chore(deps): bump tar and electron-builder by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/5777
* Revert "chore(deps): bump tar and electron-builder" by @omsuneri in https://github.com/sugarlabs/musicblocks/pull/5792
* Improve macros.js test coverage and fixed module export in macros.js by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5784
* test: add unit tests for PhraseMakerGrid widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5805
* test: add unit tests for PhraseMakerUtils widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5804
* test: add unit tests for PhraseMakerUI widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5815
* Minimal fix: remove leftover debug logging from plugin evaluation by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5821
* chore(deps-dev): bump systeminformation from 5.30.7 to 5.31.1 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/5818
* test: add unit tests for widgetWindows widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5816
* chore: replace var with const/let across codebase by @vyagh in https://github.com/sugarlabs/musicblocks/pull/5717
* fix(toolbar): sync horizontal scroll icon state on mode switch by @SaaiAravindhRaja in https://github.com/sugarlabs/musicblocks/pull/5173
* refactor(SaveInterface): extract duplicated strings to constants by @WillyEverGreen in https://github.com/sugarlabs/musicblocks/pull/5190
* Expand unit test coverage for logo.js by @severe77 in https://github.com/sugarlabs/musicblocks/pull/5849
* docs: Add AI guidelines section and minor changes by @farhan-momin in https://github.com/sugarlabs/musicblocks/pull/5852
* Fixed Help Tutorial Scrollbar Placement by @rashi-cse in https://github.com/sugarlabs/musicblocks/pull/5850
* test: add unit tests for JSEditor widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5840
* test: add unit tests for HelpWidget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5836
* test: add unit tests for Oscilloscope widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5835
* test: improve Tempo widget test coverage and fix JSDOM mocks by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/5823
* feat(accessibility): enable keyboard navigation for toolbar controls by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5819
* test: improve JSGenerate coverage for error handling and tree printing by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5688
* Chore/production build optimization by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5532
* Improve test coverage for utils.js (7% ’ 33%) by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5860
* Enable automatic page reload on language selection by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/5862
* Fix: JSInterface Global Exposure (Fixes #5671) by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5674
* Logo Subsystem  Global State Reduction Refactor by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5593
* Add extended unit tests for MusicBlocks.run behavior by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5539
* Improve palette.js test coverage by @severe77 in https://github.com/sugarlabs/musicblocks/pull/5565
* docs: Enhance documentation for pie menu functions in piemenus.js by @Siddharth-732 in https://github.com/sugarlabs/musicblocks/pull/5628
* fix(search): clicking search result text now creates block (not just icon) by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/5764
* Fix staccato/slur listener name collision on nested blocks by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5771
* Performance Improvement: Oscilloscope Throttling by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5741
* refactor(phrasemaker): extract audio playback logic into PhraseMakerAudio module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5738
* Resolve Remaining +/- Issues in PieMenuNumber Blocks by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5758
* added the block highlight minimum time threshold by @lakshay776 in https://github.com/sugarlabs/musicblocks/pull/5726
* Fix: remove black empty space in fullscreen mode (#5774) by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/5775
* test: fix broken tests after deps refactor and logoconstants update by @vyagh in https://github.com/sugarlabs/musicblocks/pull/5877
* Add unit tests for temperament.js to improve coverage by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5894
* Fix: remove debug console.log statements from reflection widget by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5885
* fixed auto relaod on same language by @vara-prasad-07 in https://github.com/sugarlabs/musicblocks/pull/5881
* Improve test coverage for resolveObject and delayExecution by @Thesmoothengineer in https://github.com/sugarlabs/musicblocks/pull/5895
* test: add unit tests for Reflection widget by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5876
* Add IndexedDB integration tests for Planet CacheManager.js by @farhan-momin in https://github.com/sugarlabs/musicblocks/pull/5906
* Test Suite: Add unit tests for Turtle class (part of #5607) by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5907
* fix: update status window colors in dark mode by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5773
* Fix missing inCrescendo.pop() in crescendo end listener by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5767
* Test/add aidebugger tests by @kh-ub-ayb in https://github.com/sugarlabs/musicblocks/pull/5939
* De-globalize Activity access: introduce `ActivityContext`, remove `synthutils` `window.activity` stub, keep temporary bridge by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/5936
* Save ~70-120 MB  lazy-cache grid bitmaps & shrink scroll canvas by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5929
* Test Suite: Add unit tests for turtledefs Music Blocks mode by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6004
* Test Suite: Add unit tests for JSInterface validateArgs by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6001
* Test Suite: Add unit tests for p5-sound-adapter by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5977
* Add regression tests for core lifecycle and pitch execution in turtle-singer by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/5981
* Test Suite: Add unit tests for IntervalsBlocks by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6021
* Test: Improve boundary.js coverage  image onload callback by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6043
* Architecture Hardening - Remove `window.activity`, Enforce `ActivityContext`, Add Safety Guards by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/6049
* ci: add PR category enforcement with auto-labeling by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6062
* fix: resolve all 17 npm dependency vulnerabilities + fix statistics test by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/6106
* Add comprehensive tests for LanguageBox (88.23% coverage) by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/6119
* docs: expand AI/LLM contribution guidelines and clarify PR workflow by @thevanshit in https://github.com/sugarlabs/musicblocks/pull/5866
* Fix stale delayTimeout execution after Stop by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5827
* Fix duplicate listener name collision between DuplicateBlock and Arpe& by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5806
* Fix canplay listener and interval accumulation in doUseCamera() by @severe77 in https://github.com/sugarlabs/musicblocks/pull/5837
* Replace blocking prompt() with themed MBDialog helper by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5844
* Save 50115 MB  dispose leaked Tone.js synths & reset audio buffers by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5928
* Fix maximize handler affecting only last status header column by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/5796
* Fix: Add null/undefined checks for status matrix parent block access by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/5813
* perf(blocks): remove redundant indexOf in noteValueNumber by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6057
* perf(activity): avoid O(n^2) index lookups in prepareExport by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6054
* Fix undefined pause() call in updateBounds by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/6040
* fix: add async yield mechanism to prevent infinite recursion from freezing UI by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/6086
* Fix: ESLint workflow and add pre-commit hooks by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/6159
* fix: replace pause() with delayExecution() in updateBounds (#6038) by @piyushdotcomm in https://github.com/sugarlabs/musicblocks/pull/6166
* Fix toolbar button misalignment after theme change by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/6018
* optimize block drag interactions by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5801
* fix(GraphicsBlocks.test): Add blockList to activity.blocks mock by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/6211
* test: refactor Cypress E2E tests  remove hard waits, fix loading strategy, improve reliability by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6138
* test: add regression tests for turtle-singer note execution and counting behavior by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/6128
* Perf: Optimize event listeners, cloning operations, and trash view rendering by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6121
* perf(phrasemakergrid): optimize syncMarkedBlocks lookup and dedupe by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6125
* fix(eslint): simplify config and restore safety rules by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/6210
* CI: enable npm caching and use npm ci in Jest workflow by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/6202
* fix - Stop execution on missing input in SetPitchNumberOffsetBlock by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/4819
* feat(accessibility): Introduce high contrast mode theme for enhanced readability, navigation and overall accessibility by @Nikhita-14 in https://github.com/sugarlabs/musicblocks/pull/5507
* Fix missing state resets in initTurtle for ratio transposition and in& by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5756
* test(musicutils): improve branch coverage for interval, octave, and note utilities by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/5757
* refactor: improve code quality and robustness by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5643
* Fix/amd singer and constants only by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5656
* Implement mode-aware movable-do solfege (fix fixed-do behaviour) by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/5794
* feat(a11y): Implement Keyboard Accessibility for Palette Navigation (Phase 2) by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5347
* Stabilize and Optimize Horizontal Scrolling Behavior by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5510
* Unify Enter Key Playback Logic and Fix Audio Overlap by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5513
* JS Editor: add missing block coverage (codegen + runtime + JS’Blocks) by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5834
* feat(widget): add keyboard shortcuts for WidgetWindow by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5766
* Chore/implement pitch helpers by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5869
* perf: stabilize audio engine for infinite-loop playback by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/5902
* Fix zero-step SVG arc rendering for thin strokes in turtle-painter by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/5901
* Fix: prevent resize listener accumulation in makeBackground by @severe77 in https://github.com/sugarlabs/musicblocks/pull/5824
* perf: Reduce TBT/CLS + improve a11y via layout fixes, chunked render, passive listeners, alt text by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/5915
* fix: only pop instrumentNames if setTimbre pushed it by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5932
* fix: correct blockList reference in setMasterVolume by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5924
* Add .dockerignore to reduce Docker image size by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/6079
* Fix: Enforce meaningful npm security audit in CI workflow by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/5920
* Phase 1: Add Runtime Performance Instrumentation (Execution Time, Memory Delta, Depth Tracking) by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5959
* Fix unsafe global DOM queries and listener binding in sampler tuner by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5963
* Handle service worker fetch failures to prevent unhandled promise rej& by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5965
* Remove debug console logs and improve error logging hygiene by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5969
* Limit Lilypond Hertz export precision to 2 decimal places by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/5973
* Refactor: centralize wheelDivptm styling in PhraseMaker by @severe77 in https://github.com/sugarlabs/musicblocks/pull/5983
* perf/Fix duplicate initialization and remove artificial 5s startup delay by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5961
* Fix: Logic error in SVG.setClampSlots auto-expansion guard by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6136
* fix: prevent stored XSS in runtime message rendering by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6003
* fix: scope articulation volume pop to synths present at push time by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5984
* fix: remove redundant widget object allocations in WidgetBlocks.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6006
* fix/pitch preview not playing after first trigger due to trigger lock by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6110
* perf: Fix idle watcher listener/interval accumulation on Activity re-initialization. by @yogibytes in https://github.com/sugarlabs/musicblocks/pull/6142
* fix(tests): resolve failing tests in GraphicsBlocks.test.js by adding blockList to mock by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/6167
* Save ~25-50 MB  defer p5/Chart loading & fix DOM listener leaks by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5930
* Improves the `PR Category Check` workflow by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/6250
* Fix failing Jest tests and ESLint errors by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/6251
* fix: prevent event listener accumulation in RecordDropdownArrow by @yogibytes in https://github.com/sugarlabs/musicblocks/pull/6141
* feat: add HyperScore-Tonal example to examples/ (#3940) by @piyushdotcomm in https://github.com/sugarlabs/musicblocks/pull/6170
* fix(aidebugger): prevent concurrent sendMessage from leaking intervals by @piyushdotcomm in https://github.com/sugarlabs/musicblocks/pull/6201
* perf(activity): manage render loop lifecycle and cancel RAF on teardown by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6135
* fix(musickeyboard): cleanup metronome on widget close by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/5856
* fix(widgets): use callback form of setTimeout in PhraseMaker and Timbre by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6134
* Fixes a startup load-order bug where constraints.js could execute before interface.js and throw by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/5833
* Batch canvas rendering using stageDirty flag to reduce redundant stage.update() calls by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5807
* Optimize SVG block caching and remove expensive deep cloning by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5904
* Palette: replace eval-based icon lookup with explicit mapping by @Kunal241207 in https://github.com/sugarlabs/musicblocks/pull/5759
* Replace O(N) blockList based lookups with O(1) blockIndex property by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5798
* Fix: Commented release tag code by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/6270
* Fixed current failing test in turtle-singer and palette test files  by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6263
* Fix Jest test failures and resolve ESLint linting errors by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/6264
* Fixed failed test case scenario in Mathutils.js by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6229
* Fix undefined DivByZeroError and standardise error handling in mathutils by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/6292
* fix/Removed incorrect node dependency causing Cl smoke test failure by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5937
* fix/Sync tempo widget BPM changes to engine in real time by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/5793
* creating a new template for dmp 2026 by @sum2it in https://github.com/sugarlabs/musicblocks/pull/6442
* fix: correct off-by-one error in nth modal pitch block by @Anexus5919 in https://github.com/sugarlabs/musicblocks/pull/6438
* fix: blocks.js unreachable code always false  by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6480
* fix:Callback never invoked when project download fails by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6477
* Docs: Fix typo 'refernce' to 'reference' in comment by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6478
* fix(aidebugger): clear typing indicator interval on widget close by @SaaiAravindhRaja in https://github.com/sugarlabs/musicblocks/pull/5524
* Fix spelling mistake in BUILTINMACROS key(articulation help) by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5785
* Fix grammar in README by @kambammaanasa08-afk in https://github.com/sugarlabs/musicblocks/pull/6337
* Fix invalid markup and manifest files by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6366
* Standardize Search Menu Dark Mode Colors by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5681
* feat/Added collapsible palette UI by @Rudra2637 in https://github.com/sugarlabs/musicblocks/pull/6069
* Fix overlay canvas resize height by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6327
* fix: replace for-in with for-of on array in noteCounter by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5926
* fix: suppress jsdom canvas warnings in test environment by @Rudra2637 in https://github.com/sugarlabs/musicblocks/pull/5980
* fix: replace undeclared body variable with document.body in theme preference loading by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5891
* fix(loader): resolve lang ReferenceError by init-driven i18n setup by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/5943
* fix: deduplicate DOM query and add null guard in renderThemeSelectIcon by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5896
* fix: add SRI hash to CDN stylesheet and vendor libgif.js locally by @the-shreyash in https://github.com/sugarlabs/musicblocks/pull/5914
* fix: replace for-in loop with forEach in Activity._saveHelpBlocks by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/5888
* Security Vulnerabilities Fix [Failing Security scans] by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6482
* Fix DOM XSS in JavaScript editor error rendering by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/6495
* Load performance tracker on demand by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6418
* perf: Batch palette DOM insertions using DocumentFragment by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6398
* perf: optimize SVG generation using array push and join by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6400
* perf(startup): lazy-load ABCJS library to reduce startup blocking by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6080
* fix: add error handling to Save Lilypond to prevent infinite spinner by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6256
* perf: enforce Core Web Vitals budgets and add resource size limits in Lighthouse CI by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6420
* # fix(phrasemaker): prevent listener accumulation in makeClickable by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6424
* Fixing Music Guide link color in activities.css by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6489
* Fix ReferenceError: _ is not defined on page load by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6367
* Improve processNote regression tests and highlight async cleanup testability gap by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/6296
* Refactor: Replace hardcoded draw timeout with named constant in oscilloscope widget by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6273
* Add Cypress E2E tests for core workflows and update ESLint config for Cypress globals by @severe77 in https://github.com/sugarlabs/musicblocks/pull/6355
* Fix guide TOC links and Documentation Links by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5508
* fix:divison by zero in turtle-singer.js by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6484
* [Chore] Fix doMod behavior when divisor is zero by @srijansingh9170-source in https://github.com/sugarlabs/musicblocks/pull/6231
* Fix Performance Leak in Tuner Lifecycle by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5761
* Update website URL to https and fix the broken website link by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6363
* Fix window.activity deprecation warning by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6369
* perf: replace JSON deep-clone with deepClone utility + cap synthVolum& by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6335
* perf: skip trashed blocks in iteration loops and free canvas cache on& by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6334
* Video Recording Saving Dialog by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5845
* docs: add PERFORMANCE.md documenting ?performance flag by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6260
* Fix #6240: Add PDF guide and improve guide webpage UI by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6291
* fix: add error handling to Save ABC to prevent infinite spinner by @vyagh in https://github.com/sugarlabs/musicblocks/pull/6257
* fix:prevent infinite loop in music keyboard by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6496
* refactor(activity): remove unused local in block container events by @aryan1752 in https://github.com/sugarlabs/musicblocks/pull/5634
* Fix: Proper Lifecycle Management for GlobalCard to Prevent Memory Retention (#5664) by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5672
* Fix spam-clicking Run button causing unhighlight error by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6013
* Fix #6315: Add visual feedback for block connections by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6316
* Fix media block image scaling and decoration issues by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/5192
* Add search tags for better search function working by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6031
* Fix record dropdown outside click listener by @WillyEverGreen in https://github.com/sugarlabs/musicblocks/pull/6303
* fix: XSS security vulnerability by @builtby-SHIV in https://github.com/sugarlabs/musicblocks/pull/5244
* feat(accessibility): Add dynamic grid color support for darker themes by @Nikhita-14 in https://github.com/sugarlabs/musicblocks/pull/6269
* fix: replace blocking alert() with activity.textMsg() in ReturnToURLB& by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6236
* fix: Prevent event listener accumulation in New Project modal by @yogibytes in https://github.com/sugarlabs/musicblocks/pull/6199
* perf: optimize mode widget piano rendering and playback performance by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6407
* parseArg Optimization: Removal of `eval()` from Hot Path by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6016
* Fix #6300: Clean up console.log in Planet module by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6301
* perf(abc): optimize notation generation using array join instead of string concatenation by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6405
* fix: wrap hardcoded alert() strings with _() for i18n localization by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6005
* Refactor: Replaced hardcoded timing value with named constant in modewidget by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6267
* fix:missing-await-async-call by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6492
* Speed up security scans by removing npm ci by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/6379
* fix: skip caching non-http requests in service worker to resolve chrome-extension TypeError (Related to #6373) by @Gamerking177 in https://github.com/sugarlabs/musicblocks/pull/6376
* fix: move typingDiv guard to sendMessage() to prevent chatHistory desync (#6172) by @piyushdotcomm in https://github.com/sugarlabs/musicblocks/pull/6184
* Fix uncontrolled requestAnimationFrame loop in Sampler widget causing CPU Overuse by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/6318
* Refactor: Simplify null/undefined check in  js/widgets/aiwidget.js by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6304
* perf: optimize selection unhighlight lookup by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6192
* perf(activity): prevent idle-watcher listener and interval leaks by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6029
* fix: guard against undefined piemenuValues on plugin blocks (#6501) by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6502
* perf(utils): reduce camera frame overhead by caching canvas context by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6158
* JS Editor: add missing block coverage Phase 2 by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5898
* Fixed loading shell HTML structure by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6342
* Fix: Theme state initialization for Theme Button and Planet by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5648
* Fix XSS vulnerability in Reflection widget by @nishtha-agarwal-211 in https://github.com/sugarlabs/musicblocks/pull/5497
* Fix/ Add 30s timeout to prevent hanging requests by @Laxmi01345 in https://github.com/sugarlabs/musicblocks/pull/5669
* ci: add concurrency cancellation to prevent duplicate workflow runs by @Sekar-C-Mca in https://github.com/sugarlabs/musicblocks/pull/6163
* Fix: remove console.log statements in Planet/js module by @PrathmeshDesai in https://github.com/sugarlabs/musicblocks/pull/6388
* Keyboard Navigation: Tab Focus Cycling Between Toolbar -> Palette -> Workspace by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6259
* fix:type error in ProgramBlocks.js by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6505
* test: improve export.js coverage  MusicBlocks.init, runCommand, and Singer action branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6356
* tests(blocks): add branch coverage tests for ProgramBlocks.js (#5945) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6307
* Tests/logo dependencies 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6281
* Add additional branch coverage tests for ActionBlocks.js by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6278
* Test Suite: Extend unit tests for status.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6046
* Tests/drum blocks 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6222
* Tests/number blocks 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6224
* fix: correct ActionBlocks.test.js mock and assertion after textMsg refactor by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6509
* Add mock implementation for querySelectorAll  by @omsuneri in https://github.com/sugarlabs/musicblocks/pull/6513
* Refactor: reduce duplicated parsing and error handling in NumberBlocks by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/6104
* fix(temperament): map default notes via temperament and harden playN0 by @Yashasyadav in https://github.com/sugarlabs/musicblocks/pull/6421
* perf(startup): remove eager widget loading from MYDEFINES and lazy-load widgets by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6075
* defer checkBounds during batch block operations to fix by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5797
* Fix: Apply safe ESLint eqeqeq and unused-var fixes by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6107
* Updated 'Take a Tour' For Tab Navigation Cycle by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6261
* fix(sw): validate responses before caching in service worker by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6402
* fix: correct errorMsg reference in addScalarTransposition by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6244
* synth recording flow with MBDialog by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5846
* perf: batch parameter block redraws by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6208
* fix(widgets): clean up drag event listeners on LegoWidget close by @SaaiAravindhRaja in https://github.com/sugarlabs/musicblocks/pull/5269
* fix: prettier formatting in ToneActions.js and temperament.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6514
* perf(aiwidget): optimize ABC parsing with O(1) block search and native flattening by @the-shreyash in https://github.com/sugarlabs/musicblocks/pull/6512
* fix: correct typo in BACKWARDCOMPATIBILITYDICT constant name by @Blackmonk892 in https://github.com/sugarlabs/musicblocks/pull/5182
* Add zoom percentage overlay when block scale changes by @Shekar-77 in https://github.com/sugarlabs/musicblocks/pull/6090
* Fix palette auto-closing after mouse clicks on toolbar/workspace by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6510
* perf(startup): add opt-in bootstrap timing instrumentation by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6032
* fix: prevent TypeError in rationalSum with invalid inputs by @swapnachoudhary43 in https://github.com/sugarlabs/musicblocks/pull/6427
* Fix overlay canvas height incorrectly set to width during resize by @aadyaas05 in https://github.com/sugarlabs/musicblocks/pull/6415
* Fix temperament widget undefined function errors - comprehensive fix by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6175
* Update CONTRIBUTING.md with matrix channel link by @divyamagrawal06 in https://github.com/sugarlabs/musicblocks/pull/6319
* perf(loader): stabilize locale asset cache URLs by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6233
* perf: cache repeated DOM lookups in keyboard and paste hot paths by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6340
* fix: Restore palette TAB auto-open when collapsed by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6515
* fix: Block arbitrary code execution in plugin system (closes #5449) by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5451
* Workspace Layout Performance Profiling Instrumentation by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5720
* fix(phrasemaker): read meter from triggering turtle, not always turtle 0 by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6516
* fix takeFocus hides all widgets by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6518
* fix: prevent JSON parse error and auto-trigger search on paste by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/5027
* A11y/aria labels widget window controls by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/5960
* perf(index): defer blocking scripts to improve initial load performance by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6403
* fix: replace hardcoded octave interval with dynamic temperament value by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5032
* Fix temperament integration for custom tunings by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6243
* fix windowScroll Permanently hijacked by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6523
* Accessibility: Add alt text to help widget images for screen readers by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6506
* Refactor: Apply BlocksDependencies pattern to Blocks subsystem by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6519
* perf(palette): cache drag image dimensions to reduce layout thrashing by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6399
* replace unbounded retry loops with bounded exponential backoff in Turtle and Block cache methods  by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5855
* fix: add idle watcher interval cleanup and resource management by @DhyaniKavya in https://github.com/sugarlabs/musicblocks/pull/5770
* chore: remove  console debug statement from meter widget by @Shruti0460 in https://github.com/sugarlabs/musicblocks/pull/5471
* Fix: dark mode block text readability by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6521
* chore: remove debug console statements from js/toolbar.js by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6068
* fix: escape HTML in SaveInterface.prepareHTML() to prevent XSS by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6525
* Chore: Update outdated actions and remove redundant CI steps by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/6077
* fix(SaveInterface): add hasOwnProperty checks to prevent object injection by @WillyEverGreen in https://github.com/sugarlabs/musicblocks/pull/5215
* perf(startup): lazy-load export format modules to reduce startup blocking by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6000
* Fixed memory retention issues and improves recording/playback resource cleanup by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6339
* test: add tests for `js/widgets/statistics.js` by @Om-A-osc in https://github.com/sugarlabs/musicblocks/pull/5222
* fix: restrict Express static file serving to block sensitive files by @the-shreyash in https://github.com/sugarlabs/musicblocks/pull/6012
* docs: improve Reflection Widget User Guide with table of contents, troubleshooting, keyboard shortcuts and analysis report section by @SakethSumanBathini in https://github.com/sugarlabs/musicblocks/pull/6266
* Refactor: Simplify null/undefined check in activity.js by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6283
* Improved accessibility of Help widget navigation arrows (ARIA + keyboard support) by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/5923
* perf(index): remove render-blocking CSS stylesheets and duplicate loads by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6529
* fix: CVE-11 Open Redirect in OpenProjectBlock by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6532
* Fix synth initialization crashes with defensive null checks by @yogibytes in https://github.com/sugarlabs/musicblocks/pull/6386
* perf: gate debug console.log calls behind MB_DEBUG flag by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6336
* Add unit tests for NOTESTEP and ACCIDENTALNAMES in musicutils by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5522
* Add a dedicated keyboard shortcuts guide to the auxiliary toolbar by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6346
* Test: Improve pitchslider.js coverage  mousedown listener branch by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6042
* Fix:Host the README file content as a set of webpages by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6497
* test: add unit tests for platformstyle platform detection helpers by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5583
* refactor(turtle-painter): Replace hardcoded scroll canvas multiplier with constant by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/5246
* Fixed JS editor AST config race and code to block conversion by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6383
* refactor: consolidate duplicate readAsDataURL logic in block.js by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/5414
* Protect timing execution semantics in RhythmActions with regression tests by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/5887
* test(turtle-singer): add regression tests for addPitch helper in processPitch by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/6249
* Bug Fix: Add request timeout and cleanup to prevent hangs and memory leaks by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/5719
* Add mobile Lighthouse CI coverage by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6499
* feat: add instructional hint banner after closing welcome tour by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/4944
* fix: remediate Stored XSS in pie menus and autocomplete search (CVE-15) by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6543
* fix: improve reflection widget UX with centering and refresh feedback by @hassan09070 in https://github.com/sugarlabs/musicblocks/pull/6120
* fix: trigger security scan on master pushes by @Saidkhusayn in https://github.com/sugarlabs/musicblocks/pull/6454
* Fix PhraseMaker default snare drum preview by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6549
* fix(widget): clean up resize event listeners on close to prevent memory leaks by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6401
* fix: replace 100+ unsafe innerHTML assignments with textContent/escap& by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6536
* Security: Adding rel attribute to external help links by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6547
* fix(storage): prevent project data loss with backup and auto-save (#2& by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6539
* Improve trash-hover chunk shrink behavior and drag/drop stability by @Siddharth-732 in https://github.com/sugarlabs/musicblocks/pull/5788
* Optimize dragging performance with requestAnimationFrame by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6541
* Add tooltips to block parameters (#4881) by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6545
* test: Add comprehensive test suite for piemenus.js module with 96 tests by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/6122
* test: add unit tests for mb-dialog.js by @eyeaadil in https://github.com/sugarlabs/musicblocks/pull/6462
* test: add beginFill and endFill coverage for PenBlocksAPI.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6357
* Test Suite: Add unit tests for minify.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6026
* Add unit test for delayExecution to improve coverage by @mishtiagrawal02-cloud in https://github.com/sugarlabs/musicblocks/pull/6055
* test: Improve ToneBlocks.js coverage  harmonic listener, sample, and status matrix branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6083
* perf: optimize hot paths in turtle-singer.js  by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/6338
* Tests/boolean blocks 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6217
* Refactor/mode pitch collections aliases by @Siddharth-732 in https://github.com/sugarlabs/musicblocks/pull/5922
* Tests/dict blocks 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6220
* test: Improve planetInterface.js coverage  null guards, listener callbacks, and error handlers by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6108
* Test Suite: Add unit tests for activity-context.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6028
* Test: Improve BoxesBlocks.js coverage  missing box and status matrix branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6047
* fix: replace console statements with debugLog in CacheManager by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6546
* Replace 23 raw setTimeout calls in Logo engine with ManagedTimer by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/5799
* Test: Improve MediaBlocks.js coverage  null guards, environment flags, and note block branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6099
* test: Improve tempo.js coverage  clearInterval, pause button toggle, and save debounce branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6114
* Fix: RequestManager Promise Rejection and Timeout Handling (#5668) by @dineshkolhe1 in https://github.com/sugarlabs/musicblocks/pull/5729
* test: expand RhythmBlocks test suite coverage (#5607) by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/5772
* test(utils): add edge case tests for format() by @Thesmoothengineer in https://github.com/sugarlabs/musicblocks/pull/5848
* Added comprehensive tests for logo-dependencies (94.44% coverage) by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/6129
* test: Improve MeterBlocks.js coverage  BPM setter, action errors, and status matrix branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6082
* test: Improve EnsembleBlocks.js coverage  listener, startBlock, and pitch branches by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6048
* perf(activity): cache encoded grid assets during init by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6034
* tests(toolbar): improve branch coverage for renderLanguageSelectIcon and renderModeSelectIcon (#5945) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6214
* test: mock requestAnimationFrame to fix mb-dialog.test.js failures by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6557
* Tests/rhythm blocks 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6280
* fixes jest test in toolbar.test.js by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6558
* test: add tests for performanceTracker.js achieving 88% coverage by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6284
* Fixes a lint error from help.test.js by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/6559
* fix: cancel delayed reflection typing indicator by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6551
* Fix: SVG widgets fail to restore original size by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6554
* Fix: Prevent dropped user queries in Reflection Widget (#6171) by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6176
* Handle missing textMsg in HelpWidget on close by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6561
* fix: resolve widget double-click issue by ensuring async loading comp& by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6568
* Agents.md for music blocks by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6575
* fix: lazy-load HelpWidget in aux pie menu context by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/6573
* docs: expand AGENTS.md with repo-specific guidance by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6579
* Fix: Prevent crashes from unsafe JSON parsing in localStorage by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6584
* Fix #6562: Release webcam stream tracks in doStopVideoCam by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6581
* fix: guard against null return from getTargetTurtle in _blockFindTurtle by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6582
* fix: mitigate arbitrary JS execution in editor core by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6585
* JS Editor: add missing block coverage Phase 3 (Heap) by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5899
* Add circular view to Rhythm Maker widget by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6555
* Enhance observability in core modules via descriptive error handling by @saishmungase in https://github.com/sugarlabs/musicblocks/pull/5195
* Tests/extras blocks 5945 by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6218
* fix: remove leftover debug console logs by @mishtiagrawal02-cloud in https://github.com/sugarlabs/musicblocks/pull/6112
* chore: remove debug console statements from js/lilypond.js by @bhangalesoham2606 in https://github.com/sugarlabs/musicblocks/pull/5639
* feat: add sliding window with conversation summarization by @hassan09070 in https://github.com/sugarlabs/musicblocks/pull/5991
* feat: add toast notifications for project save and recording (.webm) by @PrathmeshDesai in https://github.com/sugarlabs/musicblocks/pull/6394
* test: expand tests for `widgets/temperament.js` by @Om-A-osc in https://github.com/sugarlabs/musicblocks/pull/5931
* test: add tests for `js/widgets/sampler.js` by @Om-A-osc in https://github.com/sugarlabs/musicblocks/pull/5933
* fix: remediate prototype pollution via __proto__ in generate by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6588
* Fix #6593: Resolve Promise being passed to project loading in Planet close flow by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6595
* ci: add auto-rebase and conflict detection workflows by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6578
* fix: refactor plugin architecture to use Blob URLs for CSP compliance by @Sidharthwin in https://github.com/sugarlabs/musicblocks/pull/6601
* Refactor #6600: Standardize error handling with Error objects by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6602
* perf: mark wheel event listeners as passive to fix scroll-blocking violations (fixes #6597) by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6599
* Fix dark mode: replace hard-coded colors with platformColor in widgets by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6618
* Optimize Canvas Rendering: Implement deferred stageDirty pattern by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6615
* fix: guard Synth.trigger against use-after-dispose on stop by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6596
* Fix widget scroll hijacking caused by global onscroll override. Fixes #6592 by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6594
* security: Implement opener protection and harden external links by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6577
* perf(utils): add retry limit to autocomplete setup polling by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6635
* test: add missing unit coverage for utils by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6641
* [fix]: guard doForward against non-finite steps to prevent infinite loop by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6639
* fix(jseditor): close button (X) not working in JavaScript editor widget by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6649
* fix: sanitize built-in plugin name prompt (Related to CVE-14) by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6626
* refactor: generalize pitch wrapping logic and add behavioral tests by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6656
* fix: catch errors from malformed MIDI files on import by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6655
* Refactor: Improve script.js logic by @castorNova2 in https://github.com/sugarlabs/musicblocks/pull/6623
* fix: add RequireJS errback to _loadSample to prevent hung promise by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6658
* fix: dynamically update fullscreen tooltip by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6646
* fix: resolve audio analyser node leak in AIWidget by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6660
* refactor: centralize Unicode accidental normalization in musicutils by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6657
* fix: guard doArc against non-finite angle and radius by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6661
* Add tests for LegoWidget core logic (#6344) by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6503
* fix: resolve AIWidget canvas trashing and DOM leaks on resize by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6663
* fix: B# and Cb interval math at octave boundaries by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6638
* Fix/issue 6563 help lazyload by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6567
* Fix dark mode text contrast on sidebar blocks. Fixes #6590 by @shaikhibrahim2000 in https://github.com/sugarlabs/musicblocks/pull/6591
* fix: resolve client-side API key exposure and stabilize AI playback  by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6651
* perf(piemenus): attach resize listener only while wheel menu is active by @Rohit-rk07 in https://github.com/sugarlabs/musicblocks/pull/6178
* test: Add GlideBlock __listener coverage for OrnamentBlocks.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6041
* chore: include planet/js in test coverage report by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/6245
* chore: remove debug console statements from js/widgets/status.js by @thevanshit in https://github.com/sugarlabs/musicblocks/pull/5476
* feat(a11y): add aria-labels to toolbar icons for screen reader suppor& by @abhnish in https://github.com/sugarlabs/musicblocks/pull/6309
* Fix text overflow and implement wrapping in Show block by @Inuth0603 in https://github.com/sugarlabs/musicblocks/pull/5278
* Fix Music Keyboard restoring stale global key handlers on close. Fixes #6628 by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6630
* fix: correct typo and grammar in Dock Block help string by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6673
* fix: restore previous onkeydown handler when HelpWidget closes by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6632
* fix(security): Validate URLs before network requests and improve query parsing  by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6677
* Perf: centralize widget listeners by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6671
* fix: resolve memory and runtime leaks by managing all timeouts in modewidget by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6665
* Add cents input alongside hertz slider in Temperament Widget by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6683
* Fix incorrect this binding in global search input handler by @CodeWith-sakib in https://github.com/sugarlabs/musicblocks/pull/6676
* fix(GraphicsBlocks): guard against undefined blockList + improve BooleanBlocks tests by @Thesmoothengineer in https://github.com/sugarlabs/musicblocks/pull/6205
* fix: preview multiple instances in sampler by @Oashe02 in https://github.com/sugarlabs/musicblocks/pull/5558
* chore:remove debug console statement from tempo widget by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/5469
* Add comprehensive edge case tests for js-export module by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/5560
* fix: safeguard search widget outside-click handler against missing palette rows by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6692
* Accessibility: Add ARIA live regions to dynamic notification popups by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6637
* test: foundational unit tests for blocks.js by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6675
* maintenance: update minor dependencies (cypress, i18next, jest-environment-jsdom, sass) by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6262
* Fix module export for reflection.js to enable proper Jest coverage re& by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5940
* [UI/UX] Stop Button Appears Only During Active Playback #5778 by @anshukaushik4700 in https://github.com/sugarlabs/musicblocks/pull/5779
* fix: correct typo in Set-heap block help string by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6686
* Test: expand musicutils core coverage by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6474
* fix: restore blocks visibility after natural playback end by @vyagh in https://github.com/sugarlabs/musicblocks/pull/5006
* fix: remove redundant duplicate line in MusicKeyboard.onclose by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6688
* fix: resolve shifted arguments in SawtoothBlock flow method by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6696
* fix: add missing blk argument to errorMsg calls in ProgramBlocks by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6690
* Increase PhraseMaker test coverage from 2% to 47% by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5955
* Refactor RhythmBlockPaletteBlocks: Extract reusable playNoteSequence helper to remove duplicated scheduling logic by @Pankajyadav919 in https://github.com/sugarlabs/musicblocks/pull/5765
* Fix module export for oscilloscope.js to enable proper Jest coverage by @stutijain2006 in https://github.com/sugarlabs/musicblocks/pull/5956
* fix: resolve lost 'this' binding in camera ID callback by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6679
* Fix: Run PO to JSON validation on PRs and bulletproof git diffs by @varruunnn in https://github.com/sugarlabs/musicblocks/pull/6116
* ci: Add Jest coverage threshold ratchet to prevent test regression by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6694
* fix: resolve crash in MeterBlocks when missing inputs in tempo clamp & by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6700
* fix: correct failing tests in phrasemaker.test.js by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6705
* fix: stop synth from triggering after it's been disposed by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6703
* fix: add confirmation dialog for New Project in PlanetClicking 'New P& by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6681
* chore: add additional tests for GraphicsBlocks [#5607] by @Mohd-Ali-Creator in https://github.com/sugarlabs/musicblocks/pull/6435
* fix(musicutils): correct note order for la/A note group by @CodeLine9 in https://github.com/sugarlabs/musicblocks/pull/6708
* test: add Block Palette interaction tests to Cypress E2E suite by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6143
* fix(security): remove eval() from JS export class  by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6704
* Fix sampler and AI debugger widget opening by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/6633
* Fix global blur handler overwrite in Activity. Fixes #6652 by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6654
* fix: guarantee lock release in DuplicateBlock and ArpeggioBlock criti& by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6712
* fix: add array bounds validation for staffBlocksMap to prevent crashes by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6714
* fix: use dynamic blueButtonText color in Clear Workspace confirm dialog by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6711
* Refactor IntervalsBlocks.js export to fix coverage reporting and expand unit tests by @severe77 in https://github.com/sugarlabs/musicblocks/pull/5912
* fix: correct error message in setSynthVolume when synth is not found by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6716
* Accessibility: Improved accessibility by replacing generic alt text in video.md by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6725
* fix(index): remove duplicate fullscreen code and syntax error by @CodeLine9 in https://github.com/sugarlabs/musicblocks/pull/6717
* fix: intervalsBlocks failing tests import mismatch, deepClone mock by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6731
* Fix: Palette layout issues and reinitialization logic redundancy by @farhan-momin in https://github.com/sugarlabs/musicblocks/pull/6707
* test: added ai widget tests by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6727
* fix: format frequency labels in Pitch Slider for better readability by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6730
* fix: resolve aggressive letter stripping in getArticulation by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6715
* Harden widget HTML rendering by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6734
* fix(logo): execute ONSTOP plugin hooks on stop by @WillyEverGreen in https://github.com/sugarlabs/musicblocks/pull/6733
* refactor: Increase unit test coverage for SaveInterface.js  by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6739
* chore: improve RhythmBlocks branch coverage [#5607] by @Mohd-Ali-Creator in https://github.com/sugarlabs/musicblocks/pull/6738
* fix: resolve invalid CSS percentage value for lineHeight in RhythmRuler by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6737
* fix: correct off-by-one in Mouse constructor turtle assignment by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6741
* fix: guard doRight and doSetHeading against non-finite degrees by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6744
* Replace blocking alert with console.warn on copy failure by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6746
* fix: apply dynamic theme colors to Import MIDI dialog buttons by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6748
* Fix utils.js global window.onload overwrite during IE check. Fixes #6721 by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6722
* Feature: SVG asset selector. by @parthdagia05 in https://github.com/sugarlabs/musicblocks/pull/6745
* test: add foundational unit tests for Block.js by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6753
* fix: resolve broken loop indexing in temperament widget by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6751
* fix: normalize instrument name resolution to ensure consistent audio behavior across translations by @CodeBySayak in https://github.com/sugarlabs/musicblocks/pull/6743
* fix: remove correct loop block in doBreak execution queue by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6758
* fix: move resolveInstrumentName tests into correct describe scope by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6766
* fix: correct fallback temperament logic in numberToPitch (Resolves #6782) by @gourijain029-del in https://github.com/sugarlabs/musicblocks/pull/6783
* fix: route yield setTimeout through _timerManager to prevent ghost ex& by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6784
* style: fix prettier formatting in delayExecution, lilypond, and mxml test files by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6785
* fix: add package.json override for follow-redirects moderate CVE by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6786
* Fix auxiliary toolbar toggle button class corruption. Fixes #6771 by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6778
* fix: guard doSetXY against non-finite coordinates by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6776
* fix: resolve parameter shadowing in resetSynth by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6769
* fix: prevent search widget mousedown listener accumulation by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6765
* Fix SaveInterface export load hook overwrite. Fixes #6762 by @moksha-hub in https://github.com/sugarlabs/musicblocks/pull/6763
* fix: null dereference in backward block traversal by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6761
* Remove legacy synth block path by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6749
* perf: optimize palette search keyboard navigation and eliminate redundant timeouts by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6755
* test: add missing unit tests for BlocksDependencies and svgAssetSelector by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6791
* SECURITY: Added security flags to window.open calls in background.js by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6816
* test: Improve unit test coverage for Arpeggio Widget (Related to #1234) by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6814
* Add cypress e2e tests for language preference and new project workflow by @severe77 in https://github.com/sugarlabs/musicblocks/pull/6812
* fix: unescape HTML project data on load to fix JSON parsing by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6807
* fix: stabilize startup load order for core scripts by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/6805
* perf: implement state guards for canvas context properties by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6801
* [Fix]: loop() crash when instrument is uninitialized due to async loadSynth race by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6797
* fix: correct incorrect key mappings in modeMapper function by @Vaishnavi10706 in https://github.com/sugarlabs/musicblocks/pull/6795
* fix: resolve multi-click race condition on project likes by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6793
* Fix: clamp synthVolume to 0-100 during crescendo/diminuendo by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6789
* fix: fixed the layout and colors of report submission form in planet modal by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6777
* test: add unit tests for Converter.js achieving 100% statement coverage by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6788
* test: add unit tests for StringHelper.js achieving 100% statement coverage by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/6787
* test: add test coverage for planet/saveinterface.js by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6817
* test: add unit tests for LocalPlanet storage (planet/js/LocalPlanet.js) by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6822
* test: update synthutils tests to validate graceful no-op behavior by @Suyash-ka-github in https://github.com/sugarlabs/musicblocks/pull/6834
* fix: reconnect synth to Destination after effects cleanup in _performNotes by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6849
* feat: improve unit tests for HelpWidget by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6829
* chore: remove unused eslint-disable directives by @Anexus5919 in https://github.com/sugarlabs/musicblocks/pull/6828
* test: add unit tests for StringHelper utility by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6836
* test: add unit test for planet/serverinterface.js  by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6826
* refactor: migrate manual lib dependencies to npm and gulp bundle by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/6720
* test: BooleanBlocks - reorganize tests and extend coverage to 82% by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6851
* fix: honor configured timeout in planet request manager by @Suyash-ka-github in https://github.com/sugarlabs/musicblocks/pull/6847
* Fix/high contrast UI improvements by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6768
* fix: resolve planet sorting dropdown bugs by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6841
* fix: persist project changes across reload due to language change by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6832
* fix: resolve search box UI misalignment in block palette by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6770
* Fix file chooser reset for same-file reload (#6872) by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6876
* fix: replace debug console statements with proper error handling in AIWidget by @Shushmitaaaa in https://github.com/sugarlabs/musicblocks/pull/6852
* refactor: remove deprecated and unused _addButton method by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/6921
* fix: resolve double-allocation memory leak of Tone.Sampler in _createSampleSynth by @karthik-dev56 in https://github.com/sugarlabs/musicblocks/pull/6904
* fix: wrap JSON.parse in try-catch in Publisher.dataToTags by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6892
* fix(#6870): clear typing indicator interval before resetting conversation by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6871
* fix: cache sampler tuner segments by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6884
* fix: centralise hardcoded API keys into env.js by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6894
* Add keyboard accessibility and ARIA roles to palette by @Suyash-ka-github in https://github.com/sugarlabs/musicblocks/pull/6866
* perf: use deepClone in block copy hot paths by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6939
* fix: resolve logic error in rationalSum where arrays were compared to 0 (Fix #6937) by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6938
* Fix PlanetInterface error handler receiver in loadProjectFromData by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6932
* fix: clean up timbre widget timers by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6941
* Fix idle watcher cleanup mismatch by using canonical teardown (#6875) by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6878
* fix: define missing offlineFallbackPage in service worker by @sakshar2303 in https://github.com/sugarlabs/musicblocks/pull/6848
* fix: add epoch guard before setNote in synthutils by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6900
* fix: clean up rhythm ruler timers by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6940
* Guard startup paths when localStorage is unavailable (#6873) by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6877
* fix: support portrait orientation in PWA manifest by @tarun-227 in https://github.com/sugarlabs/musicblocks/pull/6867
* test: consolidate ModeWidget tests and move statistics test to __tests__ by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6935
* [Fix]: double-routing of effects in _performNotes causing incorrect audio and volume by @Ady0333 in https://github.com/sugarlabs/musicblocks/pull/6919
* test: add unit tests for ProjectViewer in Planet subsystem by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6933
* fix: remove drag-and-drop listeners on sampler widget close by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6902
* fix: guard against division by zero in PhraseMaker audio by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6896
* fix: guard indexOf() before array access in rubrics and turtle-singer by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6893
* Eliminate reqwest dependency by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6821
* fix: reset stop and save buttons when playback naturally completes by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6838
* fix: handle click event state after stop in action block by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6993
* Harden Activity _loadProject against secondary Planet failures by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6973
* Guard PlanetInterface open/save paths when Planet backend is unavailable by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6971
* Fix PlanetInterface.saveLocally global event ReferenceError by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6968
* perf: defer checkBounds during bulk block moves to avoid O(N²) overhead by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6995
* Replace javascript: pseudo-URL with proper onclick handler in SaveInterface.js by @codeGurhans in https://github.com/sugarlabs/musicblocks/pull/6994
* fix: cache block search autocomplete results by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/6949
* fix: replace document.onkeydown with addEventListener in help widget by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6901
* fix: guard division by zero in Staccato and Slur blocks by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6988
* fix(blocks): handle undefined blocks in _getStackSize and adjustDocks (part 2) by @Ajay9704 in https://github.com/sugarlabs/musicblocks/pull/6960
* fix: add Secure and SameSite flags to setCookie by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6895
* perf: optimize docks deepClone in blockfactory.js by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7012
* fix: change help icon colors for better dark and high contrast visibility by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7013
* fix: add missing validate task and cssTask to gulpfile.mjs by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6986
* perf: optimize workspace responsiveness via SVG caching and coalesced bounds checking by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6956
* fix: auto-rebase skips failed PRs and eliminates notification spam by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/6924
* fix: resolve failing planetInterface test by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7016
* fix: remove native alert() from ProgramBlocks.js by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7009
* fix: render rhythm ruler note values as DOM nodes (Related to #6854) by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6880
* fix: correct dark help dropdown hover states by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7042
* feat: integrate ManagedTimer into widgetWindow lifecycle by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7017
* fix: use tempo activity instance by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7033
* test : improve test coverage for musicutils from 57% to 70%+ by @bhumindeshpande8-spec in https://github.com/sugarlabs/musicblocks/pull/7062
* fix: Docker setup to load the app correctly by @Utkarsh-0304 in https://github.com/sugarlabs/musicblocks/pull/7069
* Guard PlanetInterface storage access before init by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/7089
* Fix merge button behavior in LocalCard by @Rudra2637 in https://github.com/sugarlabs/musicblocks/pull/7098
* fix: add gated block timing in runFromBlockNow by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7101
* fix: replace innerHTML concatenation with programmatic DOM creation by @Ayush4958 in https://github.com/sugarlabs/musicblocks/pull/7110
* Fix music keyboard hertz add-row submenu by @Sourav001254 in https://github.com/sugarlabs/musicblocks/pull/7080
* fix: correct "pich" typo in number to pitch block help string by @lohith2406 in https://github.com/sugarlabs/musicblocks/pull/7124
* fix: replace tautologies with real assertions in PenBlocks tests by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7128
* fix: add @xmldom/xmldom override to resolve high severity CVEs by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7129
* refactor: migrate tempo widget timers to ManagedTimer by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7014
* fix: refresh palette collapse handle theme color by @Rudra2637 in https://github.com/sugarlabs/musicblocks/pull/6923
* test: add unit tests for planet/js/LocalCard.js by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7088
* fix: resolve systematic TypeErrors due to sparse blockList by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7028
* fix: resolve failing test-cases and html linting issues by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7147
* Fix project image fallback and report progress state by @Rudra2637 in https://github.com/sugarlabs/musicblocks/pull/7179
* Fix DuoSynth Panel Not Opening on First Click After Synth Switch by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6980
* fix: bump i18next-http-backend to resolve path traversal CVE by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7131
* fix: guard hideContents click in resize handlers by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/7093
* ci: enhance Jest PR comments with guidance for test failures by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/6950
* fix: add Pointer Events support to Music Keyboard and Rhythm Ruler widgets for touch/mobile devices by @rakshaak29 in https://github.com/sugarlabs/musicblocks/pull/7112
* test: add phrasemaker audio coverage by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7029
* Guard openProjectFromPlanet when Planet is not initialized by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/7091
* fix: resolve AGENTS.md innerHTML security violations in UI widgets by @Ayush4958 in https://github.com/sugarlabs/musicblocks/pull/7125
* Fix thumbnail not saving due to getBounds() returning null by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7219
* security(planet): replace window.parent access with postMessage bridge by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7209
* fix(#7216): remove inline sr-only styles breaking textMsg visibility by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7221
* fix: correct activity reference in tempo widget and planet interface test by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7264
* Fixes the redundant block creation after SNAP-IN in Pitch Block by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/5040
* fix: handle multi-digit octaves in note parsing, Closes #6773 by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7226
* fix: restore Status Widget default monitoring blocks by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/6728
* fix: DEFAULTVOICE test failure in Arpeggio widget by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7273
* fix: stop render loop from running when idle or tab is hidden by @aditya-8787 in https://github.com/sugarlabs/musicblocks/pull/7197
* fix: restore render loop during block interactions and refreshCanvas by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7296
* fix/remove unnecessary console logging by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7313
* perf: optimize block drag performance by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7338
* perf: run mouse presence detection listener only once by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6885
* perf: optimize dom layout performance by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7337
* feat: add utils-logic.js with extracted pure logic and tests by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7302
* Pr2 migrate utils logic by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7303
* Pr3 update bootstrap by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7304
* fix: restore companion turtle in _restoreTrashById after trash/undo by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7300
* fix: remove stray console.log from DictActions.setValue and add missing turtle guard in getValue by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7344
* perf: modernize UI rendering with requestAnimationFrame by @Ayush4958 in https://github.com/sugarlabs/musicblocks/pull/7160
* Fix/planet to title case utils logic dependency by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7355
* fix(test): remove obsolete console.log assertion in DictActions tests by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7351
* chore: add Dev Container configuration for consistent development by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7309
* fix: resolve new project replication regression (#7350) by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7352
* fix by adding defensive null checks inside _updateWidgetWindowSize() by @Ajay9704 in https://github.com/sugarlabs/musicblocks/pull/7149
* Security Fix: Restrict `open project` to trusted Music Blocks URLs by @Suyash-ka-github in https://github.com/sugarlabs/musicblocks/pull/7055
* test: add unit tests for planet/js/helper.js by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7086
* test: add unit tests for GlobalPlanet by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7235
* fix: replace createjs.Graphics.getRGB with native rgba() in muns& by @SuryaPratapIIIT in https://github.com/sugarlabs/musicblocks/pull/7164
* docs: add test:coverage script and coverage guide section by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7266
* fix: update GitHub Actions to latest versions by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7271
* test: add unit tests for ManagedTimer utility by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7281
* Debounce local project rename to avoid repeated full DB writes by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7292
* test(planet): add tests for Planet.js achieving 100% coverage by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7331
* refactor: secure widgets against XSS by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7099
* fix: cleanup previous trashView before rendering new trash panel to reduce detached DOM retention during repeated trash operations by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7360
* fix: resolve XSS vulnerabilities in reflection widget by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7103
* fix: resolve canvas pie menu rendering bug on fallback by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7363
* fix: correct glide duration calculation for glissando by @parshipcy in https://github.com/sugarlabs/musicblocks/pull/7349
* Updated direct dependencies and security overrides by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7369
* fix: remove dead preloadjs dependency by @parshipcy in https://github.com/sugarlabs/musicblocks/pull/7356
* fix: complete TODO and add descriptions for libraries in lib/README.md by @nickhil-verma in https://github.com/sugarlabs/musicblocks/pull/6835
* fix: sensors reflection xss security hardening by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7141
* fix: remediate XSS in multiple widgets and activity by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7127
* test: fix LocalCard debounce timer regression in renameProject test by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7365
* fix: refactor innerHTML to mitigate DOM XSS in Editor and PitchDrumMatrix by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7375
* fix: replace leftover debug console.log calls with console.warn by @Harshit-Mishra2212 in https://github.com/sugarlabs/musicblocks/pull/7299
* Fix companion turtles not cleared in sendAllToTrash by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7256
* fix: replace String.fromCharCode spread with loop in base64Encode to prevent RangeError crash on large compositions by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7354
* test: add negative assertion to validate debounce delay in LocalCard test by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7368
* fix: fail CI job if Jest tests fail instead of always returning success by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7250
* fix: correct ABC notation for end-decrescendo decoration by @lohith2406 in https://github.com/sugarlabs/musicblocks/pull/7136
* test(block): add regenerateArtwork edge case tests by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7333
* test: expand PitchStaircase coverage (18 ’ 25 tests) by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7382
* test: expand AIDebuggerWidget coverage (18 ’ 62 tests) by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7381
* test(turtle-painter): add doForward boundary and edge case tests by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7330
* ci: add timeout-minutes to workflows by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7322
* Fix restored trash blocks missing blockArt regeneration by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7255
* fix: prevent instant page reload on language change by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7390
* fix: resolve XSS  regression in languagebox by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7387
* security(aidebugger): require explicit consent before sending project data by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7213
* task: prep i18n for string freeze by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7424
* fix: resolve failing AI Debugger _sendMessage test and add consent fallback test by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/7403
* test(base64Utils): add Unicode, long string, and error edge case tests by @yashisrani in https://github.com/sugarlabs/musicblocks/pull/7329
* task: Adding Tamil by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7434
* fix: add Chore/Refactor category to PR template and ci check by @parshipcy in https://github.com/sugarlabs/musicblocks/pull/7357
* fix HTML syntax errors by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7241
* fix: sanitize saved HTML image URLs by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7395
* fix: retry timeout failures in RequestManager instead of returning immediately by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7340
* route onEveryBeatDo beat interval through ManagedTimer to stop post-Stop firing and stale interval accumulation by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7347
* fix: recover startup when session JSON parse fails by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/7002
* test: Add Jest tests for js/utils/jquery-setup.js by @andoriyaprashant in https://github.com/sugarlabs/musicblocks/pull/7239
* fix: restore adjustDocks guard and trim clamp cleanup by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7397
* fix: prevent null match crash when loading malformed HTML project files by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7398
* test: add unit tests for safeJSONParse, toTitleCase, and escapeHTML in utils.js and fix missing exports by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7280
* fix: resolve block input click issue on browser zoom by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7422
* fix: make getNumNote temperament-aware for non-12-EDO tuning systems by @Mikey3600 in https://github.com/sugarlabs/musicblocks/pull/7278
* [DMP 2026 POC #7171] feat: add non-EDO temperament constants and helpers by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7317
* fix: bpmFactor operator precedence in WaitBlock and NoteBlock by @netram75 in https://github.com/sugarlabs/musicblocks/pull/7417
* fix: guard against uninitialized note arrays in playRest by @netram75 in https://github.com/sugarlabs/musicblocks/pull/7426
* harden StringHelper XSS regression coverage by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7421
* fix: reset _circularCanvas and _circularView on widget close by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7450
* add Zelda theme example by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7466
* Fix skipped comment blocks and correct top-20 symbol calculation by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7439
* test: expand Arpeggio widget coverage for untested logic paths by @netram75 in https://github.com/sugarlabs/musicblocks/pull/7463
* fix: stop prepareExport from mutating live block names for nop* blocks by @netram75 in https://github.com/sugarlabs/musicblocks/pull/7465
* Fix/replace amp img by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7402
* fix: update interval selection when interval type changes without number by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7472
* Finally got around to fixing the logging chaos. by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7383
* fix(tests): set consent state explicitly in AIDebuggerWidget test by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7459
* ci: Added Ci Label by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/7144
* perf: reduce idle canvas re-rendering by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7481
* fix: add touch long-press to trigger context pie menu on mobile by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7484
* Improve Planet search behavior and disable infinite scroll by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7485
* Add area ownership governance by @vyagh in https://github.com/sugarlabs/musicblocks/pull/7482
* perf: fix idle watcher throttling fps during multi-turtle playback by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7483
* Add tooltip for truncated project titles in Planet by @Manvitha-Kopela in https://github.com/sugarlabs/musicblocks/pull/7346
* test: expand LegoWidget coverage for color utility methods (Related t& by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7498
* fix: average two-finger touch deltas to fix scroll direction bug by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7501
* refactor: extract canvas recording system from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7503
* fix: Typo accidetalFlat -> accidentalFlat in sampler.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7502
* refactor: extract SVG and PNG export logic into exporters.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7508
* style/fix: Maintain code quality and security standards in base64Utils & jseditor by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7507
* refactor: cleanup exporters.js AMD module export and require path by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7509
* Improve auto-rebase workflow by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/7477
* chore(deps-dev): bump tmp from 0.2.5 to 0.2.7 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7445
* docs: add initial WCAG 2.1 AA audit report (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7510
* fix: remove unused variable in sampler.js handleFiles by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7499
* Optimize changeImage SVG encoding overhead by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7474
* fix: clear LEGO Bricks scanning status message by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7505
* test: improve test coverage for tutle-painter.js by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7500
* test: enhance turtle painter test suite reliability (Related to #7500) by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7513
* chore(tests): remove duplicate license and author headers in utils.test.js by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7152
* test: add regression safety tests for async and lifecycle AI widget flows by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7373
* fix: guard against numeric noteArg in getNote() by @Gungunverma1227 in https://github.com/sugarlabs/musicblocks/pull/7452
* feat(tokens): introduce foundational CSS design token system (Part 1 of #6606) by @unmeshgb in https://github.com/sugarlabs/musicblocks/pull/7315
* fix:Localize record dropdown menu options and fix loader Japanese support by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7514
* fix: replace innerHTML with textContent in sampler.js and pitchslider.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7491
* fix(pitchstaircase): correct stair ratio corruption, undefined crash, and broken recursion termination by @netram75 in https://github.com/sugarlabs/musicblocks/pull/7469
* chore: add files for Georgian (ka) by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7516
* chore: add positioning for each mouse; add some simple graphics by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7517
* refactor(css): migrate core stylesheets to design tokens (Part 2 of #6606) by @unmeshgb in https://github.com/sugarlabs/musicblocks/pull/7316
* fix: translate default parameter block labels at display layer for i18n by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7518
* fix: stop tempo widget audio when block is deleted from canvas by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7515
* Modified JA translations after human review by @pikurasa in https://github.com/sugarlabs/musicblocks/pull/7520
* Chore: update kana by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7521
* test: add parser and normalization regression coverage for aiwidget by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7411
* test: add async playback regression coverage for aiwidget by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7441
* refactor(temperament): replace platformColor background with CSS tokens by @adarsh-yadav1 in https://github.com/sugarlabs/musicblocks/pull/7420
* fix: toggle play button icon during playback in LEGO Bricks by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7456
* fix: guard against null blockList[blk] in _blockFindTurtle by @netram75 in https://github.com/sugarlabs/musicblocks/pull/7214
* Refactor/activity abc parser by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7511
* docs: add missing license header to p5-adapter.js and fix file description in oscilloscope.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7522
* Fix: Resolve redundant callbacks and missing payloads in HttpRequest by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7475
* Remove outline none to restore keyboard focus indicators by @Rahulchaudharyji2 in https://github.com/sugarlabs/musicblocks/pull/7135
* refactor: use CSS token for Extras SVG background by @nehayadav827 in https://github.com/sugarlabs/musicblocks/pull/7432
* fix: Prevent whole-page zoom and implement pinch-to-zoom on blocks canvas by @harshwardhan-kp in https://github.com/sugarlabs/musicblocks/pull/7376
* test: consolidate duplicated describe blocks in utils tests by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7526
* docs: add REVIEW_GUIDELINES.md by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/7506
* fix: remove duplicate isSafeUrl from ActionBlocks.js, use centralized utility by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7540
* refactor: decompose parseABC() into focused helper functions by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7524
* refactor: extract activity idle watcher and autosave controller by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7562
* fix: allow Tab navigation on focusable DOM elements (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7563
* fix: add alt text to decorative palette icons, label close button (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7564
* refactor: extract GridController from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7566
* perf: throttle idle timer resets by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6886
* fix: replace raw error.message with i18n string in AI Debugger #7555 by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/7556
* refactor: extract grid rendering methods into grid-renderer.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7572
* feat: make pitch/frequency conversion temperament-aware by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7561
* feat(firefox): warn when unusually large canvas may impact rendering performance by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7578
* fix: use active Planet metadata for exports by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/7413
* refactor: extract plugin controller from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7581
* perf: reduce redundant lookups in Logo execution engine by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7582
* Fixed a XSS vulnerability by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7588
* Refactor/plugin dialog UI by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7584
* Fix: corrected the typo, giving error in console when clicked on "letter class" button in status, from widgets section. by @RikenMor001 in https://github.com/sugarlabs/musicblocks/pull/7586
* Fixed status widget label handling in console. by @RikenMor001 in https://github.com/sugarlabs/musicblocks/pull/7585
* fix: resolve 147 ESLint eqeqeq warnings in blocks.js by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7583
* fix: add missing switch cases to correct slider fractions by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7551
* test: expand utils.js coverage from 11% to 34% via existing module.exports block by @AdityaM-IITH in https://github.com/sugarlabs/musicblocks/pull/7419
* fix: replace innerHTML with textContent for static text in modewidget.js and jseditor.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7523
* fix: guard against null when setting theme-color meta content by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7531
* test: consolidate MeterWidgettests and remove duplicate test  by @e-esakman in https://github.com/sugarlabs/musicblocks/pull/6930
* blocks: Add missing radix parameter to parseInt calls by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7579
* fix: guard block.artwork null in _renderTrashView before encoding by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7538
* fix: mathutils doInt silently propagating NaN on bad input by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7552
* feat(widget): migrate Pitch Staircase styling to CSS tokens (Part 3 of #6606) by @unmeshgb in https://github.com/sugarlabs/musicblocks/pull/7318
* perf: optimize zoom overlay component to reduce DOM queries by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7401
* fix: align Phaser base frequency defaults in Timbre widget by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7532
* fix: prevent Infinity from division by zero in Neighbor ornament by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7533
* fix: replace inline onclick handlers with addEventListener in SaveInterface by @creo04 in https://github.com/sugarlabs/musicblocks/pull/7571
* fix: stop Rhythm Ruler audio on project switch by invoking onclose in closeWidgets by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7560
* fix: resolve PhraseMaker pie submenu crashes, positioning bugs, and close action failures by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7573
* fix: reject zero and negative ratio inputs in Pitch Staircase by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7534
* Fix Phaser base-frequency default desynchronization in Timbre by @Tomeshwari-02 in https://github.com/sugarlabs/musicblocks/pull/6865
* fix: add webcam capture button in LegoWidget by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7558
* fix: replace unsafe innerHTML with textContent/createElement by @patilpratik1905 in https://github.com/sugarlabs/musicblocks/pull/7569
* fix: replace unsafe innerHTML with createElement in sampler, PhraseMakerAudio, and aiwidget  by @patilpratik1905 in https://github.com/sugarlabs/musicblocks/pull/7570
* Hoist findBlockInstance temperament1 lookup out of per-block loop by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7290
* fix: stop custom mode widget audio and close window on block deletion by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7550
* fix: guard parseArg and charAt against missing turtle in Status widget by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7577
* fix: disconnect synth before toDestination to prevent duplicate audio graph connections by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/6964
* fix(utils-logic): emit console.error for zero-denominator in rationalSum by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7554
* Refactor/pitchstaircase inline styles by @Rahulchaudharyji2 in https://github.com/sugarlabs/musicblocks/pull/7134
* fix: await async check function in retryWithBackoff by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7539
* ci: consolidate workflows and add commitlint + husky hooks by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/7606
* Fix localized solfege labels by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7519
* ref basicblocks.js by @raisakshii in https://github.com/sugarlabs/musicblocks/pull/7599
* fix: resolve 21 ESLint eqeqeq warnings in IntervalsBlocks.js by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7618
* chore(deps-dev): bump undici from 6.25.0 to 6.27.0 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7608
* chore(deps-dev): bump tar from 7.5.15 to 7.5.16 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7609
* chore(deps-dev): bump form-data from 4.0.5 to 4.0.6 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7610
* refactor: extract toolbar execution controls into ToolbarController by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7622
* perf: optimize Logo execution engine (part 2) by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7617
* fix: resolve PitchStaircase audio continuing after close and silence on reopen by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7623
* fix: correct convertFactor typo 0.675 to 0.625 for 5/8 by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7627
* fix: prevent null DOM access in PitchDrumMatrix when closed during playback by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7632
* docs: fix broken Testing Guide link in test issue template by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7615
* fix: improve dark mode search and autocomplete visibility by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7598
* fix: correct 5 double-accidental entries in FIXEDSOLFEGE1 by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7626
* fix: resolve synth initialization bug by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7643
* test(rhythmruler): cover widget timer lifecycle helpers by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7649
* test(legobricks): cover row, segment, color, and pitch helpers by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7648
* Refactor/alert renderer by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7639
* fix: refactor remaining musicutils.js functions for dynamic EDO support by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7659
* refactor: extract visual toolbar classes to widgets/toolbar-ui by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7628
* fix: Visual feedback during pitchstaircase _playOne execution by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7596
* refactor: extract palette loading logic to PaletteLoader by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7669
* refactor(logo): complete dependency injection via LogoDependencies by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7670
* refactor: extract search logic to SearchController by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7667
* fix: improve keyboard shortcuts dialog visibility in high contrast mode by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7656
* Refactor: Update to strict equality (===) by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7592
* fix: correct major blues scale interval sum to 12 semitones by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7637
* fix: correct minor 7 interval ratio from 9/5 to 16/9 in INTERVALVALUES by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7638
* feat(pubsub): introduce lightweight synchronous PubSub module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7673
* fix: auto-follow OS theme changes via matchMedia listener by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/7480
* fix: resolve eqeqeq lint warnings in MeterBlocks.js by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7635
* fix: resolve exit wheel cursor mismatch in Add-Note submenu by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7665
* perf: optimize per-block execution overhead in runFromBlockNow by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7668
* fix: formatting of long lines by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7697
* fix: resolve Japanese Kana language switching and outputtools translation issues by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7684
* refactor(pubsub): migrate finishedLoading event to PubSub by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7679
* fix: prevent null label crash for outputtools in status widget by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7671
* refactor: remove obsolete legacy DOM code by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7698
* fix: pie submenu renders behind widget and clips off-canvas by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7688
* fix: resolve stuck notes and playback leaks in Music Keyboard widget by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7694
* fix: make exit slice click responsive in all pie submenus by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7690
* fix: translate outputtools and intervalname block labels by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/7686
* fix: replace innerHTML with secure DOM creation in modewidget.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7695
* Added a feature to preview the block in trash can which you want to restore by @Suyash-ka-github in https://github.com/sugarlabs/musicblocks/pull/6952
* refactor(search): extract UI methods from SearchController into Search Widget  by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7700
* fix: make search box text visible in dark/high contrast modes by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7629
* cleanup: remove dead duplicate _findBlocks method in activity.js by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7616
* feat: add aria-live region for textMsg and errorMsg announcements (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7674
* refactor: extract embedded graphics scheduler from Logo by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7705
* refactor(logo): simplify constructor via LogoDependencies.fromActivity by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7709
* refactor(logo): improve interpreter readability and JSDoc by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7712
* fix: guard against non-number ratios in checkTemperament (Temperament widget) by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7662
* fix(intervals): replace hardcoded 12/21 with temperamentLength in Get& by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7710
* fix: Replace innerHTML with DOM API in modewidget.js for security by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7640
* fix: _codeToBlocks swallowed AST conversion errors by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7607
* fix: resolve calcOctave returning undefined for equal-distance octave transitions by @7se7en72025 in https://github.com/sugarlabs/musicblocks/pull/7593
* fix: use strict equality in SugarAnimation.js loop guard by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7529
* fix: replace non-null loose equality with strict equality across 7 files by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7614
* perf(blocks): spatial grid for O(1) nearest-dock lookup on block drop by @YASHSHARMAOFFICIALLY in https://github.com/sugarlabs/musicblocks/pull/7207
* remove temporary plugin loader scripts from document.head after execution by @sahu-virendra-1908 in https://github.com/sugarlabs/musicblocks/pull/7389
* fix(pitchstaircase): restore project master volume on widget close (Fixes #7664) by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/7666
* docs: document role growth process by @vyagh in https://github.com/sugarlabs/musicblocks/pull/7676
* fix: replace unsafe innerHTML with textContent for clearing elements by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7603
* fix: resolve musickeyboard clicks desync and connection crashes by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7701
* ref: hoist DOM element queries outside loop by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7619
* Fix trackpad/mouse-wheel scrolling in Music Keyboard widget by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7715
* fix: correct solfege note parsing and multi-octave gap filling in Music Keyboard by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7713
* fix: microphone stays active after closing Sampler widget mid-recording/tuning by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7708
* fix: handle {ratio,cents} objects in TemperamentWidget.checkTemperament by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7689
* fix: replace invalid className removal with classList.remove in turtle.js by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7707
* fix: reduce block zoom step size by @Himani78116 in https://github.com/sugarlabs/musicblocks/pull/7704
* fix: replace unsafe innerHTML with textContent for clearing elements by @faratabassum09-a11y in https://github.com/sugarlabs/musicblocks/pull/7699
* fix: add missing radix parameter to parseInt calls across js/ by @srajang1805 in https://github.com/sugarlabs/musicblocks/pull/7613
* fix(grid): call setupGridController before new Turtles to restore doGrid by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7718
* perf: replace setTimeout scheduling with Tone.Transport for playback by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7703
* fix: visual play/stop toggling and stop-on-click for PitchStaircase play buttons by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7719
* fix: preserve GIF animation and prevent getBounds null crash by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7720
* fix: close pie menus on first canvas click by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7547
* refactor: Modernize codebase with e.key and Math.hypot by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7594
* fix: round dock coordinates to prevent block docking misalignment at fractional scale by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7725
* fix: use justLoadStart instead of removed _loadStart in newProject by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7722
* fix(musicutils): correct typo in convertFactor - 0.675 should be 0.625 (5/8) by @Harshit-Mishra2212 in https://github.com/sugarlabs/musicblocks/pull/7460
* Add unit tests for recorder module by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7650
* Fix local storage bug on Reflection API error by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7644
* fix(highcontrast): Fix multiple invisible UI elements in High Contrast mode by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7625
* fix: preserve numeric action names when importing Turtle Blocks projects by @thribhuvan003 in https://github.com/sugarlabs/musicblocks/pull/7731
* test: add idle watcher unit tests by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7729
* perf: optimize turtleCount using Int32Array by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7730
* fix: resolve Lego Bricks playback crash and button toggle freeze by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7732
* fix: skip trailing Turtle Blocks metadata entries when loading .tb projects by @thribhuvan003 in https://github.com/sugarlabs/musicblocks/pull/7727
* fix: About tour image clipping on mobile devices by @severe77 in https://github.com/sugarlabs/musicblocks/pull/7728
* fix: resolve Temperament widget crashes and play loop regressions by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7734
* fix: action palette now refreshes instantly on action block rename by @patilpratik1905 in https://github.com/sugarlabs/musicblocks/pull/7687
* fix: correct ManagedTimer require destructuring in logo.js by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7737
* test: add unit tests for exporters.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7692
* test: add unit tests for grid-renderer.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7693
* fix: prevent Oscilloscope canvas memory leak from live HTMLCollection iteration by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7740
* fix: resolve arpeggio widget playback leak on close or stop by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7739
* fix: remove undeclared event reference in Activity loadStart handler by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7741
* test: add tests for PluginDialog by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7743
* feat: announce block drag to screen readers via aria-live (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7744
* feat: add Ctrl+Space keyboard shortcut to open search widget (fixes #7631) by @faratabassum09-a11y in https://github.com/sugarlabs/musicblocks/pull/7660
* fix: guard localStorage access in RhythmBlockPaletteBlocks by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7747
* fix: replace all newlines, not just first, when cleaning HTML-imported project data by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7749
* fix: clean up plugin setup script tags by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7750
* test(logo): improve unit test coverage for Logo execution engine by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7746
* fix: display actual error text instead of placeholder by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7755
* test: improve unit test coverage for legobricks.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7733
* perf: cull off-screen blocks from display list to reduce stage.update() cost by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7738
* Refactor/project manager by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7754
* test(musickeyboard): cover row, layout, and note-editing helpers by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7647
* test(pitchstaircase): expand widget test coverage by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7646
* test: expand oscilloscope widget test coverage from 76% to 95% by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7605
* Fix color sensor background parsing for hex themes by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7752
* fix(tests): resolve post-merge test regressions from #7646 and #7647 by @Ashutoshx7 in https://github.com/sugarlabs/musicblocks/pull/7766
* Refactor/workspace layout controller by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7768
* fix: avoid redundant delay and callback on last failed retry attempt by @MatrixNeoKozak in https://github.com/sugarlabs/musicblocks/pull/7756
* feat: add reusable announceToScreenReader helper and refactor block.js (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7764
* Introduce ProtoBlock capability metadata foundation by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7726
* Add unit tests for inactivity tracking and auto-saving by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7645
* fix: replace innerHTML with textContent across core widgets for security by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7757
* fix: report divide-by-zero on mod block instead of Not a Number by @rish106-hub in https://github.com/sugarlabs/musicblocks/pull/7760
* refactor(legobricks): remove duplicate color-family helper definitions by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7651
* feat: announce block name when sent to trash via aria-live region (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7753
* fix: resolve ReferenceErrors in Sampler, Tuner, and TurtleActions by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7774
* fix: route portamento notes through setNote path, not fast-path triggerRelease by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7758
* fix: action block rename now updates canvas blocks and opens palette correctly by @patilpratik1905 in https://github.com/sugarlabs/musicblocks/pull/7772
* test: add unit tests for planet/js/GlobalTag.js by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7087
* test: add unit tests for GlobalCard by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7236
* test: add unit tests for retryWithBackoff by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7446
* test: add unit tests for Publisher by @sapnilbiswas in https://github.com/sugarlabs/musicblocks/pull/7234
* fix: handle stopped Transport clock and past-time scheduling by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7776
* Refactor/keyboard controller by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7761
* fix(bug): temporarily fix toolbar regression by @pikurasa in https://github.com/sugarlabs/musicblocks/pull/7782
* fix(i18n): fix machine converted kana from Hiragana to Katakana by @pikurasa in https://github.com/sugarlabs/musicblocks/pull/7784
* feat: forward cents from custom pitch blocks and make always-visible by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7770
* refactor: migrate NOHIT classification to capability metadata by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7775
* Refactor/selection controller by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7765
* fix: restore bulk Delete and Duplicate in the helpful wheel by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/7799
* fix: ensure save filename is not empty string by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7800
* docs: remove outdated keyboard shortcut for note block creation by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7803
* fix: hover help for grid piemenu by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7796
* feat(temperament): wire active temperament through synthesis pipeline by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7807
* refactor(activity): extract trash controller from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7818
* chore: update formatting and CSS tooling dependencies by @severe77 in https://github.com/sugarlabs/musicblocks/pull/7806
* fix: guard localStorage access in ProjectStorage.port() by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7804
* refactor(activity): extract help controller from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7819
* refactor(activity): extract block scale controller from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7820
* fix: run stop callbacks and clear sounds on natural completion by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7832
* refactor(activity): extract context menu controller from activity.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7821
* chore(deps-dev): bump systeminformation from 5.31.6 to 5.31.17 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7828
* refactor(blocks): extract block-related constants into block-constants.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7838
* refactor(blocks): extract connection validation into connection-validator.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7839
* fix: dispose previous Tone.Analyser in LiveWaveForm to prevent audio node leak by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/7843
* refactor: migrate note blocks to capability metadata by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7849
* refactor(blocks): extract block dragging into block-drag-controller.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7840
* chore(lint): remove deprecated eslint-env comment from ManagedTimer.test.js by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7814
* perf: hoist temperament menu layout logic outside of loop by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7830
* fix: add radix parameter to remaining parseInt calls in search and phrasemaker by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7852
* refactor: remove dead commented-out audio trimmer code from sampler.js by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7779
* test(blocks): add unit tests for block-constants.js by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7851
* test(planet): add unit tests for main.js by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7850
* docs: clarify draft PR and review etiquette in CONTRIBUTING.md by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7854
* refactor(utils): extract DOM helpers from utils.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7857
* fix: separate runtime cleanup from visual reset by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7848
* fix: add missing arg method to CalcBlock by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7792
* perf: skip updateCache and markStageDirty for off-screen blocks by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7815
* test(plugin): add invalid json test for processPluginData by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7847
* refactor(toolbar): extract FocusCycleManager from toolbar-ui.js into its own module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7856
* test(rhythm): define setupBlockDragController in RhythmBlocks harness by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7855
* fix: named-calc-blocks by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7866
* refactor(utils): extract browser detection helpers into browser-utils.js by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7858
* ci(lighthouse): run audit as pull_request so fork PRs can be checked out by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7862
* refactor(logo): centralize performanceTracker accessor to remove repeated guards by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/7871
* fix: regression in using note blocks in phrasemaker by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7874
* test(utils): add tests for base64Utils large payloads and ErrorHandler exception handling by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7886
* refactor: migrate SPECIALINPUTS to ProtoBlock capability metadata by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7879
* fix: tag cells from notes with duplicate pitches by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7881
* test: add regression test for ratioEdit division-by-zero guard (#6978) by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/7902
* Fix/keyboard accessible notification close buttons by @faratabassum09-a11y in https://github.com/sugarlabs/musicblocks/pull/7791
* fix: guard this.container in block.hide and block.show to prevent null TypeError by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/7895
* test(retryWithBackoff): prevent fake timer leak using try/finally by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7816
* fix: improve contrast of persistentNotification banner for WCAG AA (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7896
* chore: centralize music constants by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7808
* feat(widgets): attach dependency metadata to PhraseMaker widget definition by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7919
* perf: suppress intermediate refreshCanvas calls during project loading by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7923
* fix(phrasemaker): refresh matrix after pitch block updates by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7927
* fix: guard against missing language dropdown elements in toolbar by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7901
* refactor: migrate PIEMENUS to capability metadata by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7916
* Feat/consume widget dependency metadata by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7920
* fix: support non-12 EDO temperaments in audio engine and widgets by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7835
* chore: fix high-severity production vulnerabilities via overrides by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/7905
* test: introduce structured test infrastructure and refactor palette tests for deterministic CI by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/6368
* feat(temperament): foundational ratio data, dynamic consonant stepping, and temperament length block by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7853
* chore: Fix ESLint `eqeqeq` Warnings Across the Codebase by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7883
* Feat/unify widget loading by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7928
* Add label-sync workflow for meaningful issue label colors by @faratabassum09-a11y in https://github.com/sugarlabs/musicblocks/pull/7914
* fix(widgets): eliminate duplicate init() in status and reflection blocks by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7932
* Refactor: Migrate ARG_LIKE_BLOCKS to argumentLike capability metadata by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7934
* fix: resolve execution-depth leak in iteration-budget guard by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7935
* feat(temperament): support dynamic EDO and ratio-based temperaments by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7942
* refactor: remove dead doPaste submit button by @rakesh-vajrapu in https://github.com/sugarlabs/musicblocks/pull/7930
* fix(browser-utils): correct Edge and Opera browser detection in fnBrowserDetect by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7878
* fix(trash-controller): add null check for helpfulWheelDiv in restoreTrash methods by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7900
* refactor(widgets): defer TemperamentWidget DOM creation to init() by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7933
* refactor(rhythmruler): split init() and remove internal duplication by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7949
* refactor(musickeyboard): split init() and remove internal duplication by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7951
* fix: stop note counter from eating the rest of the program by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7956
* fix: resolve PhraseMaker note division crash by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/7958
* feat(musicutils): decouple scale/mode math from 12-EDO by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7959
* refactor: centralize Turtle/Music release configuration by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/7908
* ci: automate CHANGELOG and versioning with release-please by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/7964
* refactor(timbre): extract shared DOM/state helpers to shrink widget by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7960
* refactor(legobricks): split init() and remove internal duplication by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7963
* fix(phrasemaker): correct isInitial typo, drop dead field, dedupe lastConnection guard by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7971
* refactor: migrate collapsible blocks to capability metadata by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/7950
* refactor(temperament): extract shared helpers to cut duplication by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7965
* fix: headless fast-run path for notation exports by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7970
* feat: thread EDO through derived scale helpers by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7986
* fix: prevent notes from firing twice with "On every note do" by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/7946
* feat(edo): wire EDO temperament consumers and fix scalar transposition by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/7991
* fix: resolve remaining axe violations (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/7988
* fix(i18n): correct Hindi translations by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7751
* chore: fix high-severity nanoid vulnerability via overrides by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7989
* refactor: migrate PITCHBLOCKS to soundSpecifier capability by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/8004
* test(dictactions): add missing tests Coverage for DictActions by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7846
* fix(deps): resolve electron rebuild Node engine mismatch by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/7973
* docs(deps): document electron rebuild version override by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8012
* refactor: optimize temperament widget menus and fix duplicate IDs by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7824
* fix: reload disposed instruments on trigger so drums play on 2nd run (Fixes #7996) by @Yatharth6494 in https://github.com/sugarlabs/musicblocks/pull/7999
* fix: guard null buttoncontainerBOTTOM in showMusicBlocks (#7995) by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7997
* fix(camera): centralize interval/listener lifecycle in CameraManager (Refs #7868) by @palakbhati in https://github.com/sugarlabs/musicblocks/pull/7876
* docs: add touch support audit report for block dragging (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8014
* test(turtleactions): add input validation guards and tests for OrnamentActions by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8011
* chore: refresh code ownership paths by @vyagh in https://github.com/sugarlabs/musicblocks/pull/7955
* test: add tests for _parse_pitch_string in musicutils by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7980
* fix(i18n): map enUS/enUK to their locale files by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7987
* fix: halt doVibrato when intensity or rate validation fails by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/7922
* #7400 | fix(synth): route effects cleanup through ManagedTimer by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/7788
* feat: combined improvements (debugLog refactor, search debounce, safer DOM methods) by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7781
* refactor(piemenus): extract piemenuBlockContext into its own module by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8016
* refactor: use inlineCollapsible capability for block checks by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8009
* fix: reattach pitch args after extraction by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/8019
* refactor: migrate WIDENAMES to wideLabel capability by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8010
* refactor(pitchdrummatrix): extract duplicated play-button icon construction by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/7990
* refactor: remove dead _enqueue param from playNote by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/8026
* fix: add silence block when extracting last pitch by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/8021
* refactor(timbre): fix type comparisons and extract redundant parses by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7817
* fix(sampler): dispose Tone.Analyser nodes on close and prevent file listener accumulation by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/7977
* Fix: missing i18n wrappers by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8025
* fix: add space to user-facing string by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8031
* feat: add new examples for polyrhythms and EDO tests by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8032
* fix: halt doChorus, doTremolo, doDistortion when depth/distortion validation fails by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/7979
* chore: remove dead idle watcher code by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8023
* fix(turtleactions): halt synth definitions in ToneActions on oscillator conflict by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8024
* fix(synth): stop custom timbre from disposing the default voice by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7938
* fix: release getDisplayMedia tracks in recordScreenWithTools by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/7941
* test: add unit tests for test infrastructure helpers in test/utils by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7944
* fix: touch listeners stacking on canvas when horizontal scrolling is toggled by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/7994
* refactor(platformstyle): remove dead header color ternary by @severe77 in https://github.com/sugarlabs/musicblocks/pull/7945
* fix(turtle-singer): detect empty weighted-partials clamp correctly by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/8000
* fix(pitch-actions): apply accidental fallback instead of early return by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7982
* fix: add typeof guard for MusicBlocks in RhythmActions and PitchActions by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/8033
* fix: stop button audio in pitch staircase by @Yatharth6494 in https://github.com/sugarlabs/musicblocks/pull/7811
* fix: disconnect and dispose Tone.Analyser in stopTuner to prevent audio node leak by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/7873
* fix: dispose Tone.Analyser nodes in oscilloscope close to prevent audio leak by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/7861
* fix(utils-logic): support leading hash prefix and sanitize input in hex2rgb by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7887
* refactor: dedupe theme color tables; read from platformThemes by @AbdulWasih05 in https://github.com/sugarlabs/musicblocks/pull/7190
* test(stryker): add mutation testing infrastructure by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8034
* feat(utils): add shorthand 3-digit hex color support to hexToRGB by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8044
* test(stryker): improve mutation testing scalability by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8042
* fix(bug): resolve piemenuNumber bounds and rotation bugs by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8041
* test(IntervalsActions): improve mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8045
* test: add unit tests and null safety guards for releaseconfig.js by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7992
* fix: correct sign when computing fractional dot values in doRhythmicDot by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/7892
* fix: handle disconnected Meter Widget beat input by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8007
* fix: correct Music Blocks guide URL by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8046
* feat(utils): add clampNumber utility to utils-logic by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8050
* fix: update guide URLs by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8052
* refactor: use clampNumber utility across audio, widget, and dialog components by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8053
* fix(synthutils): dispose distortion node after note cleanup by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/8051
* Fix crash when loading a text block valued __proto__ in Blocks.loadNewBlocks by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8040
* refactor: simplify TimbreWidget loops by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7885
* refactor(controller): add widgetWindows null safety guards to KeyboardController by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8017
* fix: prevent Arpeggio preview crash with empty notes by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8005
* fix(utils): add null safety guards to canvasPixelRatio by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7974
* perf: replace array for...in loops with for...of loops by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8043
* feat(utils): add shorthand hex and alpha support to hex2rgb by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8054
* fix(piemenus): close pie menu when clicking outside by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8049
* fix: keep play-only widgets above toolbar by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8003
* fix(security): guard plugin loading against prototype pollution via for...in by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/7952
* perf(blocks): skip unchanged parameter block redraws by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8056
* test(turtleactions): improve RhythmActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8048
* refactor: extract HTTP utilities into dedicated module by @severe77 in https://github.com/sugarlabs/musicblocks/pull/7926
* refactor: use clampNumber utility in turtle-painter and meterwidget by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8060
* fix: cancel scheduled rhythm notes when stopping by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8055
* fix(temperament): guard DOM element access in play loop and deduplicate edit click listener by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8036
* fix(utils): guard updatePluginObj loops against missing plugin sections by @ssz2605 in https://github.com/sugarlabs/musicblocks/pull/8065
* fix: declare totalBeats in Tuplet4Block to prevent ReferenceError by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7748
* fix(trash): prevent crash when restoring action block with no argument by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7823
* fix: clear pending playback timeouts on Pitch Staircase close by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/7805
* fix: remove async lock polling in Duplicate and Arpeggio flows (Fix #6882) by @gcharpe1604 in https://github.com/sugarlabs/musicblocks/pull/6883
* fix: correct pitch block placeholder restoration when slots are empty by @zealot-zew in https://github.com/sugarlabs/musicblocks/pull/7310
* test(toolbar): add exhaustive test coverage for ToolbarController by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7845
* fix: guard blk access in defineMode listener to prevent TypeError on & by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/7889
* chore(deps): bump body-parser from 2.2.2 to 2.3.0 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7875
* perf(startup): lazy-load optional widget modules by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8088
* feat: add aria-label to toolbar buttons for screen reader support (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8096
* fix(search): apply autocomplete dropdown position fix at widget init instead of polling by @ManuelFCastillo in https://github.com/sugarlabs/musicblocks/pull/8099
* feat(widget): pitchslider reset frequency button by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8094
* refactor(activity): unify idle watcher ownership by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/8058
* test(turtleactions): improve PitchActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8071
* refactor(widgets): add null safety for meter block connections in meterwidget by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8093
* feat(utils): add isValidHex utility function to utils-logic by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8061
* docs: improve PR title guidance by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8095
* fix(meterwidget): restore master volume on close and prevent TypeError during beat playback by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8028
* perf: cache DOM queries to resolve UI lag in widgets by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8075
* ci: add DCO check for pull requests by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/8092
* refactor: move block-scale-controller to activity folder by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8089
* fix(activity): clean up helpful wheel listeners by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8064
* refactor: move block-drag-controller to activity folder by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8105
* fix: allow stand-alone drum blocks under Start to play by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/7827
* test(utils): add unit test suite for retryWithBackoff utility by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8086
* refactor(widgets): add bounds clamping & fix ReferenceError in pitchstaircase by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8084
* test: add memory tracking unit test to performanceTracker.test.js by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7957
* refactor(widgets): add stepFrequency helper & clamping to pitchslider by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8083
* fix(phrasemaker): prevent Uncaught ReferenceError: activity is not defined during lyric playback by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8098
* test(dom-helpers): add unit test coverage for DOM queries, hideDOMLabel, and closeWidgets by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7915
* test(turtleactions): strengthen DrumActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8109
* test(turtleactions): improve ToneActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8087
* test: add unit tests for _createCache and updateCache in block and turtle by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7937
* test: add coverage for CameraManager and announceToScreenReader utilities by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8076
* feat(test) : expand retryWithBackoff edge cases and coverage by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8029
* fix: event listener leak in helper.js by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7975
* chore: add local DCO validation by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8119
* feat: add health endpoint and graceful shutdown by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/7962
* refactor(utils): add null and property guards to dom-helpers by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/7998
* test(turtleactions): add input validation guards and tests for RhythmActions by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8030
* fix: resolve window focus hijacking in widgetWindows by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8111
* test(pitchdrummatrix): cover block, node, and save-lock methods by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7654
* refactor(activity): remove redundant Touch.enable call by @nodeanurag in https://github.com/sugarlabs/musicblocks/pull/8126
* chore: add default and specialized pull request templates and support& by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8120
* fix: use last() to read neighborNoteValue stack in playNote listener by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/8068
* fix(loader): prevent timeout on slow startup (#8070) by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8073
* fix(widgets): initialize getElement and add null safety in musickeyboard by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8101
* fix: crash when a block's type name collides with an inherited Object.prototype key by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8107
* refactor: migrate keyboard-controller to activity directory by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8113
* refactor: migrate trash-controller to activity directory by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8115
* fix(blocks): add null guard for hideContents.click() in sendStackToTrash by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/7903
* ci: enable GitHub-generated release notes for contributor credit by @sonalgaud12 in https://github.com/sugarlabs/musicblocks/pull/8133
* fix: prevent event listener leaks on ProjectViewer re-init by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/7931
* perf: remove abcjs from vendor bundle by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8136
* feat(widgets): add Octave Shift Move Up and Move Down buttons to Arpeggio widget by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8108
* docs: add guide for shared test infrastructure by @mahesh-09-12 in https://github.com/sugarlabs/musicblocks/pull/7943
* test: add unit tests for widgetWindows shortcuts, focus, and visibility by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8118
* test(timbre): cover timer fallback, _changeBlock branches, and duosynth params by @singhharsh1708 in https://github.com/sugarlabs/musicblocks/pull/7652
* test(turtleactions): strengthen MeterActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8138
* test(turtleactions): strengthen OrnamentActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8142
* test(turtleactions): strengthen DictActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8144
* feat(turtleactions): add volume bounds clamping and validation to VolumeActions by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8081
* test(piemenus): strengthen piemenuBlockContext mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8145
* fix(musickeyboard): handle pitch row addition for Hertz-only and empty layouts by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/7904
* chore(deps-dev): bump fast-uri from 3.1.2 to 3.1.5 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7967
* refactor: migrate help-controller to activity directory by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8114
* fix: request the right locale file for enUS, enUK and zhCN by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8104
* fix(widgets): add tooltip title to widget window maximize and restorebutton by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8130
* fix(ui): pin the bottom-right canvas buttons to the viewport corner by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8132
* fix: add keyboard access to toolbar and widgets by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8066
* fix: crashes when a corrupted connection index points past the end of blockList by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8135
* fix(pitchstaircase): clear pending timers and prevent detached DOM exceptions on widget close by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8103
* fix: dispose mic/recorder in recording to prevent Tone.js leaks (Fixes #7917) by @shivv23 in https://github.com/sugarlabs/musicblocks/pull/7918
* fix: remove copied BPM validation from Tempo tests by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/7120
* test(turtleactions): strengthen IntervalsActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8158
* test(turtleactions): strengthen RhythmActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8157
* test(turtleactions): strengthen VolumeActions mutation coverage by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8156
* test(blocks): add comprehensive unit test coverage for GraphicsBlocks by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8148
* feat: add dialog semantics to all three modals for screen readers (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8159
* feat: announce previewed note to screen readers (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8079
* fix: guard against undefined lowestNote/highestNote in stats widget (#8155) by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/8160
* fix(activity): configure touch support on initialization by @faratabassum09-a11y in https://github.com/sugarlabs/musicblocks/pull/8131
* feat(utils): add safeNumber utility function to utils-logic by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8077
* refactor: migrate context-menu-controller to activity directory by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8117
* test(logo): cover pitch block dispatch through the real Logo interpreter by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8166
* fix: stop status updates after widget closes by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8162
* feat: announce block connection to screen readers (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8078
* fix(phrasemaker): correct tuplet value controls by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8182
* fix: prevent status widget crash when turtle is added by @Chaitu7032 in https://github.com/sugarlabs/musicblocks/pull/8180
* fix: prevent duplicate export extensions when casing differs by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8185
* fix(rhythmruler): prevent TypeError when reading drum block connection by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8164
* fix(legobricks): prevent duplicate event listener accumulation in eye dropper mode by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8179
* test(logo): cover meter block dispatch through the real Logo interpreter by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8186
* test(logo): cover scalar interval dispatch lifecycle by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8172
* test(logo): cover volume articulation dispatch through the real Logo interpreter by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8167
* fix: resolve helpWidgetID contrast violation via design tokens (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8170
* fix(musickeyboard): clear Web MIDI input listeners on widget close to prevent memory and audio leaks by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8188
* fix(turtle-singer): reset delayedNotes for zero-duration tied notes by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8177
* fix: correct CSS styling on PitchDrumMatrix play/stop icons by @hazelr125 in https://github.com/sugarlabs/musicblocks/pull/8063
* fix: prevent duplicate trashcan resize listeners by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8174
* fix(pitchslider): dispose preview synths when closing widget by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8191
* fix: prevent pitch analyser leak during AIWidget initialization by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8151
* fix(pitch-actions): recompute inverted flag on Invert clamp close by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8193
* fix: break circular references on block stack deletion by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8171
* fix(planet): skip clear-workspace confirmation when loading projects from Planet by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8154
* refactor(pitch-actions): remove redundant inverted flag, use invertList directly by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8195
* fix(a11y): give #mb-logo a button role so its aria-label is valid (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8196
* feat(a11y): give widget windows dialog semantics and an accessible name (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8197
* fix(a11y): stop widget titlebar tab order diverging from visual order on mobile (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8198
* feat(utils): add toArray utility helper function to utils-logic by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8067
* fix: resolve Lego Bricks widget failing to close on trash by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/8149
* feat(a11y): add aria-describedby to the New Project confirmation buttons (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8211
* fix(drum-actions): scope Set Drum's pitchDrumTable cleanup to its own clamp by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8200
* fix(abc): preserve octave in notation export by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8194
* fix(block): detach container from parent on disposal by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8207
* fix: resolve Chrome plugin CSP errors by stripping Function('return this')() by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/8140
* fix(logo): keep the drawing on screen when a run is stopped by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8209
* feat(widgets): add Refresh button to Statistics widget toolbar by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8141
* fix: correct wait-for turtle timing by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8210
* fix: highlight stop icon on start block click (all click paths) by @santhosh-7777 in https://github.com/sugarlabs/musicblocks/pull/8219
* feat(utils): add formatSeconds duration formatting utility function by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8080
* fix:  record button layout by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8220
* refactor: move closeBlkWidgets to widgetWindows.js by @KeerthiKumarR in https://github.com/sugarlabs/musicblocks/pull/8213
* refactor(mode-widget): overhaul scalar builder UI and multi-EDO state sync by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/8059
* perf(startup): drop dead boot scripts and stale abc preload by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8150
* fix(a11y): expose announceToScreenReader on window explicitly (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8226
* fix(logo): ensure previous mic stream is closed before opening a new one by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8236
* fix(lilypond): preserve staccato in tuplet export by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8222
* fix(widgets): reset the button list when a widget window is cleared by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8234
* fix(widgets): set collection flags only after Phrase Maker and Lego Bricks finish lazy loading by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8169
* fix: add ManagedTimer to MusicKeyboard for proper widget cleanup by @Noaman-Akhtar in https://github.com/sugarlabs/musicblocks/pull/6936
* test(logo): cover tone timbre dispatch through the real Logo interpreter by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8202
* fix(activity): prevent crash when scaling blocks via keyboard or scroll without open context menu by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/8237
* fix(pitch): apply accidental from scale degree block to played pitch by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8239
* refactor: replace innerHTML with programmatic DOM element creation in& by @JituRewar in https://github.com/sugarlabs/musicblocks/pull/8243
* fix: replace SVG record button with Material Icons to resolve textContent regression by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/7884
* fix(a11y): enable wheelnav's built-in keyboard navigation on all pie menus (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8227
* docs: propose an accessible mirror-DOM approach for the programming canvas (#6608) by @abhnish in https://github.com/sugarlabs/musicblocks/pull/8212
* test(logo): add ornament and dict dispatch integration tests by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8245
* test(musickeyboard): fix docById mock missing remove(), unblocking CI by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8250
* perf(lilypond): use Set for occupiedShortNames lookup in lilypond.js by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8165
* test(svgAssetSelector): expand unit test coverage for modal interactions and callbacks by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8256
* fix(block-scale): disable smaller-blocks icon only at the minimum scale by @gouravj25551-afk in https://github.com/sugarlabs/musicblocks/pull/8253
* fix(help): enable wheel scrolling in keyboard shortcuts by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8251
* [Bug fix] Single click unmaximize instantly bug by @castorNova2 in https://github.com/sugarlabs/musicblocks/pull/7032
* fix(turtleactions): fix painter property mismatches in DictActions by @Ayush78516 in https://github.com/sugarlabs/musicblocks/pull/8261
* test(cypress): add E2E test loading a real project (examples/pi.tb) by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8260
* test(musickeyboard): add test suite for note duration rounding and key handlers by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8257
* chore(deps-dev): bump electron from 40.8.5 to 41.10.3 by @dependabot[bot] in https://github.com/sugarlabs/musicblocks/pull/7984
* feat(music): non-EDO temperament hardening, scalar step mode-following, and unified key pie menu by @021nirav-blip in https://github.com/sugarlabs/musicblocks/pull/8240
* test(cypress): cover Phrase Maker and Rhythm Maker workflows by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8267
* test(cypress): add E2E test for project persistence across reload by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8263
* test(activity): cover Activity-ProjectManager wiring through real construction by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8246
* refactor(widgets): consume formatSeconds for total duration formatting by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8224
* test(cypress): cover JavaScript editor and block search workflows by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8269
* test(cypress): cover palette-to-canvas block drag-and-drop workflow by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8270
* perf(rubrics): optimize palette index lookup using Map in analyzeProject by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8262
* fix(blocks): handle external connections when copying nested blocks by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8258
* fix: avoid closure scope leaks in MeterActions queue listeners by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8244
* fix(darkmode): dark mode scrollbar styling and search autocomplete active item contrast by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8278
* test(cypress): cover MIDI and LilyPond export workflows by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8272
* test(synth): verify Tone.js Transport wrapper and playback clock state by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8274
* fix(arpeggio): restore master volume on widget window close by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8280
* fix(boxes): correct solfege wraparound using modular arithmetic by @uday-2304 in https://github.com/sugarlabs/musicblocks/pull/8282
* fix(search-ui): prevent search autocomplete dropdown dismissal on scrollbar click by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8284
* fix(darkmode): dark mode header and table text styling for floating widgets by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8266
* chore(CODEOWNERS): Add Vanshika to test infra by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8285
* fix: propagate Planet initialization failures by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8218
* docs: add CI pipeline documentation (Related to #6153) by @Piyushrathoree in https://github.com/sugarlabs/musicblocks/pull/8175
* fix(sampler): configure AI sample endpoint by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8128
* fix: use Blob URLs for HTML exports by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8127
* fix(phrasemaker): correctly map marked columns for duplicate pitches in sort by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8100
* feat(ast): add deterministic module test-plan extractor by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8275
* fix(piemenus): add guards to interval selector and add unit test coverage by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/7969
* test: expand unit test coverage for utils.js (Related to #7038) by @xtroon in https://github.com/sugarlabs/musicblocks/pull/8143
* fix(project-storage): stop swallowing save failures, show quota warning by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/7948
* docs: record Vanshika's area approver role by @vyagh in https://github.com/sugarlabs/musicblocks/pull/8287
* fix(meterwidget): guard against a disposed meter block in blockList by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8283
* fix(timbre): prevent TypeError when updating timbre params after block disposal by @yush-1018 in https://github.com/sugarlabs/musicblocks/pull/8294
* fix(oscilloscope): guard against double-disposal of Tone.Analyser nodes in close() by @dhruvpatil972 in https://github.com/sugarlabs/musicblocks/pull/7882
* fix(abc): resolve incorrect octave exports for C5-B5 and C10 by @guptadi0406-alt in https://github.com/sugarlabs/musicblocks/pull/8216
* fix: broken tie in Rainbow Connection by @walterbender in https://github.com/sugarlabs/musicblocks/pull/7790
* test(cypress): add floating widget window E2E lifecycle test suite by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8306
* ci: replace hard-coded coverage thresholds with base-branch delta check by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/8153
* chore: correct Vanshika's ownership areas by @vyagh in https://github.com/sugarlabs/musicblocks/pull/8311
* ci: add a pull request dashboard by @vyagh in https://github.com/sugarlabs/musicblocks/pull/8296
* fix: avoid Node global in browser pitch previews by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8277
* test(cypress): cover custom mode persistence across reload by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8271
* fix: cancel pitch drum timers on widget close by @severe77 in https://github.com/sugarlabs/musicblocks/pull/8297
* test(cypress): verify real note dispatch on a loaded project playback by @vanshika2720 in https://github.com/sugarlabs/musicblocks/pull/8273
* docs: fix README step numbering (Related to #8299) by @s1dhu98 in https://github.com/sugarlabs/musicblocks/pull/8300
* test(cypress): add dark mode E2E integration test suite by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8290
* fix(abc): load abcjs through RequireJS so window.ABCJS is defined by @rakshityadav1868 in https://github.com/sugarlabs/musicblocks/pull/8304
* fix: add missing trashcan bottom boundary check by @patilpratik1905 in https://github.com/sugarlabs/musicblocks/pull/8315
* feat(sampler): add fallback resolution and query override for AI endp& by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8314
* fix: improve JA translation files by @pikurasa in https://github.com/sugarlabs/musicblocks/pull/8015
* i18n: update ja locales by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8320
* feat: register keydown listener in _initGlobalListeners for keyboard & by @guptadi0406-alt in https://github.com/sugarlabs/musicblocks/pull/8319
* fix: resolve TypeError in Rhythm Ruler subdivision limit by @DivyanshuVortex in https://github.com/sugarlabs/musicblocks/pull/8317
* test: close remaining branch coverage gaps in turtle-painter.js by @UtkarshAnandd in https://github.com/sugarlabs/musicblocks/pull/8353
* i18n: machine translation of new strings by @walterbender in https://github.com/sugarlabs/musicblocks/pull/8321
* fix(project-manager): hoist finishLoading to fix import error paths by @NAME-ASHWANIYADAV in https://github.com/sugarlabs/musicblocks/pull/8330
* fix: guard lastNotePlayed null in MyPitchBlock.setter by @guptadi0406-alt in https://github.com/sugarlabs/musicblocks/pull/8333
* fix: handle save stack context menu index collision by @kartikktripathi in https://github.com/sugarlabs/musicblocks/pull/8335
* fix: wire ast2blocklist_config_ready promise to script onload (Relate& by @guptadi0406-alt in https://github.com/sugarlabs/musicblocks/pull/8346
* test(cypress): cover Music Keyboard widget launch and UI lifecycle by @Sumanthvu in https://github.com/sugarlabs/musicblocks/pull/8308
* refactor(darkmode): consume design tokens for trash view styling by @karankumar1106 in https://github.com/sugarlabs/musicblocks/pull/8288
* refactor(arpeggio): replace platformColor calls with CSS design tokens by @lavjeetrai in https://github.com/sugarlabs/musicblocks/pull/8360
* fix: remove leaked stylesheet links on JSEditor close by @guptadi0406-alt in https://github.com/sugarlabs/musicblocks/pull/8327
* fix(a11y): restore Tab focus cycling broken by a display/visibility mismatch by @netram75 in https://github.com/sugarlabs/musicblocks/pull/8355
* chore: add coderabbit configuration file with custom checks by @Jetshree in https://github.com/sugarlabs/musicblocks/pull/8206
* fix(blocks): release isBlockMoving when a drag ends any other way by @netram75 in https://github.com/sugarlabs/musicblocks/pull/8363
* fix(pitch): initialize duration before first note by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8328
* fix: preserve track-specific MIDI percussion notes by @macayu17 in https://github.com/sugarlabs/musicblocks/pull/8351
* fix(jseditor): remove stylesheet links on close to stop them leaking into document.head by @bhuvan-somisetty in https://github.com/sugarlabs/musicblocks/pull/8329
* fix(block): prevent cache updates when bitmapCache is missing by @Abhishek-Sonje in https://github.com/sugarlabs/musicblocks/pull/8324

## New Contributors
* @abhnish made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5567
* @lakshay776 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5712
* @Laxmi01345 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/4873
* @021nirav-blip made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5569
* @Pankajyadav919 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5728
* @stutijain2006 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5784
* @SaaiAravindhRaja made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5173
* @rashi-cse made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5850
* @anshukaushik4700 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5862
* @Siddharth-732 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5628
* @Thesmoothengineer made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5895
* @AdityaM-IITH made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5907
* @thevanshit made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5866
* @sonalgaud12 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6159
* @piyushdotcomm made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6166
* @yogibytes made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6142
* @Anexus5919 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6438
* @karthik-dev56 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6480
* @codeGurhans made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6478
* @kambammaanasa08-afk made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6337
* @Sidharthwin made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6366
* @Rudra2637 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6069
* @gcharpe1604 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6367
* @srijansingh9170-source made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6231
* @gourijain029-del made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6013
* @builtby-SHIV made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5244
* @Gamerking177 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6376
* @nishtha-agarwal-211 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5497
* @Sekar-C-Mca made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6163
* @PrathmeshDesai made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6388
* @Yashasyadav made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6421
* @Blackmonk892 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5182
* @Shekar-77 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6090
* @swapnachoudhary43 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6427
* @aadyaas05 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6415
* @divyamagrawal06 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6319
* @Shruti0460 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5471
* @sapnilbiswas made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6521
* @SakethSumanBathini made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6266
* @hassan09070 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6120
* @Saidkhusayn made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6454
* @Tomeshwari-02 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6549
* @mishtiagrawal02-cloud made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6055
* @dineshkolhe1 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5729
* @saishmungase made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5195
* @bhangalesoham2606 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5639
* @e-esakman made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6577
* @castorNova2 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6623
* @shaikhibrahim2000 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6591
* @CodeWith-sakib made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6676
* @Ayush78516 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/5469
* @CodeBySayak made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6692
* @Noaman-Akhtar made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6681
* @Mohd-Ali-Creator made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6435
* @CodeLine9 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6708
* @Piyushrathoree made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6805
* @Vaishnavi10706 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6795
* @Suyash-ka-github made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6834
* @Shushmitaaaa made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6852
* @YASHSHARMAOFFICIALLY made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6892
* @sakshar2303 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6848
* @tarun-227 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6867
* @Ajay9704 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6960
* @Utkarsh-0304 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7069
* @Ayush4958 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7110
* @Sourav001254 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7080
* @lohith2406 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7124
* @yashisrani made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7147
* @rakshaak29 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7112
* @sahu-virendra-1908 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7219
* @aditya-8787 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7197
* @SuryaPratapIIIT made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7164
* @parshipcy made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7349
* @nickhil-verma made their first contribution in https://github.com/sugarlabs/musicblocks/pull/6835
* @Harshit-Mishra2212 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7299
* @lavjeetrai made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7241
* @andoriyaprashant made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7239
* @Mikey3600 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7278
* @srajang1805 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7317
* @netram75 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7417
* @santhosh-7777 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7450
* @KeerthiKumarR made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7483
* @Manvitha-Kopela made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7346
* @NAME-ASHWANIYADAV made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7502
* @Gungunverma1227 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7452
* @unmeshgb made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7315
* @adarsh-yadav1 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7420
* @Rahulchaudharyji2 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7135
* @nehayadav827 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7432
* @harshwardhan-kp made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7376
* @UtkarshAnandd made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7506
* @rish106-hub made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7540
* @macayu17 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7413
* @RikenMor001 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7586
* @creo04 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7571
* @patilpratik1905 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7569
* @raisakshii made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7599
* @singhharsh1708 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7649
* @Himani78116 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7704
* @faratabassum09-a11y made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7699
* @thribhuvan003 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7731
* @MatrixNeoKozak made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7756
* @shivv23 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7843
* @karankumar1106 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7814
* @rakesh-vajrapu made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7930
* @Yatharth6494 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7999
* @palakbhati made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7876
* @Abhishek-Sonje made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7922
* @dhruvpatil972 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7788
* @Sumanthvu made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7990
* @yush-1018 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7977
* @uday-2304 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8033
* @AbdulWasih05 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/7190
* @DivyanshuVortex made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8041
* @ManuelFCastillo made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8099
* @xtroon made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8111
* @nodeanurag made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8126
* @gouravj25551-afk made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8104
* @bhuvan-somisetty made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8177
* @hazelr125 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8063
* @JituRewar made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8243
* @guptadi0406-alt made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8216
* @s1dhu98 made their first contribution in https://github.com/sugarlabs/musicblocks/pull/8300

**Full Changelog**: https://github.com/sugarlabs/musicblocks/compare/v3.7.1...v3.8.0
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).