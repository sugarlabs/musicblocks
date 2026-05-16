# Design Token Audit

This document tracks all hardcoded color values found across styling
sources, as part of the CSS design token migration.

## Status

| File                        | Audited        | Tokens Mapped  |
| --------------------------- | -------------- | -------------- |
| css/activities.css          | ✅ Done        | ✅ Done        |
| css/themes.css              | 🔄 In progress | 🔄 In progress |
| js/utils/platformstyle.js   | ⏳ Pending     | ⏳ Pending     |
| dist/css/windows.css        | ⏳ Pending     | ⏳ Pending     |
| planet/css/planetThemes.css | ⏳ Pending     | ⏳ Pending     |

## css/activities.css

| LINE | VALUE     | CONTEXT                        | TOKEN                                |
| ---- | --------- | ------------------------------ | ------------------------------------ |
| 22   | #0066ff   | focus ring outline             | --color-blue-btn                     |
| 28   | #fff      | search box bg (light)          | --color-dialogue-box                 |
| 29   | #000      | search text (light)            | --color-text                         |
| 33   | #ddd      | autocomplete hover             | --color-hover                        |
| 37   | #f9f9f9   | search div bg (light)          | --color-background                   |
| 42   | #000000   | ui-menu bg (highcontrast)      | --color-background                   |
| 43   | #ffffff   | ui-menu border (highcontrast)  | --color-rule                         |
| 47   | #ffffff   | menu item text (highcontrast)  | --color-text                         |
| 52   | #333333   | menu item hover (highcontrast) | --color-hover                        |
| 53   | #00ffff   | menu hover text (highcontrast) | --color-blue-btn                     |
| 58   | #fff      | newdropdown bg                 | --color-dialogue-box                 |
| 59   | #cccccc   | newdropdown border             | --color-rule                         |
| 60   | #000000   | newdropdown text               | --color-text                         |
| 91   | #0066ff   | new-project-title color        | --color-blue-btn                     |
| 107  | #fff      | modalBox bg                    | --color-dialogue-box                 |
| 115  | #0066ff   | modal-title color              | --color-blue-btn                     |
| 137  | #0066ff   | confirm button bg              | --color-blue-btn                     |
| 144  | #023a76   | confirm button hover bg        | --color-blue-btn-hover               |
| 154  | #e0e0e0   | cancel button bg               | --color-cancel-btn                   |
| 159  | #afafaf   | cancel button hover bg         | --color-cancel-btn-hover             |
| 181  | #fefefe   | modal-content bg               | --color-dialogue-box                 |
| 191  | #ccc      | block-count-dropdown border    | --color-rule                         |
| 193  | #dedededd | block-count-dropdown bg        | --color-hover                        |
| 211  | #aaa      | close button color             | --color-label                        |
| 230  | #ffffff   | search input bg                | --color-dialogue-box                 |
| 231  | #03a9f4   | search input border            | --color-header                       |
| 240  | #4da6ff   | search focus border            | --color-aux                          |
| 252  | #f0f0f0   | helpfulSearchDiv bg            | --color-background                   |
| 254  | #ccc      | helpfulSearchDiv border        | --color-rule                         |
| 286  | #87cefa   | trash-view border              | --color-sub                          |
| 301  | #2196f3   | button-container bg            | --color-header                       |
| 304  | #d9d9d9   | button-container border-bottom | --color-rule                         |
| 315  | #d9d9d9   | trash-item hover bg            | --color-rule                         |
| 350  | #87cefa   | ui-menu border                 | --color-sub                          |
| 381  | #d0d3d4   | ui-id-1 hover bg               | --color-cancel-btn                   |
| 385  | #d0d3d4   | ui-state-focus bg              | --color-cancel-btn                   |
| 400  | #92b5c8   | myProgress bg                  | --color-aux                          |
| 407  | #ffffff   | myBar bg                       | --color-dialogue-box                 |
| 429  | #fff      | load-container bg              | --color-dialogue-box                 |
| 483  | #444      | popdown-palette h3 border      | --color-rule                         |
| 515  | #4682b4   | div.back bg                    | --color-header                       |
| 547  | #8bc34a   | nav bg                         | --color-header                       |
| 638  | #96d3f3   | thumbnail bg                   | --color-highlight ← NEW TOKEN        |
| 651  | #fff      | planet-iframe bg               | --color-dialogue-box                 |
| 682  | #92b5c8   | body bg                        | --color-aux                          |
| 700  | #88e20a   | select bg                      | --color-active-indicator ← NEW TOKEN |
| 710  | #fff      | input.input bg                 | --color-dialogue-box                 |
| 721  | #ff5942   | input.text bg                  | --color-input-text ← NEW TOKEN       |
| 731  | #c96df3   | input.boolean bg               | --color-input-boolean ← NEW TOKEN    |
| 742  | #ff5293   | input.number bg                | --color-input-number ← NEW TOKEN     |
| 754  | #8cc6ff   | input.musicratio bg            | --color-sub                          |
| 766  | #8cc6ff   | input.BPMInput bg              | --color-sub                          |
| 1163 | #2196f3   | top-wrapper bg                 | --color-header                       |
| 1168 | #fff      | top-wrapper color              | --color-dialogue-box                 |
| 1253 | #2196F3   | helpBodyDiv link color         | --color-header                       |
| 1260 | #2b8be5   | helpBodyDiv link hover         | --color-aux                          |
| 1399 | #8cc6ff   | timbreName input bg            | --color-sub                          |
| 1456 | #8cc6ff   | popupMsg bg                    | --color-sub                          |
| 1592 | #000031   | slider thumb shadow            | --color-shadow ← NEW TOKEN           |
| 1593 | #00001e   | slider thumb border            | --color-shadow                       |
| 1603 | #000031   | slider thumb shadow (moz)      | --color-shadow                       |
| 1604 | #00001e   | slider thumb border (moz)      | --color-shadow                       |
| 1652 | #4caf50   | progressBar bg                 | --color-active-indicator             |
| 1690 | #90c100   | btn bg                         | --color-active-indicator             |
| 1694 | #90c100   | btn border                     | --color-active-indicator             |
| 1702 | #fff      | circle text color              | --color-dialogue-box                 |
| 1705 | #000      | circle bg                      | --color-text                         |
| 1726 | #c8c8c8   | rangeslidervalue bg            | --color-rhythm-cell                  |
| 1786 | #222      | slider label color             | --color-text                         |
| 1787 | #555      | slider label text-shadow       | --color-label                        |
| 1800 | #222      | same as above                  | --color-text                         |
| 1801 | #555      | same as above                  | --color-label                        |
| 1814 | #222      | same as above                  | --color-text                         |
| 1815 | #555      | same as above                  | --color-label                        |
| 1903 | #f2f2f2   | chooseKeyDiv bg                | --color-background                   |
| 1919 | #f2f2f2   | movable bg                     | --color-background                   |
| 1963 | #8cc6ff   | popupMsg bg                    | --color-sub                          |
| 2004 | #000000   | errorText color                | --color-text                         |
| 2075 | #000      | link color                     | --color-text                         |
| 2079 | #033cd2   | color-change fill              | --color-blue-btn                     |
| 2080 | #78e600   | color-change stroke            | --color-active-indicator             |
| 2089 | #1e88e5   | persistentNotification bg      | --color-header                       |
| 2113 | #ccc      | chatLog border                 | --color-rule                         |
| 2136 | #dfdfdf   | message-container bg           | --color-hover                        |
| 2137 | #000      | message-container text         | --color-text                         |
| 2149 | #dcf8c6   | user message bg                | --color-chat-user ← NEW TOKEN        |
| 2154 | #ff0000   | lego-brick bg                  | --color-trash-active                 |
| 2155 | #880000   | lego-brick border              | --color-trash-active                 |
