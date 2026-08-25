/**
 * @license
 * Music Blocks v3.0.0
 * Copyright (C) 2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

// practiceUI.js reads these as browser globals, so they exist before the panels render.
global._ = text => text;

const { PracticeManager } = require("../practiceManager");

global.PracticeManager = PracticeManager;
global.PracticeValidator = { validate: () => false, assessBadges: () => [] };

const BIG_BADGE = { id: "echo_guardian", label: "Echo Guardian", iconKey: "island" };

global.PracticeTheme = {
    title: "The Lost Melody Islands",
    subtitle: "Quest for the Hidden Treasure",
    intro: "<p>intro</p>",
    bigBadges: { echo_island: BIG_BADGE }
};

const makeProblem = (level, overrides = {}) => ({
    level,
    island: "echo_island",
    title: `Lesson ${level}`,
    description:
        `<p>body ${level}</p>` +
        '<button type="button" data-secret-help="swingPendulum">Swing the pendulum</button>' +
        '<button type="button" data-secret-help="makeLonger">Make it longer</button>',
    journal: { title: `Page ${level}`, island: "Echo Island", learned: ["Patterns"] },
    rewards: [`Fragment #${level}`],
    secretHelpCards: {
        swingPendulum: { title: "Swing the pendulum", type: "block", blockName: "setheading" },
        makeLonger: { title: "Make it longer", description: "Add another chunk." }
    },
    badges: [
        {
            id: `done_${level}`,
            label: "Bridge Builder",
            criterion: "completePattern",
            message: "Glow"
        },
        {
            id: `secret_${level}`,
            label: "Name Keeper",
            criterion: "renamedChunks",
            message: "Named"
        }
    ],
    ...overrides
});

global.PracticeProblems = [makeProblem(1), makeProblem(2), makeProblem(3)];

const { PracticeUI, ExplorerJournalUI } = require("../practiceUI");

const stubActivity = blockList => {
    const activity = {
        blocks: { blockList, loadNewBlocks: jest.fn(), adjustDocks: jest.fn() },
        turtles: { getTurtleCount: () => 0 },
        sendAllToTrash: jest.fn(),
        refreshCanvas: jest.fn()
    };
    window.ActivityContext = { getActivity: () => activity };
    return activity;
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const mountPracticeContent = () => {
    document.body.innerHTML = '<div id="practice-content"></div>';
    return document.getElementById("practice-content");
};

const mountJournalContent = () => {
    document.body.innerHTML = '<div id="explorer-journal-content"></div>';
    return document.getElementById("explorer-journal-content");
};

beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    PracticeManager.progress = {};
    PracticeManager.journal = { version: 1, pages: {}, generalNotes: [] };
    global.PracticeValidator = { validate: () => false, assessBadges: () => [] };
    PracticeUI.currentLevel = null;
    PracticeUI.starterBlockCount = null;
    delete window.ActivityContext;
});

afterEach(() => {
    PracticeUI.stopBadgeMonitor();
    PracticeUI.dismissQuestNotice();
});

describe("PracticeUI.getNextProblem", () => {
    const PROBLEMS = [{ level: 1 }, { level: 2 }, { level: 5 }];

    test("returns the lesson that follows in menu order, not level plus one", () => {
        expect(PracticeUI.getNextProblem(2, PROBLEMS)).toEqual({ level: 5 });
    });

    test("returns null on the last lesson so no button is offered", () => {
        expect(PracticeUI.getNextProblem(5, PROBLEMS)).toBeNull();
    });

    test("returns null for a level that is not in the list", () => {
        expect(PracticeUI.getNextProblem(99, PROBLEMS)).toBeNull();
    });
});

describe("PracticeUI canvas inspection", () => {
    test("counts only the blocks that are not in the trash", () => {
        stubActivity({ a: {}, b: {}, c: { trash: true } });

        expect(PracticeUI.countLiveBlocks()).toBe(2);
    });

    test("counts nothing when there is no activity yet", () => {
        expect(PracticeUI.countLiveBlocks()).toBe(0);
    });

    test("reports no extra blocks while the starter count is unknown", () => {
        stubActivity({ a: {}, b: {} });
        PracticeUI.starterBlockCount = null;

        expect(PracticeUI.hasExtraBlocks()).toBe(false);
    });

    test("reports no extra blocks when only the starter set is present", () => {
        stubActivity({ a: {}, b: {} });
        PracticeUI.starterBlockCount = 2;

        expect(PracticeUI.hasExtraBlocks()).toBe(false);
    });

    test("reports extra blocks once the learner has added one", () => {
        stubActivity({ a: {}, b: {}, c: {} });
        PracticeUI.starterBlockCount = 2;

        expect(PracticeUI.hasExtraBlocks()).toBe(true);
    });

    test("ignores trashed blocks so deleting does not look like new work", () => {
        stubActivity({ a: {}, b: {}, c: { trash: true } });
        PracticeUI.starterBlockCount = 2;

        expect(PracticeUI.hasExtraBlocks()).toBe(false);
    });
});

describe("PracticeUI small helpers", () => {
    test("escapes the characters that would break out of an attribute", () => {
        expect(PracticeUI.escapeAttribute('a & "b" <c>')).toBe("a &amp; &quot;b&quot; &lt;c&gt;");
    });

    test("builds a badge tooltip from its label and message", () => {
        expect(PracticeUI.getBadgeTitle({ label: "Bridge", message: "It glows" })).toBe(
            "Bridge: It glows"
        );
    });

    test("falls back to a generic description for a badge with no message", () => {
        expect(PracticeUI.getBadgeTitle({ label: "Bridge" })).toBe("Bridge: Discovery badge");
    });

    test("getActivity returns null when Music Blocks has not started yet", () => {
        expect(PracticeUI.getActivity()).toBeNull();
    });

    test("getActivity swallows an error thrown by the activity context", () => {
        window.ActivityContext = {
            getActivity: () => {
                throw new Error("not ready");
            }
        };

        expect(PracticeUI.getActivity()).toBeNull();
    });
});

describe("PracticeUI card rendering", () => {
    test("renders nothing when a lesson has no rewards", () => {
        expect(PracticeUI.renderRewards({})).toBe("");
    });

    test("lists every reward in the quest rewards card", () => {
        const html = PracticeUI.renderRewards({ rewards: ["One", "Two"] });

        expect(html).toContain("<li>One</li>");
        expect(html).toContain("<li>Two</li>");
    });

    test("renders nothing for a lesson with no badges", () => {
        expect(PracticeUI.renderBadgeStatus({})).toBe("");
    });

    test("marks only the badges that have been earned", () => {
        const problem = makeProblem(1);
        PracticeManager.awardLevelBadges(problem, [problem.badges[0]]);

        const html = PracticeUI.renderBadgeStatus(problem);

        expect(html).toMatch(/badge-chip earned[^>]*>\s*Bridge Builder/);
        expect(html).toMatch(/badge-chip [^>]*>\s*Name Keeper/);
    });

    test("shows no badge strip until something has been earned", () => {
        expect(PracticeUI.renderLevelBadgeStrip(makeProblem(1))).toBe("");
        expect(PracticeUI.renderLevelBadgeStrip({})).toBe("");
    });

    test("shows a strip icon for each earned badge", () => {
        const problem = makeProblem(1);
        PracticeManager.awardLevelBadges(problem, [problem.badges[1]]);

        const html = PracticeUI.renderLevelBadgeStrip(problem);

        expect(html).toContain("Name Keeper");
        expect(html).not.toContain("Bridge Builder");
    });

    test("shows no island badge row until an island is finished", () => {
        expect(PracticeUI.renderBigBadges([])).toBe("");
    });

    test("shows the island badge once it has been earned", () => {
        expect(PracticeUI.renderBigBadges(["echo_guardian"])).toContain("Echo Guardian");
    });
});

describe("PracticeUI.renderLevelMenu", () => {
    test("lists every lesson with its level number and title", () => {
        const container = mountPracticeContent();

        PracticeUI.renderLevelMenu();

        const buttons = container.querySelectorAll(".level-btn");
        expect(buttons).toHaveLength(3);
        expect(buttons[0].textContent).toContain("Lesson 1");
        expect(container.textContent).toContain("The Lost Melody Islands");
    });

    test("marks lessons that have already been completed", () => {
        PracticeManager.progress[2] = { complete: true, badges: [] };
        const container = mountPracticeContent();

        PracticeUI.renderLevelMenu();

        expect(container.querySelector('.level-btn[data-level="2"]').className).toContain("done");
        expect(container.querySelector('.level-btn[data-level="1"]').className).not.toContain(
            "done"
        );
    });

    test("opening the menu clears the level that was being viewed", () => {
        mountPracticeContent();
        PracticeUI.currentLevel = 2;

        PracticeUI.renderLevelMenu();

        expect(PracticeUI.currentLevel).toBeNull();
    });

    test("choosing a lesson opens it", () => {
        const container = mountPracticeContent();
        PracticeUI.renderLevelMenu();

        container.querySelector('.level-btn[data-level="2"]').onclick();

        expect(PracticeUI.currentLevel).toBe(2);
        expect(container.textContent).toContain("Lesson 2");
    });
});

describe("PracticeUI.renderLevel", () => {
    test("renders the lesson body, rewards, and the check button", () => {
        const container = mountPracticeContent();

        PracticeUI.renderLevel(1);

        expect(container.innerHTML).toContain("<p>body 1</p>");
        expect(container.textContent).toContain("Fragment #1");
        expect(container.querySelector("#check-level")).not.toBeNull();
        expect(container.querySelector("#back-to-levels")).not.toBeNull();
    });

    test("offers the next lesson with its number and title", () => {
        const container = mountPracticeContent();

        PracticeUI.renderLevel(1);

        const next = container.querySelector("#next-level");
        expect(next.querySelector("span").textContent.trim()).toBe("Next Lesson →");
        expect(next.querySelector("small").textContent.trim()).toBe("Level 2 · Lesson 2");
    });

    test("offers no next lesson on the last one", () => {
        const container = mountPracticeContent();

        PracticeUI.renderLevel(3);

        expect(container.querySelector("#next-level")).toBeNull();
    });

    test("back returns to the list of lessons", () => {
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);

        container.querySelector("#back-to-levels").onclick();

        expect(PracticeUI.currentLevel).toBeNull();
        expect(container.querySelectorAll(".level-btn")).toHaveLength(3);
    });

    test("moves straight on when the canvas holds only the starter blocks", () => {
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);
        PracticeUI.hasExtraBlocks = () => false;
        global.confirm = jest.fn();

        container.querySelector("#next-level").onclick();

        expect(global.confirm).not.toHaveBeenCalled();
        expect(PracticeUI.currentLevel).toBe(2);
        delete PracticeUI.hasExtraBlocks;
    });

    test("asks before clearing work the learner added", () => {
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);
        PracticeUI.hasExtraBlocks = () => true;
        global.confirm = jest.fn(() => false);

        container.querySelector("#next-level").onclick();

        expect(global.confirm).toHaveBeenCalledWith(
            "Starting the next lesson will clear the blocks on your canvas. Continue?"
        );
        expect(PracticeUI.currentLevel).toBe(1);
        delete PracticeUI.hasExtraBlocks;
    });

    test("moves on when the learner accepts losing their blocks", () => {
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);
        PracticeUI.hasExtraBlocks = () => true;
        global.confirm = jest.fn(() => true);

        container.querySelector("#next-level").onclick();

        expect(PracticeUI.currentLevel).toBe(2);
        delete PracticeUI.hasExtraBlocks;
    });
});

describe("PracticeUI check my work", () => {
    test("completes the lesson and marks it done in the menu", () => {
        global.PracticeValidator = { validate: () => true, assessBadges: () => [] };
        const container = mountPracticeContent();
        PracticeUI.renderLevelMenu();
        container.querySelector('.level-btn[data-level="1"]').onclick();

        container.querySelector("#check-level").onclick();

        expect(PracticeManager.isLevelComplete(1)).toBe(true);
        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "Lesson Complete"
        );
    });

    test("opens the journal prompt after a lesson is completed", () => {
        global.PracticeValidator = { validate: () => true, assessBadges: () => [] };
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);

        container.querySelector("#check-level").onclick();

        expect(document.getElementById("explorer-journal-prompt")).not.toBeNull();
    });

    test("awards a discovery found on a lesson that was already finished", () => {
        const problem = PracticeProblems[0];
        PracticeManager.progress[1] = { complete: true, badges: [] };
        global.PracticeValidator = {
            validate: () => false,
            assessBadges: () => [problem.badges[1]]
        };
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);

        container.querySelector("#check-level").onclick();

        expect(PracticeManager.getLevelBadges(1)).toEqual(["secret_1"]);
        expect(document.getElementById("practice-quest-notice").className).toContain("badge");
    });

    test("holds a discovery back until the lesson itself is passed", () => {
        const problem = PracticeProblems[0];
        global.PracticeValidator = {
            validate: () => false,
            assessBadges: () => [problem.badges[1]]
        };
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);

        container.querySelector("#check-level").onclick();

        expect(PracticeManager.getLevelBadges(1)).toEqual([]);
        expect(document.getElementById("practice-quest-notice").className).toContain("hint");
    });

    test("shows a hint when nothing has been achieved yet", () => {
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);

        container.querySelector("#check-level").onclick();

        const notice = document.getElementById("practice-quest-notice");
        expect(notice.className).toContain("hint");
        expect(PracticeManager.isLevelComplete(1)).toBe(false);
    });
});

describe("PracticeUI quest notices", () => {
    test("creates the notice element on first use and styles it by type", () => {
        PracticeUI.showQuestNotice("Title", "Message", "badge");

        const notice = document.getElementById("practice-quest-notice");
        expect(notice.className).toBe("practice-quest-notice show badge");
        expect(notice.textContent).toContain("Message");
    });

    test("defaults to the success style", () => {
        PracticeUI.showQuestNotice("Title", "Message");

        expect(document.getElementById("practice-quest-notice").className).toContain("success");
    });

    test("dismissing clears the text and the show class", () => {
        PracticeUI.showQuestNotice("Title", "Message", "success");

        PracticeUI.dismissQuestNotice();

        const notice = document.getElementById("practice-quest-notice");
        expect(notice.className).toBe("practice-quest-notice");
        expect(notice.textContent).toBe("");
    });

    test("uses the lesson's own heading and hint when it is not finished", () => {
        PracticeUI.showIncompleteMessage({
            incomplete: { title: "Still Sleeping", message: "Try the bridge song" }
        });

        const notice = document.getElementById("practice-quest-notice");
        expect(notice.textContent).toContain("Still Sleeping");
        expect(notice.textContent).toContain("Try the bridge song");
    });

    test("falls back to a generic hint when the lesson supplies none", () => {
        PracticeUI.showIncompleteMessage({});

        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "The Bridge Is Still Sleeping"
        );
    });

    test("uses the lesson's completion heading on success", () => {
        PracticeUI.showSuccessMessage(
            { journal: { completeTitle: "Bridge Restored" }, badges: [] },
            [],
            []
        );

        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "Bridge Restored"
        );
    });

    test("tells the learner when a discovery was already saved", () => {
        PracticeUI.showBadgeMessage([]);

        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "Discovery Already Saved"
        );
    });

    test("announces a newly found discovery", () => {
        PracticeUI.showBadgeMessage([{ id: "x", label: "Name Keeper", message: "Named it" }]);

        expect(document.getElementById("practice-quest-notice").textContent).toContain("Named it");
    });
});

describe("PracticeUI badge monitor", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test("awards hidden discoveries while the lesson is open", () => {
        const problem = makeProblem(1);
        global.PracticeValidator = { validate: () => false, assessBadges: () => problem.badges };
        document.body.innerHTML = '<div id="practice-badge-status"></div>';

        PracticeUI.startBadgeMonitor(problem);
        jest.advanceTimersByTime(1200);

        expect(PracticeManager.getLevelBadges(1)).toEqual(["secret_1"]);
    });

    test("never awards the completion badge behind the learner's back", () => {
        const problem = makeProblem(1);
        global.PracticeValidator = { validate: () => true, assessBadges: () => problem.badges };

        PracticeUI.startBadgeMonitor(problem);
        jest.advanceTimersByTime(1200);

        expect(PracticeManager.getLevelBadges(1)).not.toContain("done_1");
    });

    test("does nothing for a lesson with no badges", () => {
        PracticeUI.startBadgeMonitor({ level: 1 });

        expect(PracticeUI.badgeCheckTimer).toBeNull();
    });

    test("stopping the monitor prevents any further awards", () => {
        const problem = makeProblem(1);
        global.PracticeValidator = { validate: () => false, assessBadges: () => problem.badges };
        PracticeUI.startBadgeMonitor(problem);

        PracticeUI.stopBadgeMonitor();
        jest.advanceTimersByTime(5000);

        expect(PracticeManager.getLevelBadges(1)).toEqual([]);
        expect(PracticeUI.badgeCheckTimer).toBeNull();
    });
});

describe("PracticeUI canvas loading", () => {
    test("clears the canvas before loading a starter project", () => {
        const activity = stubActivity({});
        const projectData = [[0, "start", 0, 0, [null, null, null]]];

        PracticeUI.loadProjectData(activity, projectData);

        expect(activity.sendAllToTrash).toHaveBeenCalledWith(false, true);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith(projectData);
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });

    test("clears every turtle's drawing as well", () => {
        const painter = { doClear: jest.fn() };
        const activity = stubActivity({});
        activity.turtles = { getTurtleCount: () => 2, getTurtle: () => ({ painter }) };

        PracticeUI.loadProjectData(activity, []);

        expect(painter.doClear).toHaveBeenCalledTimes(2);
    });

    test("fetches the starter file for the level and records its block count", async () => {
        const activity = stubActivity({ a: {}, b: {} });
        global.fetch = jest.fn(() => Promise.resolve({ text: () => Promise.resolve("[]") }));

        PracticeUI.loadStarterBlocks(1);
        await flushPromises();

        expect(global.fetch).toHaveBeenCalledWith("js/practice_projects/hcb_level1.tb");
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalled();
        expect(PracticeUI.starterBlockCount).toBe(2);
        delete global.fetch;
    });

    test("does nothing for a level with no starter file", () => {
        stubActivity({});
        global.fetch = jest.fn();

        PracticeUI.loadStarterBlocks(99);

        expect(global.fetch).not.toHaveBeenCalled();
        delete global.fetch;
    });

    test("does nothing when Music Blocks has not started", () => {
        global.fetch = jest.fn();

        PracticeUI.loadStarterBlocks(1);

        expect(global.fetch).not.toHaveBeenCalled();
        delete global.fetch;
    });

    test("reports a failed starter download without throwing", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        stubActivity({});
        global.fetch = jest.fn(() => Promise.reject(new Error("offline")));

        PracticeUI.loadStarterBlocks(1);
        await flushPromises();

        expect(console.error).toHaveBeenCalled();
        delete global.fetch;
    });
});

describe("PracticeUI panel shell", () => {
    test("builds a panel with a header, a close button, and a content area", () => {
        const panel = PracticeUI.createPanelShell("practice-panel", "Practice", "close-me", "body");

        expect(panel.id).toBe("practice-panel");
        expect(panel.querySelector("h3").textContent).toBe("Practice");
        expect(panel.querySelector("#close-me")).not.toBeNull();
        expect(panel.querySelector("#body")).not.toBeNull();
        expect(panel.querySelector(".practice-panel-collapse-toggle")).not.toBeNull();
    });

    test("applies the extra header class when one is given", () => {
        const panel = PracticeUI.createPanelShell("p", "T", "c", "b", "journal-header");

        expect(panel.querySelector(".practice-menu-header").className).toContain("journal-header");
    });

    test("remembers and restores where the panel was sitting", () => {
        const panel = document.createElement("div");
        panel.style.left = "120px";
        panel.style.top = "90px";
        panel.dataset.userMoved = "true";

        PracticeUI.savePanelExpandState(panel);
        panel.style.left = "0px";
        panel.style.top = "0px";
        PracticeUI.restorePanelExpandState(panel);

        expect(panel.style.left).toBe("120px");
        expect(panel.style.top).toBe("90px");
        expect(panel.dataset.userMoved).toBe("true");
    });

    test("restores a never-moved panel to its docked default", () => {
        const panel = document.createElement("div");

        PracticeUI.savePanelExpandState(panel);
        PracticeUI.restorePanelExpandState(panel);

        expect(panel.style.top).toBe("64px");
        expect(panel.style.right).toBe("0px");
        expect(panel.dataset.userMoved).toBe("false");
    });

    test("a hidden panel does not count as visible", () => {
        document.body.innerHTML = '<div id="practice-panel" style="display:none"></div>';

        expect(PracticeUI.getVisiblePanel("practice-panel")).toBeNull();
        expect(PracticeUI.getVisiblePanel("missing-panel")).toBeNull();
    });

    test("a shown panel is returned", () => {
        document.body.innerHTML = '<div id="practice-panel"></div>';

        expect(PracticeUI.getVisiblePanel("practice-panel").id).toBe("practice-panel");
    });
});

describe("ExplorerJournalUI formatting", () => {
    test("escapes HTML so a learner's note cannot inject markup", () => {
        expect(ExplorerJournalUI.escapeHTML('<img src=x onerror="1">')).toBe(
            "&lt;img src=x onerror=&quot;1&quot;&gt;"
        );
    });

    test("treats a missing value as an empty string", () => {
        expect(ExplorerJournalUI.escapeHTML(null)).toBe("");
    });

    test("formats a stored timestamp as a readable date", () => {
        expect(ExplorerJournalUI.formatDate("2026-01-15T10:00:00.000Z")).toMatch(/2026/);
    });

    test("falls back to a friendly label when the date cannot be read", () => {
        expect(ExplorerJournalUI.formatDate("not-a-date")).toBe("Saved in your journal");
    });
});

describe("ExplorerJournalUI index", () => {
    test("invites the learner to finish a lesson when the book is empty", () => {
        const container = mountJournalContent();

        ExplorerJournalUI.renderIndex();

        expect(container.textContent).toContain("Your book is waiting");
    });

    test("lists a page for each completed lesson", () => {
        PracticeManager.progress[1] = { complete: true, badges: [] };
        PracticeManager.progress[2] = { complete: true, badges: [] };
        const container = mountJournalContent();

        ExplorerJournalUI.renderIndex();

        expect(container.textContent).toContain("Page 1");
        expect(container.textContent).toContain("Page 2");
        expect(container.textContent).not.toContain("Page 3");
    });

    test("does nothing when the journal panel is not open", () => {
        document.body.innerHTML = "";

        expect(() => ExplorerJournalUI.renderIndex()).not.toThrow();
    });
});

describe("ExplorerJournalUI lesson page", () => {
    test("shows the lesson title, island, and what was learned", () => {
        const container = mountJournalContent();

        ExplorerJournalUI.renderLessonPage(1);

        expect(container.textContent).toContain("Page 1");
        expect(container.textContent).toContain("Echo Island");
        expect(container.textContent).toContain("Patterns");
    });

    test("offers a box for a new memory", () => {
        const container = mountJournalContent();

        ExplorerJournalUI.renderLessonPage(1);

        expect(container.querySelector(".journal-new-note-input")).not.toBeNull();
        expect(container.querySelector(".journal-add-note").dataset.level).toBe("1");
    });

    test("shows the notes already written on the page", () => {
        PracticeManager.saveJournalNote(PracticeProblems[0], "I heard an echo", "Why?");
        const container = mountJournalContent();

        ExplorerJournalUI.renderLessonPage(1);

        expect(container.textContent).toContain("I heard an echo");
    });

    test("going back returns to the index", () => {
        const container = mountJournalContent();
        ExplorerJournalUI.renderLessonPage(1);

        container.querySelector("#back-to-journal-index").onclick();

        expect(container.textContent).toContain("My Explorer Book");
    });

    test("does nothing for a lesson that does not exist", () => {
        const container = mountJournalContent();

        ExplorerJournalUI.renderLessonPage(99);

        expect(container.innerHTML).toBe("");
    });
});

describe("ExplorerJournalUI completion prompt", () => {
    test("offers a page to write on after a lesson is completed", () => {
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[0]);

        const prompt = document.getElementById("explorer-journal-prompt");
        expect(prompt).not.toBeNull();
        expect(prompt.textContent).toContain("What surprised you today?");
        expect(PracticeManager.getJournalPage(1)).not.toBeNull();
    });

    test("saves what the learner wrote", () => {
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[0]);
        document.getElementById("journal-prompt-note").value = "The bridge sang";

        document.getElementById("save-journal-prompt").onclick();

        expect(PracticeManager.getJournalPage(1).artifacts.notes[0].text).toBe("The bridge sang");
        expect(document.getElementById("explorer-journal-prompt")).toBeNull();
    });

    test("saves nothing when the box was left empty", () => {
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[0]);
        document.getElementById("journal-prompt-note").value = "   ";

        document.getElementById("save-journal-prompt").onclick();

        expect(PracticeManager.getJournalPage(1).artifacts.notes).toEqual([]);
    });

    test("skipping still leaves a blank page ready", () => {
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[0]);

        document.getElementById("skip-journal-prompt").onclick();

        expect(document.getElementById("explorer-journal-prompt")).toBeNull();
        expect(PracticeManager.getJournalPage(1)).not.toBeNull();
        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "Page Saved For Later"
        );
    });

    test("only one prompt is ever on screen", () => {
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[0]);
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[1]);

        expect(document.querySelectorAll("#explorer-journal-prompt")).toHaveLength(1);
    });

    test("closing the journal also closes the prompt", () => {
        ExplorerJournalUI.showCompletionPrompt(PracticeProblems[0]);

        ExplorerJournalUI.close();

        expect(document.getElementById("explorer-journal-prompt")).toBeNull();
    });
});

describe("ExplorerJournalUI new note form", () => {
    test("offers a title and a first thought", () => {
        const container = mountJournalContent();

        ExplorerJournalUI.renderNewGeneralNoteForm();

        expect(container.querySelector("#journal-general-title")).not.toBeNull();
        expect(container.querySelector("#journal-general-content")).not.toBeNull();
    });

    test("refuses to save a page with nothing on it", () => {
        const container = mountJournalContent();
        ExplorerJournalUI.renderNewGeneralNoteForm();

        container.querySelector("#journal-save-general-note").onclick();

        expect(PracticeManager.getGeneralNotes()).toEqual([]);
        expect(document.getElementById("practice-quest-notice").className).toContain("hint");
    });

    test("saves the note and opens it", () => {
        const container = mountJournalContent();
        ExplorerJournalUI.renderNewGeneralNoteForm();
        container.querySelector("#journal-general-title").value = "Sea shanties";
        container.querySelector("#journal-general-content").value = "They repeat";

        container.querySelector("#journal-save-general-note").onclick();

        const notes = PracticeManager.getGeneralNotes();
        expect(notes).toHaveLength(1);
        expect(notes[0].title).toBe("Sea shanties");
        expect(container.textContent).toContain("They repeat");
    });

    test("going back returns to the index", () => {
        const container = mountJournalContent();
        ExplorerJournalUI.renderNewGeneralNoteForm();

        container.querySelector("#back-to-journal-index").onclick();

        expect(container.textContent).toContain("My Explorer Book");
    });

    test("does nothing when the journal panel is closed", () => {
        document.body.innerHTML = "";

        expect(() => ExplorerJournalUI.renderNewGeneralNoteForm()).not.toThrow();
    });
});

describe("ExplorerJournalUI general note page", () => {
    const openNote = (title = "Ideas", text = "first") => {
        const page = PracticeManager.createGeneralNote(title, text);
        const container = mountJournalContent();
        ExplorerJournalUI.renderGeneralNotePage(page.id);
        return { page, container };
    };

    test("shows the note title and the entries already written", () => {
        const { container } = openNote("Ideas", "first");

        expect(container.querySelector("#journal-general-page-title").value).toBe("Ideas");
        expect(container.textContent).toContain("first");
    });

    test("adds another entry", () => {
        const { page, container } = openNote();
        container.querySelector(".journal-new-note-input").value = "second";

        container.querySelector(".journal-add-note").onclick();

        expect(PracticeManager.getGeneralNote(page.id).artifacts.notes).toHaveLength(2);
    });

    test("will not add a blank entry", () => {
        const { page, container } = openNote();
        container.querySelector(".journal-new-note-input").value = "   ";

        container.querySelector(".journal-add-note").onclick();

        expect(PracticeManager.getGeneralNote(page.id).artifacts.notes).toHaveLength(1);
        expect(document.getElementById("practice-quest-notice").className).toContain("hint");
    });

    test("edits an entry in place", () => {
        const { page, container } = openNote();
        const noteId = page.artifacts.notes[0].id;
        container.querySelector(`textarea[data-note-id="${noteId}"]`).value = "rewritten";

        container.querySelector(`.journal-update-note[data-note-id="${noteId}"]`).onclick();

        const notes = PracticeManager.getGeneralNote(page.id).artifacts.notes;
        expect(notes).toHaveLength(1);
        expect(notes[0].text).toBe("rewritten");
    });

    test("removes an entry", () => {
        const { page, container } = openNote();
        const noteId = page.artifacts.notes[0].id;

        container.querySelector(`.journal-delete-note[data-note-id="${noteId}"]`).onclick();

        expect(PracticeManager.getGeneralNote(page.id).artifacts.notes).toEqual([]);
    });

    test("renaming the note saves the new title", () => {
        const { page, container } = openNote();
        const input = container.querySelector("#journal-general-page-title");
        input.value = "Better name";

        input.dispatchEvent(new window.Event("change"));

        expect(PracticeManager.getGeneralNote(page.id).title).toBe("Better name");
    });

    test("deleting the whole note returns to the index", () => {
        const { page, container } = openNote();

        container.querySelector(".journal-delete-page").onclick();

        expect(PracticeManager.getGeneralNote(page.id)).toBeNull();
        expect(container.textContent).toContain("My Explorer Book");
    });

    test("falls back to the index for a note that no longer exists", () => {
        const container = mountJournalContent();

        ExplorerJournalUI.renderGeneralNotePage("gone");

        expect(container.textContent).toContain("My Explorer Book");
    });
});

describe("ExplorerJournalUI lesson page notes", () => {
    test("adds a memory to the lesson page", () => {
        const container = mountJournalContent();
        ExplorerJournalUI.renderLessonPage(1);
        container.querySelector(".journal-new-note-input").value = "The bridge sang";

        container.querySelector(".journal-add-note").onclick();

        expect(PracticeManager.getJournalPage(1).artifacts.notes[0].text).toBe("The bridge sang");
    });

    test("will not add a blank memory", () => {
        const container = mountJournalContent();
        ExplorerJournalUI.renderLessonPage(1);
        container.querySelector(".journal-new-note-input").value = "  ";

        container.querySelector(".journal-add-note").onclick();

        expect(PracticeManager.getJournalPage(1).artifacts.notes).toEqual([]);
    });

    test("edits and then removes a memory", () => {
        PracticeManager.saveJournalNote(PracticeProblems[0], "first", "Why?");
        const noteId = PracticeManager.getJournalPage(1).artifacts.notes[0].id;
        const container = mountJournalContent();
        ExplorerJournalUI.renderLessonPage(1);

        container.querySelector(`textarea[data-note-id="${noteId}"]`).value = "rewritten";
        container.querySelector(`.journal-update-note[data-note-id="${noteId}"]`).onclick();

        expect(PracticeManager.getJournalPage(1).artifacts.notes[0].text).toBe("rewritten");

        container.querySelector(`.journal-delete-note[data-note-id="${noteId}"]`).onclick();

        expect(PracticeManager.getJournalPage(1).artifacts.notes).toEqual([]);
    });
});

describe("PracticeUI panel lifecycle", () => {
    afterEach(() => {
        delete global.loadPracticeLessons;
    });

    test("opening builds the panel and shows the lesson list", async () => {
        await PracticeUI.open();

        const panel = document.getElementById("practice-panel");
        expect(panel).not.toBeNull();
        expect(panel.querySelectorAll(".level-btn")).toHaveLength(3);
    });

    test("opening a second time reuses the panel already on screen", async () => {
        await PracticeUI.open();
        document.getElementById("close-practice").onclick();

        await PracticeUI.open();

        expect(document.querySelectorAll("#practice-panel")).toHaveLength(1);
        expect(document.getElementById("practice-panel").style.display).toBe("flex");
    });

    test("closing hides the panel without destroying it", async () => {
        await PracticeUI.open();

        document.getElementById("close-practice").onclick();

        expect(document.getElementById("practice-panel").style.display).toBe("none");
    });

    test("the side tab collapses the panel and opens it again", async () => {
        await PracticeUI.open();
        const panel = document.getElementById("practice-panel");
        const toggle = panel.querySelector(".practice-panel-collapse-toggle");
        const event = { stopPropagation: () => {} };

        toggle.onclick(event);
        expect(panel.classList.contains("practice-panel-collapsed")).toBe(true);

        toggle.onclick(event);
        expect(panel.classList.contains("practice-panel-collapsed")).toBe(false);
    });

    test("bringing a panel forward raises it above the other one", () => {
        const first = document.createElement("div");
        const second = document.createElement("div");

        PracticeUI.bringPanelToFront(first);
        PracticeUI.bringPanelToFront(second);

        expect(Number(second.style.zIndex)).toBeGreaterThan(Number(first.style.zIndex));
    });

    test("warns instead of opening when the lesson file cannot be read", async () => {
        global.loadPracticeLessons = () => Promise.reject(new Error("404"));

        await PracticeUI.open();

        expect(document.getElementById("practice-panel")).toBeNull();
        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "Practice Lessons Not Ready"
        );
    });

    test("opens normally when the lesson file loads", async () => {
        global.loadPracticeLessons = () => Promise.resolve({});

        await PracticeUI.open();

        expect(document.getElementById("practice-panel")).not.toBeNull();
    });
});

describe("ExplorerJournalUI panel lifecycle", () => {
    test("opening builds the journal panel and shows the index", async () => {
        await ExplorerJournalUI.open();

        const panel = document.getElementById("explorer-journal-panel");
        expect(panel).not.toBeNull();
        expect(panel.textContent).toContain("My Explorer Book");
    });

    test("opening a second time reuses the panel already on screen", async () => {
        await ExplorerJournalUI.open();
        ExplorerJournalUI.close();

        await ExplorerJournalUI.open();

        expect(document.querySelectorAll("#explorer-journal-panel")).toHaveLength(1);
        expect(document.getElementById("explorer-journal-panel").style.display).toBe("flex");
    });

    test("its close button hides the panel", async () => {
        await ExplorerJournalUI.open();

        document.getElementById("close-explorer-journal").onclick();

        expect(document.getElementById("explorer-journal-panel").style.display).toBe("none");
    });

    test("the journal sits beside the lessons panel when both are open", async () => {
        await PracticeUI.open();
        await ExplorerJournalUI.open();

        expect(document.getElementById("explorer-journal-panel").style.right).not.toBe("");
    });
});

describe("PracticeUI extra action help cards", () => {
    beforeEach(() => {
        stubActivity({});
        // renderLevel loads the starter project; the card path does not care about the result.
        global.fetch = jest.fn(() => new Promise(() => {}));
    });

    const clickCard = async key => {
        const container = mountPracticeContent();
        PracticeUI.renderLevel(1);
        await container.querySelector(`[data-secret-help="${key}"]`).onclick();
        return container;
    };

    afterEach(() => {
        delete global.HelpWidget;
        delete global.define;
        delete global.require;
        delete global.fetch;
    });

    test("loads the lazy help widget before opening a block card", async () => {
        delete global.HelpWidget;
        global.define = Object.assign(jest.fn(), { amd: true });
        global.require = jest.fn((deps, callback) => {
            global.HelpWidget = { showBlockHelp: jest.fn(), showCard: jest.fn() };
            callback();
        });

        await clickCard("swingPendulum");

        expect(global.require).toHaveBeenCalledWith(
            ["widgets/help"],
            expect.any(Function),
            expect.any(Function)
        );
        expect(global.HelpWidget.showBlockHelp).toHaveBeenCalledWith(
            expect.anything(),
            "setheading"
        );
    });

    test("does not reload the help widget once it is already there", async () => {
        global.HelpWidget = { showBlockHelp: jest.fn(), showCard: jest.fn() };
        global.define = Object.assign(jest.fn(), { amd: true });
        global.require = jest.fn();

        await clickCard("swingPendulum");

        expect(global.require).not.toHaveBeenCalled();
        expect(global.HelpWidget.showBlockHelp).toHaveBeenCalled();
    });

    test("opens a written card through the help widget rather than a notice", async () => {
        global.HelpWidget = { showBlockHelp: jest.fn(), showCard: jest.fn() };

        await clickCard("makeLonger");

        expect(global.HelpWidget.showCard).toHaveBeenCalled();
        expect(document.getElementById("practice-quest-notice")).toBeNull();
    });

    test("falls back to a notice only when the help widget cannot be loaded", async () => {
        delete global.HelpWidget;
        global.define = Object.assign(jest.fn(), { amd: true });
        global.require = jest.fn((deps, callback) => callback());

        await clickCard("swingPendulum");

        expect(document.getElementById("practice-quest-notice").textContent).toContain(
            "Swing the pendulum"
        );
    });
});
