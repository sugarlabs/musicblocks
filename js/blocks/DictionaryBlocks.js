// Copyright (c) 2020 Christopher Liu
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function setupDictionaryBlocks() {
    class DictionaryBlock extends LeftBlock {
        constructor() {
            super("dictionary", _("dictionary"));
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The dictionary block returns a dictionary."),
                "documentation",
                ""
            ]);

            this.extraWidth = 20;
            this.formBlock({
                flows: {
                    labels: [""],
                    type: "flow"
                },
            });
        }

        arg(logo, turtle, blk) {
            var dictionary = {};
            var blks = logo.blocks.blockList;
            var currBlock = blks[blk];

            while ((currBlock.connections.slice(-1)[0]) !== null) {
                var nextBlock = blks[currBlock.connections.slice(-1)[0]];
                if (nextBlock.name === "dictPair") {
                    var key = blks[nextBlock.connections[1]].value;
                    var value = blks[nextBlock.connections[2]].value;
                    // temporary fix
                    if (value === "true") {
                        value = true;
                    } else if (value === "false") {
                        value = false;
                    }
                    dictionary[key] = value;
                }

                currBlock = nextBlock;
            }

            if (
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    === undefined
            ) {
                return JSON.stringify(dictionary);
            } else if (
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name.includes("transform")
            ) {
                // only return dictionary if connected to transformer
                return dictionary;
            } else {
                return JSON.stringify(dictionary);
            }
        }
    }

    class DictionaryPairBlock extends FlowBlock {
        constructor() {
            super("dictPair", _("dictionary pair"));
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The dictionary pair block pairs a keyword with a value in a dictionary."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 2,
                argLabels: [
                    _("keyword"),
                    _("value")
                ],
                argTypes: ["textin", "anyin"],
                defaults: ["number", 4]
            })
        }

        flow(args, logo, turtle, blk, receivedArg) {
            var blks = logo.blocks.blockList;
            var key = blks[blks[blk].connections[1]].value;
            var value = blks[blks[blk].connections[2]].value;
            logo.textMsg(`${key}: ${value}`);
        }
    }

    class NamedDictionaryBlock extends LeftBlock {
        constructor() {
            super("namedDictionary", _("dictionary"));
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The dictionary block returns a dictionary."),
                "documentation",
                ""
            ]);

            this.extraWidth = 20;
            this.formBlock({
                args: 1,
                argTypes: ['textin'],
                argLabels: ['name'],
                defaults: [_('dictionary')],
                flows: {
                    labels: [""],
                    type: "flow"
                },
            });
        }

        arg(logo, turtle, blk) {
            var dictionary = {};
            var blks = logo.blocks.blockList;
            var currBlock = blks[blk];

            while ((currBlock.connections.slice(-1)[0]) !== null) {
                var nextBlock = blks[currBlock.connections.slice(-1)[0]];
                if (nextBlock.name === "dictPair") {
                    var key = blks[nextBlock.connections[1]].value;
                    var value = blks[nextBlock.connections[2]].value;
                    // temporary fix
                    if (value === "true") {
                        value = true;
                    } else if (value === "false") {
                        value = false;
                    }
                    dictionary[key] = value;
                }

                currBlock = nextBlock;
            }

            if (
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    === undefined
            ) {
                return JSON.stringify(dictionary);
            } else if (
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name.includes("transform")
            ) {
                // only return dictionary if connected to transformer
                return dictionary;
            } else {
                return JSON.stringify(dictionary);
            }
        }
    }

    class DictValueByKey extends LeftBlock {
        constructor() {
            super("dictValueByKey", _("key value"));
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The key value block returns the value associated with a key in a dictionary."),
                "documentation",
                ""
            ]);

            this.extraWidth = 20;
            this.formBlock({
                args: 2,
                argLabels: [
                    _("dictionary"),
                    _("keyword")
                ],
                argTypes: ["textin", "textin"],
                defaults: ["dictionary", "number"]
            });
        }

        arg(logo, turtle, blk) {
            var blks = logo.blocks.blockList;
            var dictName = blks[blks[blk].connections[1]].value;
            var key = blks[blks[blk].connections[2]].value;
            var currBlock;

            // find a dictionary block with the specified name
            for (const x of blks) {
                if (
                    !x.trash &&
                    x.name === "namedDictionary" &&
                    blks[x.connections[1]].value === dictName
                ) {
                    currBlock = x;
                }
            }
            

            var dictionary = {}
            while ((currBlock.connections.slice(-1)[0]) !== null) {
                var nextBlock = blks[currBlock.connections.slice(-1)[0]];
                if (nextBlock.name === "dictPair") {
                    var key = blks[nextBlock.connections[1]].value;
                    var value = blks[nextBlock.connections[2]].value;
                    // temporary fix
                    if (value === "true") {
                        value = true;
                    } else if (value === "false") {
                        value = false;
                    }
                    dictionary[key] = value;
                }

                currBlock = nextBlock;
            }

            return dictionary[key];
        }
    }

    new DictValueByKey().setup();
    new NamedDictionaryBlock().setup();
    new DictionaryPairBlock().setup();
    new DictionaryBlock().setup();
}