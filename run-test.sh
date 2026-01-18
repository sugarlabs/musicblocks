#!/bin/bash
cd /workspaces/musicblocks
npm test js/widgets/tempo.test.js js/widgets/arpeggio.test.js js/widgets/modewidget.test.js 2>&1 | tail -150
