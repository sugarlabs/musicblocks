class Detective {
    static BLOCKNAMEDICT = {
        "start" : "Start (Clamp)",
        "newnote" : "Note (Clamp)",
        "number" : "Number (Value)",
        "settimbre" : "Set Instrument (Clamp)",
        "solfege" : "Solfege (Value)",
        "divide" : "Divide (Left)",
        "pitch" : "Set Pitch",
        "vspace" : "Vertical Space"
    }

    static get BLOCKCOUNT() {
        return blocks.blockList.filter(blk => blk.name !== "hidden").length;
    }

    static get BLOCKTYPESCOUNT() {
        let blkList = blocks.blockList.filter(blk => blk.name !== "hidden");

        let blkTypes = {};
        for (let blk of blkList) {
            blkTypes[blk.name] = blk.name in blkTypes ? blkTypes[blk.name] + 1 : 1;
        }

        return blkTypes;
    }

    static showBlockCountByType() {
        let blkTypeList = Detective.BLOCKTYPESCOUNT;
        for (let blkType of Object.getOwnPropertyNames(Detective.BLOCKTYPESCOUNT)) {
            if (blkType in Detective.BLOCKNAMEDICT) {
                blkTypeList[Detective.BLOCKNAMEDICT[blkType]] = blkTypeList[blkType];
                delete blkTypeList[blkType];
            }
        }

        const sorted = {};
        Object.keys(blkTypeList).sort().forEach(key => sorted[key] = blkTypeList[key]);

        console.log(sorted);
    }
}
