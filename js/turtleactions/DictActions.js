/**
 * @file This contains the action methods of the Turtle's Singer component's Dictionary blocks.
 * @author Anindya Kundu
 * @author Walter Bender
 *
 * @copyright 2014-2021 Walter Bender
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
 *
 * Utility methods are in PascalCase.
 * Action methods are in camelCase.
 */

/*
   global

   _, Turtle, Singer, getNote, INVALIDPITCH, pitchToNumber,
   getTargetTurtle
 */

/*
   Global Locations
    js/utils/utils.js
        _
    js/turtle.js
        Turtle
    js/turtle-singer.js
        Singer
    js/utils/musicutils.js
        getNote, pitchToNumber
    js/logo.js
        INVALIDPITCH
    js/blocks/EnsembleBlocks.js
        getTargetTurtle
*/

/* exported setupDictActions */

// The internal turtle dictionary keys handled by _GetDict, each with its translations from
// locales/*.json. Text blocks keep whatever was typed, so a key typed in one language has to
// keep working after the project is opened in another. DictActions.test.js checks this table
// against the locale files.
const TURTLEKEYS = {
    "color": [
        "Farbe",
        "agba",
        "barva",
        "colore",
        "colour",
        "cor",
        "farge",
        "farve",
        "färg",
        "ibara",
        "kleur",
        "kolor",
        "koló",
        "la couleur",
        "llimp'i",
        "loko",
        "mukuxtaláb",
        "màu",
        "renk",
        "rəng",
        "sa’y",
        "tae",
        "väri",
        "warna",
        "xikjia'",
        "χρώμα",
        "цвет",
        "ѳнгѳ",
        "צבע",
        "اللون",
        "رنگ",
        "رەڭ",
        "रंग",
        "রং",
        "நிறம்",
        "రంగు",
        "වර්ණ",
        "สี",
        "ფერი",
        "ቀለም",
        "ពណ៌",
        "いろ",
        "顏色",
        "색"
    ],
    "shade": [
        "Schattierung",
        "cień",
        "fahamatrohana",
        "gradasi",
        "gölge",
        "in tsapik in majub",
        "l'ombre",
        "lijiú",
        "llanthu",
        "ndo",
        "odstín",
        "ombreggiatura",
        "schaduw",
        "skadu",
        "skugga",
        "skygge",
        "sombra",
        "sävy",
        "sắc màu",
        "tonalitat",
        "tone",
        "tono",
        "ubwijime",
        "uriuri",
        "vuli",
        "ã",
        "çalar",
        "σκιά",
        "затенение",
        "сүүдэр",
        "גוון",
        "درجة اللون",
        "سایہ",
        "छाया",
        "सावली",
        "ছায়া",
        "நிழல்",
        "ఛాయ",
        "අඳුරු කරන්න",
        "เฉดสี",
        "ჩრდილი",
        "ស្រមោល​",
        "シェード",
        "形狀",
        "명암"
    ],
    "grey": [
        "boz",
        "cinza",
        "grau",
        "gri",
        "grigio",
        "gris",
        "hungy",
        "isi awọ",
        "uqi",
        "אפור",
        "رمادي",
        "سرمئی",
        "ग्रे",
        "राखाडी",
        "ধূসর",
        "சாம்பல்",
        "రంగులు",
        "เทา",
        "ნაცრისფერი",
        "はいいろ",
        "灰色",
        "灰色的",
        "회색"
    ],
    "pen size": [
        "Qillqanq sayayanin",
        "Stiftdicke",
        "dimensione della penna",
        "haben'ny penina",
        "ingano y'ikaramu",
        "jakatuha haiha",
        "kalem boyutu",
        "kynän koko",
        "kích cỡ bút",
        "largura do traço da caneta",
        "ngutue'p",
        "pen dikte",
        "pengrootte",
        "pennstorlek",
        "puwél",
        "qələmin ölçüsü",
        "rahinga pene",
        "rozmiar pisaka",
        "størrelse",
        "størrelse pen",
        "tamaño de la pluma",
        "tamaño di pèn",
        "ukuran pena",
        "velikost pera",
        "épaisseur du trait",
        "μέγεθος στιλό",
        "размер пера",
        "үзэг хэмжээ",
        "עובי עט",
        "حجم القلم",
        "قلم کا سائز",
        "कलमको आकार",
        "पेन आकार",
        "কলমের আকার",
        "பேனை அளவு",
        "పెన్ పరిమాణం",
        "පෑනේ විශාලත්වය",
        "ขนาดปากกา",
        "კალმის ზომა",
        "ペンの おおきさ",
        "畫筆大小",
        "펜 크기"
    ],
    "font": [
        "Schriftart",
        "font ukat juk’ampinaka",
        "fonte",
        "fuente",
        "police",
        "yazı tipi",
        "şrift",
        "גוֹפָן",
        "الخط",
        "فونٹ",
        "फ़ॉन्ट",
        "फॉन्ट",
        "ফন্ট",
        "எழுத்துரு",
        "ఫాంట్",
        "แบบอักษร",
        "შრიფტი",
        "フォント",
        "字体",
        "字體",
        "세례반"
    ],
    "heading": [
        "Richtung",
        "arah",
        "başlık",
        "bevæger sig mod",
        "direkshon",
        "direzione",
        "in bélil, in ók'",
        "isiokwu",
        "istiqamət",
        "kierunek",
        "le cap",
        "lohateny",
        "mayman",
        "nadpis",
        "otsikko",
        "panekōrero",
        "peuk manamaa",
        "retning",
        "richting",
        "rigting",
        "riktning",
        "rumbo",
        "rumo",
        "tiêu đề",
        "umutwempangano",
        "επικεφαλίδα",
        "направление",
        "чиг",
        "כיוון (אזימוט)",
        "الترويسة",
        "سرخی",
        "سرفصل",
        "शिर्षक",
        "शीर्षक",
        "শিরোনাম",
        "தலைப்பு",
        "పీఠిక",
        "ශීර්ෂකය",
        "ทิศทางปัจจุบัน",
        "სათაური",
        "ការអាន​ ",
        "むき（ネズミ）",
        "方向",
        "머리방향"
    ],
    "x": ["X座標", "x koordinatı", "xざひょう（よこ）", "χ", "س", "एक्स", "எக்ஸ்", "แกน x"],
    "y": ["Y座標", "y koordinatı", "yざひょう（たて）", "ص", "वाई", "แกน y", "წ"],
    "notes played": [
        "Noten gespielt",
        "ndetu egwuru",
        "notakuna pukllasqakuna",
        "notas tocadas",
        "notas ñembosaráipyre",
        "note suonate",
        "notes jouées",
        "çalınan notalar",
        "çalınmış notalar",
        "ניגנו תווים",
        "لعبت الملاحظات",
        "نوٹ کھیلے گئے",
        "नोट्स प्ले केल्या",
        "नोट्स बजे",
        "নোট খেলা",
        "குறிப்புகள் விளையாடப்பட்டன",
        "నోట్లు ప్లే చేయబడ్డాయి",
        "เล่นโน้ตแล้ว",
        "ნოტები ითამაშა",
        "ぜんたいの はくの かず",
        "演奏的音符",
        "演奏的音符数",
        "연주된 음표"
    ],
    "note value": [
        "Notenwert",
        "T’uyaq yupaynin",
        "dee uru",
        "kuatia’ihai repy",
        "nota değeri",
        "nota dəyəri",
        "valeur de la note",
        "valor de la nota",
        "valor de nota",
        "valore della nota",
        "warurt'äwi chimpu chani",
        "ערך תו מוזיקלי",
        "قيمة الملاحظة",
        "نوٹ ویلیو",
        "नोट मूल्य",
        "নোট মান",
        "குறிப்பு மதிப்பு",
        "నోట్ విల్యూ",
        "ค่าของโน้ต",
        "შენიშვნის ღირებულება",
        "おとの ながさ",
        "票據價值",
        "音符时值",
        "음표 값"
    ],
    "current pitch": [
        "aktuelle Tonhöhe",
        "cari səsin yüksəkliyi",
        "hauteur actuelle",
        "jichha pacha pitch",
        "kunan pacha tono",
        "mevcut perde",
        "passo attuale",
        "tom atual",
        "tono actual",
        "tono ko’áĝagua",
        "הגובה הנוכחי",
        "الملعب الحالي",
        "موجودہ پچ",
        "वर्तमान स्वर",
        "सध्याचा स्वर",
        "বর্তমান পিচ",
        "தற்போதைய சுருதி",
        "ప్రస్తుత పిచ్",
        "สนามปัจจุบัน",
        "მიმდინარე მოედანი",
        "ọkwa dị ugbu a",
        "げんだいの おとの たかさ",
        "当前音高",
        "目前音高",
        "현재 피치"
    ],
    "pitch number": [
        "Stellplatznummer",
        "kunkapa yupaynin",
        "numero di piazzola",
        "numéro de hauteur",
        "número de tono",
        "número do tom",
        "nọmba pipụ",
        "perde numarası",
        "pu papaha",
        "səsin yüksəkliyi nömrəsi",
        "מספר מגרש",
        "رقم الملعب",
        "پچ نمبر",
        "स्वर संख्या",
        "পিচ নম্বর",
        "சுருதி எண்",
        "పిచ్ సంఖ్య",
        "หมายเลขสนาม",
        "მოედანის ნომერი",
        "おとのたかさを かずでひょうじ",
        "節數",
        "音高编号",
        "피치 번호"
    ]
};

/**
 * Sets up all the methods related to different actions for each block in Dictionary palette.
 * @returns {void}
 */
function setupDictActions(activity) {
    Turtle.DictActions = class {
        /**
         * Utility function to get the English name of an internal turtle dictionary key.
         * A key matches its English name or its translation in the current language, and
         * then its translation in any other language.
         *
         * @static
         * @param {String} key - key
         * @returns {String|null} English key name, or null if key is not an internal key
         */
        static TurtleKey(key) {
            const names = Object.keys(TURTLEKEYS);
            for (const name of names) {
                if (key === name || key === _(name)) {
                    return name;
                }
            }
            for (const name of names) {
                if (TURTLEKEYS[name].includes(key)) {
                    return name;
                }
            }
            return null;
        }

        /**
         * Utility function to check whether a key is one of the internal turtle dictionary keys
         * handled by _GetDict.
         *
         * @static
         * @param {String} key - key
         * @returns {Boolean}
         */
        static IsTurtleKey(key) {
            return Turtle.DictActions.TurtleKey(key) !== null;
        }

        /**
         * Utility function to get Turtle properties associated with target (used by get value).
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} key - key
         * @param {Number?} blk - block index in blocks.blockList
         * @returns {String|Number}
         */
        static _GetDict(target, turtle, key, blk) {
            const targetTur = activity.turtles.ithTurtle(target);
            const name = Turtle.DictActions.TurtleKey(key);

            // This is the internal turtle dictionary that includes the turtle status.
            if (name === "color") {
                return targetTur.painter.color;
            } else if (name === "shade") {
                return targetTur.painter.value;
            } else if (name === "grey") {
                return targetTur.painter.chroma;
            } else if (name === "pen size") {
                return targetTur.painter.stroke;
            } else if (name === "font") {
                return targetTur.painter.font;
            } else if (name === "heading") {
                return targetTur.painter.turtle.orientation;
            } else if (name === "x") {
                return activity.turtles.screenX2turtleX(targetTur.container.x);
            } else if (name === "y") {
                return activity.turtles.screenY2turtleY(targetTur.container.y);
            } else if (name === "notes played") {
                return targetTur.singer.notesPlayed[0] / targetTur.singer.notesPlayed[1];
            } else if (name === "note value") {
                return Singer.RhythmActions.getNoteValue(target);
            } else if (name === "current pitch") {
                if (targetTur.singer.lastNotePlayed === null) {
                    return "G4";
                }
                return targetTur.singer.lastNotePlayed[0];
            } else if (name === "pitch number") {
                let obj;
                if (targetTur.singer.lastNotePlayed !== null) {
                    const len = targetTur.singer.lastNotePlayed[0].length;
                    const pitch = targetTur.singer.lastNotePlayed[0].slice(0, len - 1);
                    const octave = parseInt(targetTur.singer.lastNotePlayed[0].slice(len - 1), 10);

                    obj = [pitch, octave];
                } else if (targetTur.singer.notePitches.length > 0) {
                    obj = getNote(
                        targetTur.singer.notePitches[0],
                        targetTur.singer.noteOctaves[0],
                        0,
                        targetTur.singer.keySignature,
                        targetTur.singer.movable,
                        null,
                        activity.errorMsg,
                        activity.logo.synth.inTemperament
                    );
                } else {
                    activity.errorMsg(INVALIDPITCH, blk);
                    obj = ["G", 4];
                }

                return (
                    pitchToNumber(obj[0], obj[1], targetTur.singer.keySignature) -
                    targetTur.singer.pitchNumberOffset
                );
            } else {
                activity.errorMsg(
                    _("Unknown key: %s").replace(/%s/g, () => key),
                    blk
                );
                return 0;
            }
        }

        /**
         * Utility function to set a value corresponding to a key.
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} key - key
         * @param {*} value - value
         * @returns {void}
         */
        static SetDictValue(target, turtle, key, value) {
            const targetTur = activity.turtles.ithTurtle(target);
            const name = Turtle.DictActions.TurtleKey(key);

            // This is the internal turtle dictionary that includes the turtle status.
            if (name === "color") {
                targetTur.painter.doSetColor(value);
            } else if (name === "shade") {
                targetTur.painter.doSetValue(value);
            } else if (name === "grey") {
                targetTur.painter.doSetChroma(value);
            } else if (name === "pen size") {
                targetTur.painter.doSetPensize(value);
            } else if (name === "font") {
                targetTur.painter.doSetFont(value);
            } else if (name === "heading") {
                targetTur.painter.doSetHeading(value);
            } else if (name === "y") {
                const x = activity.turtles.screenX2turtleX(targetTur.container.x);
                targetTur.painter.doSetXY(x, value);
            } else if (name === "x") {
                const y = activity.turtles.screenY2turtleY(targetTur.container.y);
                targetTur.painter.doSetXY(value, y);
            } else if (
                name === "notes played" ||
                name === "note value" ||
                name === "current pitch" ||
                name === "pitch number"
            ) {
                activity.errorMsg(_("Cannot set read-only key: %s").replace(/%s/g, () => key));
            }
        }

        /**
         * Alias for SetDictValue for backward compatibility.
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @param {String} key - key
         * @param {*} value - value
         * @returns {void}
         */
        static setDictValue(target, turtle, key, value) {
            Turtle.DictActions.SetDictValue(target, turtle, key, value);
        }

        /**
         * Utility function to display dictionary as JSON.
         *
         * @static
         * @param {Number} target - target Turtle index in turtle.turtleList
         * @param {Number} turtle - Turtle index in turtle.turtleList
         * @returns {String}
         */
        static SerializeDict(target, turtle) {
            const targetTur = activity.turtles.ithTurtle(target);

            // This is the internal turtle dictionary that includes the turtle status.
            const this_dict = {};
            this_dict[_("color")] = targetTur.painter.color;
            this_dict[_("shade")] = targetTur.painter.value;
            this_dict[_("grey")] = targetTur.painter.chroma;
            this_dict[_("pen size")] = targetTur.painter.stroke;
            this_dict[_("font")] = targetTur.painter.font;
            this_dict[_("heading")] = targetTur.painter.turtle.orientation;
            this_dict["y"] = activity.turtles.screenY2turtleY(targetTur.container.y);
            this_dict["x"] = activity.turtles.screenX2turtleX(targetTur.container.x);

            if (
                turtle in activity.logo.turtleDicts &&
                target in activity.logo.turtleDicts[turtle]
            ) {
                for (const key in activity.logo.turtleDicts[turtle][target]) {
                    this_dict[key] = activity.logo.turtleDicts[turtle][target][key];
                }
            }
            return JSON.stringify(this_dict);
        }

        /**
         * Returns the contents of the queried dictionary.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {String}
         */
        static getDict(dict, turtle) {
            // Not sure this can happen.
            if (!(turtle in activity.logo.turtleDicts)) activity.logo.turtleDicts[turtle] = {};

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                return Turtle.DictActions.SerializeDict(target, turtle);
            }

            return JSON.stringify(
                dict in activity.logo.turtleDicts[turtle]
                    ? activity.logo.turtleDicts[turtle][dict]
                    : {}
            );
        }

        /**
         * Displays the contents of the queried dictionary.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static showDict(dict, turtle) {
            activity.textMsg(Turtle.DictActions.getDict(dict, turtle));
        }

        /**
         * Sets a value in the dictionary for a specified key.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {String|Number} key
         * @param {String|Number} value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static setValue(dict, key, value, turtle) {
            if (!(turtle in activity.logo.turtleDicts)) {
                activity.logo.turtleDicts[turtle] = {};
            }

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                if (Turtle.DictActions.IsTurtleKey(key)) {
                    Turtle.DictActions.SetDictValue(target, turtle, key, value);
                    return;
                }
                // Other keys are stored where SerializeDict reads them.
                dict = target;
            }

            if (!(dict in activity.logo.turtleDicts[turtle])) {
                activity.logo.turtleDicts[turtle][dict] = {};
            }
            activity.logo.turtleDicts[turtle][dict][key] = value;
        }

        /**
         * Returns a value in the dictionary for a specified key.
         *
         * @static
         * @param {String|Number} dict - dictionary name
         * @param {String|Number} key
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number?} blk - block index in blocks.blockList
         * @returns {String|Number}
         */
        static getValue(dict, key, turtle, blk) {
            if (!(turtle in activity.logo.turtleDicts)) {
                activity.logo.turtleDicts[turtle] = {};
            }

            // Is the dictionary the same as a turtle name?
            const target = getTargetTurtle(activity.turtles, dict);
            if (target !== null) {
                if (Turtle.DictActions.IsTurtleKey(key)) {
                    return Turtle.DictActions._GetDict(target, turtle, key, blk);
                }
                const turtleDict = activity.logo.turtleDicts[turtle][target];
                if (
                    turtleDict === undefined ||
                    !Object.prototype.hasOwnProperty.call(turtleDict, key)
                ) {
                    const msg = _("Key with this name does not exist in %s").replace(
                        /%s/g,
                        () => dict
                    );
                    activity.errorMsg(msg, blk);
                    return 0;
                }
                return turtleDict[key];
            }

            if (!(dict in activity.logo.turtleDicts[turtle])) {
                const msg = _("Dictionary with this name does not exist");
                activity.errorMsg(msg, blk);
                return 0;
            } else if (!(key in activity.logo.turtleDicts[turtle][dict])) {
                const msg = _("Key with this name does not exist in %s").replace(/%s/g, dict);
                activity.errorMsg(msg, blk);
                return 0;
            }

            return activity.logo.turtleDicts[turtle][dict][key];
        }
    };
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = setupDictActions;
}
